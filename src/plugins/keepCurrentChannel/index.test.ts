/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const knownChannels = new Set<string>();
const transitionToGuild = vi.fn();
let stored: unknown;
let writeError: Error | undefined;

vi.mock("@api/DataStore", () => ({
    get: async () => stored,
    set: async (_key: string, value: unknown) => {
        if (writeError) throw writeError;
        stored = value;
    }
}));
const logError = vi.fn();
vi.mock("@utils/Logger", () => ({
    Logger: class { error = logError; }
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

describe("KeepCurrentChannel persistence", () => {
    it("starts tracking even when the first save fails", async () => {
        vi.resetModules();
        const { default: freshPlugin } = await import(".");
        stored = undefined;
        writeError = new Error("quota exceeded");
        try {
            await freshPlugin.start!();
        } finally {
            writeError = undefined;
        }
        await vi.waitFor(() => expect(logError).toHaveBeenCalledWith("Failed to save the current channel", expect.any(Error)));
        await freshPlugin.flux!.CHANNEL_SELECT!({ type: "CHANNEL_SELECT", guildId: "1", channelId: "3" });
        expect(stored).toEqual({ guildId: "1", channelId: "3" });
    });

    it("rejects CHANNEL_SELECT when the write fails, so the plugin logger records it", async () => {
        stored = { guildId: "1", channelId: "2" };
        await plugin.start!();
        writeError = new Error("quota exceeded");
        try {
            await expect(flux.CHANNEL_SELECT!({ type: "CHANNEL_SELECT", guildId: "1", channelId: "3" })).rejects.toThrow("quota exceeded");
        } finally {
            writeError = undefined;
        }
    });
});
