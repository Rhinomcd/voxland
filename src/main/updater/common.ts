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

import type { Updater } from ".";

export const VENCORD_FILES = [
    IS_DISCORD_DESKTOP ? "patcher.js" : "vencordDesktopMain.js",
    IS_DISCORD_DESKTOP ? "preload.js" : "vencordDesktopPreload.js",
    IS_DISCORD_DESKTOP ? "renderer.js" : "vencordDesktopRenderer.js",
    IS_DISCORD_DESKTOP ? "renderer.css" : "vencordDesktopRenderer.css",
];

export function serializeErrors(func: (...args: any[]) => any) {
    return async function () {
        try {
            return {
                ok: true,
                value: await func(...arguments)
            };
        } catch (e: any) {
            return {
                ok: false,
                error: e instanceof Error ? {
                    // prototypes get lost, so turn error into plain object
                    ...e,
                    message: e.message,
                    name: e.name,
                    stack: e.stack
                } : e
            };
        }
    };
}

/**
 * Keeps reporting a fetched update until it applies. The git updater pulls before it builds,
 * so after a failed build a second pull finds nothing and the update would never be retried.
 * Pulls and builds run one at a time, so a pull never lands under a running build,
 * and overlapping calls from the tray and the renderer share one pull or one build.
 */
export function retainFetchedUpdate(source: Updater): Updater {
    let isPending = false;
    let queue: Promise<unknown> = Promise.resolve();
    let fetching: Promise<boolean> | undefined;
    let applying: Promise<boolean> | undefined;

    function exclusive<T>(run: () => Promise<T>) {
        const result = queue.then(run);
        queue = result.catch(() => { });
        return result;
    }

    return {
        ...source,
        fetchUpdate() {
            return fetching ??= exclusive(async () => {
                try {
                    const fetched = await source.fetchUpdate();
                    isPending ||= fetched;
                } catch (e) {
                    if (!isPending) throw e;
                }
                return isPending;
            }).finally(() => fetching = undefined);
        },
        applyUpdate() {
            return applying ??= exclusive(async () => {
                const applied = await source.applyUpdate();
                if (applied) isPending = false;
                return applied;
            }).finally(() => applying = undefined);
        }
    };
}
