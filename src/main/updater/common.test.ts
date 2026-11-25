/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { expect, it, vi } from "vite-plus/test";

vi.stubGlobal("IS_DISCORD_DESKTOP", true);
const { retainFetchedUpdate } = await import("./common");

it("rebuilds a pulled update after a failed build instead of reporting no update", async () => {
    const source = {
        getRepo: async () => "",
        listUpdates: async () => [],
        fetchUpdate: vi.fn(async () => true),
        applyUpdate: vi.fn(async () => false)
    };
    const updater = retainFetchedUpdate(source);

    expect(await updater.fetchUpdate()).toBe(true);
    expect(await updater.applyUpdate()).toBe(false);

    source.fetchUpdate.mockResolvedValue(false);
    source.applyUpdate.mockResolvedValue(true);

    expect(await updater.fetchUpdate()).toBe(true);
    expect(await updater.applyUpdate()).toBe(true);
    expect(await updater.fetchUpdate()).toBe(false);
});
