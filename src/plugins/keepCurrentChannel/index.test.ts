/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const knownChannels = new Set<string>();
const transitionToGuild = vi.fn();
let stored: unknown;

vi.mock("@api/DataStore", () => ({
    get: async () => stored,
    set: async (_key: string, value: unknown) => { stored = value; }
}));
vi.mock("@webpack/common", () => ({
    ChannelStore: { hasChannel: (id: string) => knownChannels.has(id) },
    NavigationRouter: { transitionToGuild },
    SelectedChannelStore: { getChannelId: () => null },
    SelectedGuildStore: { getGuildId: () => null }
}));

const { default: plugin } = await import(".");
const flux = plugin.flux!;

async function switchAccountFrom(guildId: string | null, channelId: string | null) {
    stored = { guildId, channelId };
    await plugin.start!();
    transitionToGuild.mockClear();
    flux.LOGOUT!({ type: "LOGOUT", isSwitchingAccount: true });
    flux.CONNECTION_OPEN!({ type: "CONNECTION_OPEN" });
}

describe("KeepCurrentChannel account switch", () => {
    beforeEach(() => {
        knownChannels.clear();
        transitionToGuild.mockClear();
    });

    it("returns to the saved channel when the new account can see it", async () => {
        knownChannels.add("2");
        await switchAccountFrom("1", "2");
        expect(transitionToGuild).toHaveBeenCalledWith("1", "2");
    });

    it("goes home when the new account can't see the saved channel", async () => {
        await switchAccountFrom("1", "2");
        expect(transitionToGuild).toHaveBeenCalledWith("@me");
    });

    it("opens favorites when favorites was saved", async () => {
        await switchAccountFrom("@favorites", "2");
        expect(transitionToGuild).toHaveBeenCalledWith("@favorites");
    });

    it("doesn't navigate at startup when the saved channel is gone", async () => {
        stored = { guildId: "1", channelId: "2" };
        await plugin.start!();
        expect(transitionToGuild).not.toHaveBeenCalled();
    });
});
