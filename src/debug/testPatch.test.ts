/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { applyPatches } from "@utils/patches";
import { describe, expect, it, vi } from "vite-plus/test";

const factorySource = "(e,t,n)=>{n.label=`first\nsecond`}";

vi.mock("@webpack", () => ({
    search: () => ({ 1: { toString: () => factorySource } })
}));

const { testPatch } = await import("./testPatch");

describe("testPatch", () => {
    it("matches across newlines like the runtime patcher", () => {
        const patch = { plugin: "Test", find: "n.label", replacement: { match: "first\nsecond", replace: "joined" } };

        const result = testPatch(patch);

        expect(result).toMatchObject({ ok: true, moduleId: "1" });
        expect(result.ok && result.patchedSource).toBe(applyPatches(factorySource, [patch], -1).code);
    });
});
