/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { Patch } from "@utils/types";
import { TextArea, useEffect, useRef, useState } from "@webpack/common";

import { makeReplacementDraft, ReplacementDraft } from "./PatchPreview";

export interface FullPatchInputProps {
    setFind(v: string): void;
    setParsedFind(v: string | RegExp): void;
    setReplacements(v: ReplacementDraft[]): void;
    setGroup(v: boolean): void;
}

export function FullPatchInput({ setFind, setParsedFind, setReplacements, setGroup }: FullPatchInputProps) {
    const [patch, setPatch] = useState<string>("");
    const [error, setError] = useState<string>("");

    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    function update() {
        if (patch === "") {
            setError("");

            setFind("");
            setParsedFind("");
            setReplacements([makeReplacementDraft()]);
            setGroup(false);
            return;
        }

        try {
            const { find, replacement, group } = (0, eval)(`([${patch}][0])`) as Patch;

            if (!find) throw new Error("No 'find' field");
            if (!replacement) throw new Error("No 'replacement' field");

            const replacements = [replacement].flat();
            if (replacements.length === 0) throw new Error("Invalid replacement");

            setReplacements(replacements.map(({ match, replace }) => {
                if (!match) throw new Error("No 'replacement.match' field");
                if (replace == null) throw new Error("No 'replacement.replace' field");

                return match instanceof RegExp
                    ? makeReplacementDraft({ match: match.source, flags: match.flags, replace })
                    : makeReplacementDraft({ match, flags: "", replace });
            }));
            setFind(find instanceof RegExp ? `/${find.source}/` : find);
            setParsedFind(find);
            setGroup(!!group);
            setError("");
        } catch (e) {
            setError((e as Error).message);
        }
    }

    useEffect(() => {
        const { current: textArea } = textAreaRef;
        if (textArea) {
            textArea.style.height = "auto";
            textArea.style.height = `${textArea.scrollHeight}px`;
        }
    }, [patch]);

    return (
        <>
            <Paragraph className={Margins.bottom8}>
                Paste your full JSON patch here to fill out the fields
            </Paragraph>
            <TextArea
                inputRef={textAreaRef}
                value={patch}
                onChange={setPatch}
                onBlur={update}
            />
            {error !== "" && <Paragraph style={{ color: "var(--text-feedback-critical)" }}>{error}</Paragraph>}
        </>
    );
}
