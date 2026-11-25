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
 * Overlapping calls from the tray and the renderer share one pull and one build.
 */
export function retainFetchedUpdate(source: Updater): Updater {
    let isPending = false;
    let fetching: Promise<boolean> | undefined;
    let applying: Promise<boolean> | undefined;

    return {
        ...source,
        fetchUpdate() {
            return fetching ??= source.fetchUpdate()
                .then(fetched => isPending ||= fetched)
                .finally(() => fetching = undefined);
        },
        applyUpdate() {
            return applying ??= source.applyUpdate()
                .then(applied => {
                    if (applied) isPending = false;
                    return applied;
                })
                .finally(() => applying = undefined);
        }
    };
}
