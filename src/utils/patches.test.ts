/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { applyPatches, preparePatch } from "@utils/patches";
import { Patch, PatchReplacement } from "@utils/types";
import { describe, expect, it } from "vite-plus/test";

const source = 'function(e,t,n){let r="hello",o="world";return r+o}';
const wrapped = '0,function(e,t,n){let r="hello",o="world";return r+o}';

function patch(fields: Partial<Patch> & { replacement: PatchReplacement[]; }): Patch {
    return { plugin: "Test", find: '"hello"', ...fields };
}

const compile = (code: string) => (0, eval)(code) as Function;

describe("applyPatches", () => {
    it("wraps function and arrow function sources as expressions", () => {
        expect(applyPatches(source, [], -1).code).toBe(wrapped);
        expect(applyPatches("(e,t,n)=>{}", [], -1).code).toBe("0,(e,t,n)=>{}");
    });

    it("applies a matching patch and consumes it", () => {
        const p = patch({ replacement: [{ match: '"hello"', replace: '"hi"' }] });

        const result = applyPatches(source, [p], -1);

        expect(result.code).toBe('0,function(e,t,n){let r="hi",o="world";return r+o}');
        expect(result.applied).toEqual([p]);
        expect(result.consumed).toEqual([p]);
        expect(result.diagnostics).toEqual([]);
    });

    it("keeps patches with all: true for later modules", () => {
        const p = patch({ all: true, replacement: [{ match: '"hello"', replace: '"hi"' }] });

        const result = applyPatches(source, [p], -1);

        expect(result.applied).toEqual([p]);
        expect(result.consumed).toEqual([]);
    });

    it("skips and keeps a patch whose find does not match", () => {
        const p = patch({ find: "notInModule", replacement: [{ match: '"hello"', replace: '"hi"' }] });
        const regexFind = patch({ find: /notInModule/g, replacement: [{ match: '"hello"', replace: '"hi"' }] });

        const result = applyPatches(source, [p, regexFind], -1);

        expect(result.code).toBe(wrapped);
        expect(result.applied).toEqual([]);
        expect(result.consumed).toEqual([]);
        expect(result.diagnostics).toEqual([]);
    });

    it("tests a global regex find from the start of every module", () => {
        const find = /"hello"/g;
        const p = patch({ find, all: true, replacement: [{ match: '"hello"', replace: '"hi"' }] });

        find.test(source);
        expect(applyPatches(source, [p], -1).applied).toEqual([p]);
        expect(applyPatches(source, [p], -1).applied).toEqual([p]);
    });

    it("reports a replacement that does not match and consumes the patch", () => {
        const missing: PatchReplacement = { match: /notInModule/, replace: "x" };
        const p = patch({ replacement: [missing, { match: '"world"', replace: '"there"' }] });

        const result = applyPatches(source, [p], -1);

        expect(result.code).toBe('0,function(e,t,n){let r="hello",o="there";return r+o}');
        expect(result.applied).toEqual([p]);
        expect(result.consumed).toEqual([p]);
        expect(result.diagnostics).toEqual([{ type: "noEffect", patch: p, replacement: missing, code: wrapped }]);
    });

    it("suppresses the no-effect diagnostic with noWarn on the patch or the replacement", () => {
        const onPatch = patch({ noWarn: true, replacement: [{ match: /notInModule/, replace: "x" }] });
        const onReplacement = patch({ replacement: [{ match: /notInModule/, replace: "x", noWarn: true }] });

        expect(applyPatches(source, [onPatch, onReplacement], -1).diagnostics).toEqual([]);
    });

    it("undoes the whole group when one replacement has no effect", () => {
        const before = patch({ plugin: "Before", replacement: [{ match: '"world"', replace: '"there"' }] });
        const missing: PatchReplacement = { match: /notInModule/, replace: "x", noWarn: true };
        const group = patch({ plugin: "Group", group: true, replacement: [{ match: '"hello"', replace: '"hi"' }, missing] });

        const result = applyPatches(source, [before, group], -1, { compile });

        expect(result.code).toBe('0,function(e,t,n){let r="hello",o="there";return r+o}');
        expect(String(result.compiled)).toBe(result.code.slice(2));
        expect(result.applied).toEqual([before]);
        expect(result.consumed).toEqual([before, group]);
        expect(result.diagnostics).toEqual([{ type: "groupUndone", patch: group, replacement: missing, cause: "noEffect" }]);
    });

    it("undoes the whole group when one replacement errors", () => {
        const broken: PatchReplacement = { match: '"world"', replace: "(" };
        const group = patch({ group: true, replacement: [{ match: '"hello"', replace: '"hi"' }, broken] });

        const result = applyPatches(source, [group], -1, { compile });

        expect(result.code).toBe(wrapped);
        expect(result.compiled).toBeUndefined();
        expect(result.applied).toEqual([]);
        expect(result.diagnostics.map(d => d.type)).toEqual(["error", "groupUndone"]);
        expect(result.diagnostics[0]).toMatchObject({ replacement: broken, error: expect.any(SyntaxError), newCode: expect.stringContaining("o=(;") });
    });

    it("keeps earlier replacements of a non-group patch when a later one errors", () => {
        const throws: PatchReplacement = { match: '"world"', replace: () => { throw new Error("boom"); } };
        const p = patch({ replacement: [{ match: '"hello"', replace: '"hi"' }, throws] });

        const result = applyPatches(source, [p], -1, { compile });

        expect(result.code).toBe('0,function(e,t,n){let r="hi",o="world";return r+o}');
        expect(result.applied).toEqual([p]);
        expect(result.diagnostics).toEqual([{ type: "error", patch: p, replacement: throws, error: new Error("boom"), code: result.code, newCode: "" }]);
    });

    it("reads getter-backed match and replace once per replacement, inside its error handling", () => {
        let replaceReads = 0;
        const replaceGetter = { match: '"hello"', get replace() { return ++replaceReads === 1 ? '"first"' : '"second"'; } } as PatchReplacement;
        let matchReads = 0;
        const matchGetter = { get match() { if (++matchReads === 1) throw new Error("unavailable"); return '"world"'; }, replace: '"there"' } as PatchReplacement;
        const p = patch({ replacement: [replaceGetter, matchGetter, { match: '"world"', replace: '"later"' }] });

        const result = applyPatches(source, [p], -1);

        expect(result.code).toBe('0,function(e,t,n){let r="first",o="later";return r+o}');
        expect(result.diagnostics).toMatchObject([{ type: "error", replacement: matchGetter, error: new Error("unavailable") }]);
    });

    it("passes compile the plugins that patched the module so far", () => {
        const calls: string[][] = [];
        const patches = [
            patch({ plugin: "A", replacement: [{ match: '"hello"', replace: '"hi"' }] }),
            patch({ plugin: "B", replacement: [{ match: '"world"', replace: '"there"' }] }),
            patch({ plugin: "A", replacement: [{ match: "return", replace: "debugger;return" }] })
        ];

        applyPatches(source, patches, -1, { compile: (code, patchedBy) => calls.push(patchedBy) });

        expect(calls).toEqual([["A"], ["A", "B"], ["A", "B"]]);
    });

    describe("build number gating", () => {
        const ranged = patch({ fromBuild: 100, toBuild: 200, replacement: [{ match: '"hello"', replace: '"hi"' }] });

        it("consumes a patch outside its build range without applying it", () => {
            for (const build of [99, 201]) {
                const result = applyPatches(source, [ranged], build);
                expect(result.code).toBe(wrapped);
                expect(result.consumed).toEqual([ranged]);
            }
        });

        it("applies a patch inside its build range", () => {
            expect(applyPatches(source, [ranged], 100).applied).toEqual([ranged]);
            expect(applyPatches(source, [ranged], 200).applied).toEqual([ranged]);
        });

        it("ignores build ranges when the build number is unknown", () => {
            expect(applyPatches(source, [ranged], -1).applied).toEqual([ranged]);
        });

        it("skips a replacement outside its build range", () => {
            const p = patch({
                replacement: [
                    { match: '"hello"', replace: '"old"', toBuild: 149 },
                    { match: '"hello"', replace: '"new"', fromBuild: 150 }
                ]
            });

            expect(applyPatches(source, [p], 150).code).toContain('r="new"');
            expect(applyPatches(source, [p], 149).code).toContain('r="old"');
        });
    });
});

describe("preparePatch", () => {
    it("rejects a patch whose predicate returns false", () => {
        const p = patch({ predicate: () => false, replacement: [{ match: "a", replace: "b" }] });

        expect(preparePatch(p, "self")).toBe(false);
    });

    it("drops replacements whose predicate returns false", () => {
        const kept: PatchReplacement = { match: "a", replace: "b", predicate: () => true };
        const p = patch({ predicate: () => true, replacement: [kept, { match: "c", replace: "d", predicate: () => false }] });

        expect(preparePatch(p, "self")).toBe(true);
        expect(p.replacement).toEqual([kept]);
    });

    it("canonicalizes find, match and replace so applyPatches can use them", () => {
        const p: Patch = { plugin: "Test", find: '"hello"', replacement: { match: /let (\i)="hello"/, replace: "let $1=$self.greeting" } };

        preparePatch(p, "Plugin");

        expect(applyPatches(source, [p], -1).code).toBe('0,function(e,t,n){let r=Plugin.greeting,o="world";return r+o}');
    });
});
