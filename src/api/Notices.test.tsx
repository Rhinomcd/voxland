/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Notice } from "@vencord/discord-types";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

type NoticesModule = typeof import("./Notices");

let Notices: NoticesModule;
let storeNotice: Notice | null;
let storeAdvances: boolean;

const ErrorBoundary = vi.hoisted(() => () => null);
vi.mock("@components/ErrorBoundary", () => ({ default: ErrorBoundary }));
vi.mock("@webpack", () => ({ filters: { byCode: () => () => false, byProps: () => () => false }, mapMangledModuleLazy: () => ({}) }));
vi.mock("@webpack/common", () => ({
    FluxDispatcher: {
        async dispatch(action: { type: string; notice?: Notice; id?: string; }) {
            if (action.type === "NOTICE_SHOW") {
                storeNotice = action.notice!;
            } else if (action.type === "NOTICE_DISMISS" && storeNotice && (action.id == null || action.id === storeNotice.id)) {
                const wasVencordNotice = storeNotice.type === Notices.VENCORD_NOTICE_TYPE;
                storeNotice = null;
                if (wasVencordNotice && storeAdvances) Notices.nextNotice();
            }
        }
    }
}));

vi.stubGlobal("VencordCreateElement", (type: unknown, props: object, ...children: unknown[]) => ({ type, props: { ...props, children } }));

const show = (message: string) => Notices.showNotice({ message, buttonText: "OK", callback: () => { } });

describe("Notices queue", () => {
    beforeEach(async () => {
        vi.resetModules();
        Notices = await import("./Notices");
        storeNotice = null;
        storeAdvances = true;
    });

    it("advances one notice per pop and clears the store after the last", async () => {
        ["X", "A", "B"].forEach(show);
        expect(storeNotice?.message).toBe("X");

        for (const next of ["A", "B", undefined]) {
            await Notices.popNotice();
            expect(Notices.currentNotice?.message).toBe(next);
            expect(storeNotice?.message).toBe(next);
        }
    });

    it("advances itself when the store patch did not", async () => {
        storeAdvances = false;
        ["X", "A"].forEach(show);

        await Notices.popNotice();
        expect(Notices.currentNotice?.message).toBe("A");
        expect(storeNotice?.message).toBe("A");
    });

    it("wraps non-primitive messages in an ErrorBoundary", () => {
        const message = <span />;
        Notices.showNotice({ message, buttonText: "OK", callback: () => { } });

        expect(Notices.currentNotice?.message).toMatchObject({ type: ErrorBoundary, props: { children: [message] } });
    });
});
