/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { expect, it, vi } from "vite-plus/test";

vi.stubGlobal("IS_DISCORD_DESKTOP", true);
const { retainFetchedUpdate } = await import("./common");

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(r => resolve = r);
    return { promise, resolve };
}

function makeSource() {
    return {
        getRepo: async () => "",
        listUpdates: async () => [],
        fetchUpdate: vi.fn(async () => true),
        applyUpdate: vi.fn(async () => true)
    };
}

it("rebuilds a pulled update after a failed build instead of reporting no update", async () => {
    const source = makeSource();
    source.applyUpdate.mockRejectedValueOnce(new Error("Build failed"));
    const updater = retainFetchedUpdate(source);

    expect(await updater.fetchUpdate()).toBe(true);
    await expect(updater.applyUpdate()).rejects.toThrow("Build failed");

    source.fetchUpdate.mockResolvedValue(false);
    expect(await updater.fetchUpdate()).toBe(true);
    expect(await updater.applyUpdate()).toBe(true);
    expect(await updater.fetchUpdate()).toBe(false);
});

it("still pulls while an update is pending, so a fix pushed after a broken build arrives", async () => {
    const source = makeSource();
    source.applyUpdate.mockResolvedValueOnce(false);
    const updater = retainFetchedUpdate(source);

    await updater.fetchUpdate();
    await updater.applyUpdate();
    await updater.fetchUpdate();

    expect(source.fetchUpdate).toHaveBeenCalledTimes(2);
});

it("shares one pull between overlapping fetches", async () => {
    const source = makeSource();
    const pull = deferred<boolean>();
    source.fetchUpdate.mockReturnValueOnce(pull.promise);
    const updater = retainFetchedUpdate(source);

    const tray = updater.fetchUpdate();
    const renderer = updater.fetchUpdate();
    pull.resolve(true);

    expect(await Promise.all([tray, renderer])).toEqual([true, true]);
    expect(source.fetchUpdate).toHaveBeenCalledTimes(1);
});

it("shares one build between overlapping applies", async () => {
    const source = makeSource();
    const build = deferred<boolean>();
    source.applyUpdate.mockReturnValueOnce(build.promise);
    const updater = retainFetchedUpdate(source);

    await updater.fetchUpdate();
    const renderer = updater.applyUpdate();
    const tray = updater.applyUpdate();
    build.resolve(true);

    expect(await Promise.all([renderer, tray])).toEqual([true, true]);
    expect(source.applyUpdate).toHaveBeenCalledTimes(1);
});

it("pulls only after a running build finishes, then builds what it pulled", async () => {
    const source = makeSource();
    const build = deferred<boolean>();
    source.applyUpdate.mockReturnValueOnce(build.promise);
    const updater = retainFetchedUpdate(source);

    await updater.fetchUpdate();
    const renderer = updater.applyUpdate();
    const trayFetch = updater.fetchUpdate();
    await Promise.resolve();
    expect(source.fetchUpdate).toHaveBeenCalledTimes(1);

    build.resolve(true);
    expect(await renderer).toBe(true);
    expect(await trayFetch).toBe(true);
    expect(await updater.applyUpdate()).toBe(true);
    expect(source.fetchUpdate).toHaveBeenCalledTimes(2);
    expect(source.applyUpdate).toHaveBeenCalledTimes(2);
});

it("retries a pending build when the pull fails", async () => {
    const source = makeSource();
    source.applyUpdate.mockResolvedValueOnce(false);
    const updater = retainFetchedUpdate(source);

    await updater.fetchUpdate();
    await updater.applyUpdate();
    source.fetchUpdate.mockRejectedValue(new Error("offline"));

    expect(await updater.fetchUpdate()).toBe(true);
    expect(await updater.applyUpdate()).toBe(true);
    await expect(updater.fetchUpdate()).rejects.toThrow("offline");
});
