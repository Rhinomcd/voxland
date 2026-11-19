/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Notice } from "@vencord/discord-types";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const shown: string[] = [];
let storeNotice: Notice | null = null;

const ErrorBoundary = vi.hoisted(() => () => null);
vi.mock("@components/ErrorBoundary", () => ({ default: ErrorBoundary }));
vi.mock("@webpack", () => ({ filters: { byCode: () => () => false, byProps: () => () => false }, mapMangledModuleLazy: () => ({}) }));
vi.mock("@webpack/common", () => ({
    FluxDispatcher: {
        async dispatch(action: { type: string; notice?: Notice; }) {
            if (action.type === "NOTICE_SHOW") {
                storeNotice = action.notice!;
                shown.push(String(action.notice!.message));
            } else if (action.type === "NOTICE_DISMISS" && storeNotice?.type === Notices.VENCORD_NOTICE_TYPE) {
                storeNotice = null;
                Notices.nextNotice();
            }
        }
    }
}));

vi.stubGlobal("VencordCreateElement", (type: unknown, props: object, ...children: unknown[]) => ({ type, props: { ...props, children } }));

const Notices = await import("./Notices");

describe("Notices queue", () => {
    beforeEach(() => {
        shown.length = 0;
        storeNotice = null;
        Notices.noticesQueue.length = 0;
    });

    it("shows every queued notice once when each is popped", async () => {
        for (const message of ["X", "A", "B"])
            Notices.showNotice({ message, buttonText: "OK", callback: () => { } });

        await Notices.popNotice();
        await Notices.popNotice();
        await Notices.popNotice();

        expect(shown).toEqual(["X", "A", "B"]);
        expect(Notices.currentNotice).toBeUndefined();
        expect(storeNotice).toBeNull();
    });

    it("wraps non-primitive messages in an ErrorBoundary", () => {
        const message = <span />;
        Notices.showNotice({ message, buttonText: "OK", callback: () => { } });

        expect(Notices.currentNotice?.message).toMatchObject({ type: ErrorBoundary, props: { children: [message] } });
    });
});
