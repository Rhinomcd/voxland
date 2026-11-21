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

    it("advances once when the button dismisses, by default or from a custom callback", async () => {
        const seen: unknown[] = [];
        Notices.showNotice({ message: "X" });
        Notices.showNotice({ message: "A", callback: ({ event, dismiss }) => { seen.push(event); return dismiss(); } });
        Notices.showNotice("B", undefined!, () => { });
        Notices.showNotice({ message: "C" });

        const click = () => Notices.currentNotice!.callback!({} as never);
        expect(Notices.currentNotice?.buttonText).toBe("Dismiss");
        click();
        await vi.waitFor(() => expect(Notices.currentNotice?.message).toBe("A"));

        const a = Notices.currentNotice!;
        a.callback!("click" as never);
        await vi.waitFor(() => expect(Notices.currentNotice?.message).toBe("B"));
        expect(seen).toEqual(["click"]);

        a.callback!({} as never);
        await Promise.resolve();
        expect(Notices.currentNotice?.message).toBe("B");
        expect(Notices.currentNotice?.buttonText).toBe("Dismiss");
        expect(storeNotice?.message).toBe("B");
    });

    it("keeps a generated id when the caller passes id: undefined", () => {
        Notices.showNotice({ message: "X", id: undefined });
        expect(Notices.currentNotice?.id).toEqual(expect.any(String));
    });

    it("wraps non-primitive messages in an ErrorBoundary", () => {
        const message = <span />;
        Notices.showNotice({ message, buttonText: "OK", callback: () => { } });

        expect(Notices.currentNotice?.message).toMatchObject({ type: ErrorBoundary, props: { children: [message] } });
    });
});
