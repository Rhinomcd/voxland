/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { runtimeHashMessageKey } from "./intlHash";
import { Patch, PatchReplacement, ReplaceFn } from "./types";

export function canonicalizeMatch<T extends RegExp | string>(match: T): T {
    let partialCanon = typeof match === "string" ? match : match.source;
    partialCanon = partialCanon.replaceAll(/#{intl::([\w$+/]*)(?:::(\w+))?}/g, (_, key, modifier) => {
        const hashed = modifier === "raw" ? key : runtimeHashMessageKey(key);

        const isString = typeof match === "string";
        const hasSpecialChars = !Number.isNaN(Number(hashed[0])) || hashed.includes("+") || hashed.includes("/");

        if (hasSpecialChars) {
            return isString
                ? `["${hashed}"]`
                : String.raw`(?:\["${hashed}"\])`.replaceAll("+", "\\+");
        }

        return isString ? `.${hashed}` : String.raw`(?:\.${hashed})`;
    });

    if (typeof match === "string") {
        return partialCanon as T;
    }

    const canonSource = partialCanon.replaceAll(/(\\*)\\i/g, (match, leadingEscapes) =>
        leadingEscapes.length % 2 === 0
            ? `${leadingEscapes}${String.raw`(?:[A-Za-z_$][\w$]*)`}`
            : match.slice(1)
    );
    const canonRegex = new RegExp(canonSource, match.flags);
    canonRegex.toString = match.toString.bind(match);

    return canonRegex as T;
}

export function canonicalizeReplace<T extends string | ReplaceFn>(replace: T, pluginPath: string): T {
    if (typeof replace !== "function")
        return replace.replaceAll("$self", pluginPath) as T;

    return ((...args) => replace(...args).replaceAll("$self", pluginPath)) as T;
}

export function canonicalizeDescriptor<T>(descriptor: TypedPropertyDescriptor<T>, canonicalize: (value: T) => T) {
    if (descriptor.get) {
        const original = descriptor.get;
        descriptor.get = function () {
            return canonicalize(original.call(this));
        };
    } else if (descriptor.value) {
        descriptor.value = canonicalize(descriptor.value);
    }
    return descriptor;
}

export function canonicalizeReplacement(replacement: Pick<PatchReplacement, "match" | "replace">, pluginPath: string) {
    const descriptors = Object.getOwnPropertyDescriptors(replacement);
    descriptors.match = canonicalizeDescriptor(descriptors.match, canonicalizeMatch);
    descriptors.replace = canonicalizeDescriptor(
        descriptors.replace,
        replace => canonicalizeReplace(replace, pluginPath),
    );
    Object.defineProperties(replacement, descriptors);
}

export function canonicalizeFind(patch: Patch) {
    const descriptors = Object.getOwnPropertyDescriptors(patch);
    descriptors.find = canonicalizeDescriptor(descriptors.find, canonicalizeMatch);
    Object.defineProperties(patch, descriptors);
}

/**
 * Canonicalizes a plugin's patch in place and drops replacements whose predicate returns false.
 * @returns false if the patch's own predicate returns false and it should not be registered
 */
export function preparePatch(patch: Patch, pluginPath: string) {
    if (patch.predicate && !patch.predicate()) return false;

    canonicalizeFind(patch);
    if (!Array.isArray(patch.replacement)) {
        patch.replacement = [patch.replacement];
    }

    for (const replacement of patch.replacement) {
        canonicalizeReplacement(replacement, pluginPath);
    }

    patch.replacement = patch.replacement.filter(({ predicate }) => !predicate || predicate());

    return true;
}

export type PatchDiagnostic =
    | { type: "noEffect"; patch: Patch; replacement: PatchReplacement; code: string; }
    | { type: "error"; patch: Patch; replacement: PatchReplacement; error: unknown; code: string; newCode: string; }
    | { type: "groupUndone"; patch: Patch; replacement: PatchReplacement; cause: "noEffect" | "error"; };

