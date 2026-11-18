/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { applyPatches, ApplyPatchesResult, preparePatch } from "@utils/patches";
import { makeCodeblock } from "@utils/text";
import { Patch, PatchReplacement, ReplaceFn } from "@utils/types";
import { Parser, useMemo } from "@webpack/common";
import type { Change } from "diff";

// Do not include diff in standalone builds (side effects import)
if (!IS_STANDALONE) {
    var differ = require("diff") as typeof import("diff");
}

export interface ReplacementDraft {
    id: number;
    match: string;
    flags: string;
    replace: string | ReplaceFn;
}

let nextDraftId = 0;
export function makeReplacementDraft(draft: Omit<ReplacementDraft, "id"> = { match: "", flags: "", replace: "" }): ReplacementDraft {
    return { id: nextDraftId++, ...draft };
}

interface PatchPreviewProps {
    module: [id: number, factory: Function];
    find: string | RegExp;
    group: boolean;
    replacements: ReplacementDraft[];
}

const CONTEXT = 200;

function makeDiff(original: string, patched: string) {
    if (original === patched) return null;

    let start = 0;
    while (original[start] === patched[start]) start++;

    let end = 0;
    const maxEnd = Math.min(original.length, patched.length) - start;
    while (end < maxEnd && original.at(-1 - end) === patched.at(-1 - end)) end++;

    const from = Math.max(0, start - CONTEXT);
    const tail = Math.max(0, end - CONTEXT);

    return differ.diffWordsWithSpace(original.slice(from, original.length - tail), patched.slice(from, patched.length - tail));
}

function getStatus(replacement: PatchReplacement, index: number, patch: Patch, { applied, diagnostics }: ApplyPatchesResult<unknown>): [ok: boolean, text: string] {
    const error = diagnostics.find(d => d.type === "error" && d.replacement === replacement);
    if (error?.type === "error") return [false, `Error: ${error.error instanceof Error ? error.error.message : String(error.error)}`];

    const undone = diagnostics.find(d => d.type === "groupUndone");
    if (replacement === undone?.replacement || diagnostics.some(d => d.type === "noEffect" && d.replacement === replacement))
        return [false, "No effect"];

    if (undone) {
        const failedIndex = (patch.replacement as PatchReplacement[]).indexOf(undone.replacement);
        return [false, index < failedIndex ? "Rolled back with the group" : "Skipped after the group failed"];
    }

    return applied.includes(patch) ? [true, "Applied"] : [false, "Find does not match this module"];
}

function Match({ args }: { args: unknown[] | undefined; }) {
    if (!args) return null;

    const groups = args.slice(1, args.findIndex(a => typeof a === "number")) as Array<string | undefined>;

    return (
        <>
            <div style={{ userSelect: "text" }}>{Parser.parse(makeCodeblock(String(args[0]), "js"))}</div>
            {groups.length > 0 && (
                <div style={{ userSelect: "text" }}>
                    {Parser.parse(makeCodeblock(groups.map((g, i) => `Group ${i + 1}: ${g}`).join("\n"), "yml"))}
                </div>
            )}
        </>
    );
}

function Diff({ diff }: { diff: Change[] | null; }) {
    if (!diff?.length)
        return null;

    const diffLines = diff.map((p, idx) => {
        const color = p.added
            ? "lime"
            : p.removed
                ? "red"
                : "grey";

        const value = !p.added && !p.removed && p.value.length > CONTEXT * 2
            ? `${p.value.slice(0, CONTEXT)} … ${p.value.slice(-CONTEXT)}`
            : p.value;

        return (
            <div
                key={idx}
                style={{ color, userSelect: "text", wordBreak: "break-all", lineBreak: "anywhere" }}
            >
                {value}
            </div>
        );
    });

    return (
        <>
            <Heading className={Margins.bottom8}>Diff</Heading>
            {diffLines}
        </>
    );
}

export function PatchPreview({ module, find, group, replacements }: PatchPreviewProps) {
    const [id, factory] = module;

    const preview = useMemo(() => {
        let replacement: PatchReplacement[];
        try {
            replacement = replacements.map(({ match, flags, replace }) => ({ match: new RegExp(match, flags), replace }));
        } catch {
            return null;
        }

        const patch: Patch = { plugin: "YourPlugin", find, group, replacement };
        preparePatch(patch, 'Vencord.Plugins.plugins["YourPlugin"]');

        const source = String(factory);
        const matches = new Map<PatchReplacement, unknown[]>();
        const result = applyPatches(source, [patch], -1, {
            compile: code => (0, eval)(code),
            wrapReplace(_, r, rewrite) {
                const match = r.match as RegExp;
                const { lastIndex } = match;
                rewrite(match, (...args) => {
                    if (!matches.has(r)) matches.set(r, args);
                    return args[0];
                });
                match.lastIndex = lastIndex;
                return rewrite(match, r.replace);
            }
        });

        return { patch, result, matches, diff: makeDiff(applyPatches(source, [], -1).code, result.code) };
    }, [id, find, group, replacements]);

    if (!preview) return null;
    const { patch, result, matches, diff } = preview;

    return (
        <>
            <Heading className={Margins.bottom8} style={{ userSelect: "text" }}>Module {id}</Heading>

            {(patch.replacement as PatchReplacement[]).map((r, i) => {
                const [ok, status] = getStatus(r, i, patch, result);
                return (
                    <div key={i} className={Margins.bottom16}>
                        <Heading className={Margins.bottom8}>Replacement {i + 1}</Heading>
                        <Paragraph style={{ color: ok ? "var(--status-positive)" : "var(--text-feedback-critical)" }}>{status}</Paragraph>
                        <Match args={matches.get(r)} />
                    </div>
                );
            })}

            <Diff diff={diff} />
        </>
    );
}
