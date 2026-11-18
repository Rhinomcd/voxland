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

import { Button } from "@components/Button";
import { CodeBlock } from "@components/CodeBlock";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { debounce } from "@shared/debounce";
import { copyWithToast } from "@utils/discord";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { search } from "@webpack";
import { React, TextInput, useMemo, useState } from "@webpack/common";

import { FullPatchInput } from "./FullPatchInput";
import { emptyReplacement, PatchPreview, ReplacementDraft } from "./PatchPreview";
import { CheatSheet, ReplacementInput } from "./ReplacementInput";

const findCandidates = debounce(function ({ find, setModule, setError }) {
    const candidates = search(find);
    const keys = Object.keys(candidates);
    const len = keys.length;

    if (len === 0)
        setError("No match. Perhaps that module is lazy loaded?");
    else if (len !== 1)
        setError("Multiple matches. Please refine your filter");
    else
        setModule([keys[0], candidates[keys[0]]]);
});

function regexLiteral({ match, flags }: ReplacementDraft) {
    return `/${match.replace(/(?<!\\)\//g, "\\/")}/${flags}`;
}

function matchError(match: string, flags: string) {
    try {
        new RegExp(match, flags);
    } catch (e) {
        return (e as Error).message;
    }
}

function indent(code: string, depth: number) {
    return code.replaceAll("\n", "\n" + "    ".repeat(depth));
}

function PatchHelper() {
    const [find, setFind] = useState("");
    const [replacements, setReplacements] = useState<ReplacementDraft[]>([emptyReplacement]);
    const [group, setGroup] = useState(false);

    const [parsedFind, setParsedFind] = useState<string | RegExp>("");

    const [findError, setFindError] = useState<string>();

    const [module, setModule] = useState<[number, Function]>();

    const code = useMemo(() => {
        const find = parsedFind instanceof RegExp ? parsedFind.toString() : JSON.stringify(parsedFind);
        const replacementCode = replacements.map(r => {
            const replace = typeof r.replace === "function" ? r.replace.toString() : JSON.stringify(r.replace);
            return `{\n    match: ${regexLiteral(r)},\n    replace: ${replace}\n}`;
        });

        return [
            "{",
            `    find: ${find},`,
            ...(group ? ["    group: true,"] : []),
            replacementCode.length === 1
                ? `    replacement: ${indent(replacementCode[0], 1)}`
                : `    replacement: [\n${replacementCode.map(c => "        " + indent(c, 2)).join(",\n")}\n    ]`,
            "}"
        ].join("\n");
    }, [parsedFind, replacements, group]);

    function onFindChange(v: string) {
        setFind(v);

        try {
            let parsedFind = v as string | RegExp;
            if (/^\/.+?\/$/.test(v)) parsedFind = new RegExp(v.slice(1, -1));

            setFindError(void 0);
            setParsedFind(parsedFind);

            if (v.length) {
                findCandidates({ find: parsedFind, setModule, setError: setFindError });
            }
        } catch (e: any) {
            setFindError((e as Error).message);
        }
    }

    function updateReplacement(index: number, change: Partial<ReplacementDraft>) {
        setReplacements(rs => rs.with(index, { ...rs[index], ...change }));
    }

    return (
        <SettingsTab>
            <Heading className={Margins.bottom8}>Full patch</Heading>
            <FullPatchInput
                setFind={onFindChange}
                setParsedFind={setParsedFind}
                setReplacements={setReplacements}
                setGroup={setGroup}
            />

            <Heading className={classes(Margins.top8, Margins.bottom8)}>Find</Heading>
            <TextInput
                type="text"
                value={find}
                onChange={onFindChange}
                error={findError}
            />

            {replacements.map((r, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <Divider className={Margins.top16} />}
                    <Heading className={classes(Margins.top8, Margins.bottom8)}>Match{r.flags && ` (flags: ${r.flags})`}</Heading>
                    <TextInput
                        type="text"
                        value={r.match}
                        onChange={match => updateReplacement(i, { match })}
                        error={matchError(r.match, r.flags)}
                    />

                    <div className={Margins.top8} />
                    <ReplacementInput
                        replacement={r.replace}
                        setReplacement={replace => updateReplacement(i, { replace })}
                    />
                    {replacements.length > 1 && (
                        <Button className={Margins.top8} variant="dangerSecondary" size="small" onClick={() => setReplacements(rs => rs.toSpliced(i, 1))}>
                            Remove replacement
                        </Button>
                    )}
                </React.Fragment>
            ))}

            <Flex className={Margins.top16}>
                <Button variant="secondary" onClick={() => setReplacements(rs => [...rs, emptyReplacement])}>
                    Add replacement
                </Button>
            </Flex>
            <FormSwitch
                className={Margins.top16}
                value={group}
                onChange={setGroup}
                title="Group"
                description="Only apply the replacements if all of them succeed"
                hideBorder
            />
            <CheatSheet />

            <Divider />
            {module && (
                <PatchPreview
                    module={module}
                    find={parsedFind}
                    group={group}
                    replacements={replacements}
                />
            )}

            {!!(find && replacements.every(r => r.match && r.replace)) && (
                <>
                    <Heading className={classes(Margins.top20, Margins.bottom8)}>Code</Heading>
                    <CodeBlock lang="js" content={code} />
                    <Flex className={Margins.top16}>
                        <Button onClick={() => copyWithToast(code)}>
                            Copy to Clipboard
                        </Button>
                        <Button onClick={() => copyWithToast("```ts\n" + code + "\n```")}>
                            Copy as Codeblock
                        </Button>
                    </Flex>
                </>
            )}
        </SettingsTab>
    );
}

export default !IS_STANDALONE ? wrapTab(PatchHelper, "PatchHelper") : null;