export interface ApplyPatchesOptions<T> {
    /** Turns patched code into what the caller runs, such as an evaluated factory. A throw rejects the replacement like a failed replace. */
    compile?(code: string, patchedBy: string[]): T;
    /** Wraps each replacement's string rewrite, for example to time it. */
    wrapReplace?(patch: Patch, replacement: PatchReplacement, replace: () => string): string;
}

export interface ApplyPatchesResult<T> {
    /** The patched factory code, as an expression starting with `0,` */
    code: string;
    /** The compile result for {@link code}, or undefined if no replacement was kept */
    compiled: T | undefined;
    /** Patches with at least one kept replacement, in application order */
    applied: Patch[];
    /** Patches to remove from the patch list: matched patches without `all`, and patches outside the build range */
    consumed: Patch[];
    diagnostics: PatchDiagnostic[];
}

function isOutsideBuild({ fromBuild, toBuild }: Pick<Patch, "fromBuild" | "toBuild">, buildNumber: number) {
    return buildNumber !== -1 && ((fromBuild != null && buildNumber < fromBuild) || (toBuild != null && buildNumber > toBuild));
}

/**
 * Applies patches to a webpack module factory's source without side effects beyond the patches' own replace functions.
 * Patches must be prepared with {@link preparePatch}.
 *
 * @param source The module factory source, as returned by String(factory)
 * @param buildNumber The Discord build number, or -1 to skip build range checks
 */
export function applyPatches<T = undefined>(
    source: string,
    patches: readonly Patch[],
    buildNumber: number,
    { compile, wrapReplace }: ApplyPatchesOptions<T> = {}
): ApplyPatchesResult<T> {
    const isArrowFunction = source.startsWith("(");
    // 0, prefix to turn it into an expression: 0,function(){} would be invalid syntax without the 0,
    let code = "0," + (isArrowFunction ? "" : "function") + source.slice(source.indexOf("("));
    let compiled: T | undefined;

    const applied: Patch[] = [];
    const consumed: Patch[] = [];
    const diagnostics: PatchDiagnostic[] = [];

    for (const patch of patches) {
        if (isOutsideBuild(patch, buildNumber)) {
            consumed.push(patch);
            continue;
        }

        const moduleMatches = typeof patch.find === "string"
            ? source.includes(patch.find)
            : (patch.find.global && (patch.find.lastIndex = 0), patch.find.test(source));

        if (!moduleMatches) continue;

        const previousCode = code;
        const previousCompiled = compiled;
        let patchApplied = false;
        let undoGroup = false;

        // PluginManager normalizes patch.replacement to an array
        for (const replacement of patch.replacement as PatchReplacement[]) {
            if (isOutsideBuild(replacement, buildNumber)) continue;

            const { match } = replacement;
            const replace = () => {
                if (typeof match !== "string" && match.global) {
                    match.lastIndex = 0;
                }

                return code.replace(match, replacement.replace as string);
            };

            let newCode = "";
            try {
                newCode = wrapReplace ? wrapReplace(patch, replacement, replace) : replace();

                if (newCode === code) {
                    if (!(patch.noWarn || replacement.noWarn)) {
                        diagnostics.push({ type: "noEffect", patch, replacement, code });
                    }

                    if (patch.group) {
                        diagnostics.push({ type: "groupUndone", patch, replacement, cause: "noEffect" });
                        undoGroup = true;
                        break;
                    }

                    continue;
                }

                if (compile) {
                    compiled = compile(newCode, [...new Set([...applied, patch].map(p => p.plugin))]);
                }

                if (!patchApplied) {
                    applied.push(patch);
                    patchApplied = true;
                }

                code = newCode;
            } catch (error) {
                diagnostics.push({ type: "error", patch, replacement, error, code, newCode });

                if (patch.group) {
                    diagnostics.push({ type: "groupUndone", patch, replacement, cause: "error" });
                    undoGroup = true;
                    break;
                }
            }
        }

        if (undoGroup) {
            code = previousCode;
            compiled = previousCompiled;

            if (patchApplied) {
                applied.pop();
            }
        }

        if (!patch.all) {
            consumed.push(patch);
        }
    }

    return { code, compiled, applied, consumed, diagnostics };
}
