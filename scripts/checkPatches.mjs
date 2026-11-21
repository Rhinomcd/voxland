/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// @ts-check

import esbuild from "esbuild";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import vm from "vm";

// common.mjs reads build flags from argv; --reporter makes globPlugins include every plugin, as the reporter build does
process.argv.push("--reporter");
const { commonOpts, commonRendererPlugins, globPlugins } = await import("./build/common.mjs");

const FIXTURES_DIR = "patch-fixtures";

const fixtureFiles = (await readdir(FIXTURES_DIR).catch(() => [])).filter(f => f.endsWith(".json"));
if (!fixtureFiles.length) {
    console.error(`No fixtures in ${FIXTURES_DIR}/. Capture them with a desktop reporter run, see AGENTS.md.`);
    process.exit(1);
}

const { outputFiles } = await esbuild.build({
    ...commonOpts,
    logLevel: "warning",
    minify: false,
    sourcemap: false,
    legalComments: "none",
    write: false,
    outdir: "dist/checkPatches",
    loader: { ".css": "empty" },
    format: "iife",
    globalName: "PatchCheck",
    stdin: {
        // ~plugins goes first, as in Vencord.ts, so plugins load before the APIs they use
        contents: `
            import "~plugins";
            export { initPluginManager } from "@api/PluginManager";
            export { isSuppressedPatchError, patches } from "@webpack/patcher";
            export { applyPatches, isOutsideBuild } from "@utils/patches";
        `,
        resolveDir: "./src",
        loader: "ts",
    },
    plugins: [globPlugins("vesktop"), ...commonRendererPlugins],
    define: {
        IS_STANDALONE: "true",
        IS_DEV: "false",
        IS_REPORTER: "true",
        IS_ANTI_CRASH_TEST: "false",
        IS_UPDATER_DISABLED: "true",
        IS_WEB: "false",
        IS_EXTENSION: "false",
        IS_USERSCRIPT: "false",
        IS_DISCORD_DESKTOP: "false",
        IS_VESKTOP: "true",
        VERSION: '"0.0.0"',
        BUILD_TIMESTAMP: "0",
        DESKTOP_MONACO_EDITOR_URL: '""',
    },
});

// Plugin modules touch browser globals at load time; any access to these returns a no-op stub
const stub = new Proxy(function () { }, {
    get: (_, key) => key === Symbol.toPrimitive ? () => "" : stub,
    apply: () => stub,
    construct: () => stub,
});
const g = /** @type {any} */ (globalThis);
g.window = g;
for (const name of ["document", "navigator", "localStorage", "location", "VencordNative", "VesktopNative", "Worker", "MutationObserver", "HTMLElement", "Element", "Node"]) {
    Object.defineProperty(g, name, { value: stub, configurable: true });
}
vm.runInThisContext(outputFiles[0].text);

/** @type {{ initPluginManager(): void; patches: import("../src/utils/types").Patch[]; applyPatches: typeof import("../src/utils/patches").applyPatches; isOutsideBuild: typeof import("../src/utils/patches").isOutsideBuild; isSuppressedPatchError: typeof import("../src/webpack/patchWebpack").isSuppressedPatchError; }} */
const { initPluginManager, patches, applyPatches, isOutsideBuild, isSuppressedPatchError } = g.PatchCheck;
initPluginManager();
const registered = [...patches];

let failures = 0;
const fail = (/** @type {string} */ message) => {
    failures++;
    console.log(`FAIL ${message}`);
};

for (const fixtureFile of fixtureFiles) {
    const build = fixtureFile.replace(/\.json$/, "");
    const buildNumber = Number(build);
    /** @type {Array<[moduleId: string, source: string]>} */
    const modules = JSON.parse(await readFile(join(FIXTURES_DIR, fixtureFile), "utf-8"));
    const pending = [...registered];
    const matchedPatches = new Set();

    console.log(`Build ${build}: ${registered.length} patches against ${modules.length} modules`);

    for (const [moduleId, source] of modules) {
        const { matched, consumed, diagnostics } = applyPatches(source, pending, buildNumber, { compile: code => new vm.Script(code) });

        for (const patch of consumed) {
            pending.splice(pending.indexOf(patch), 1);
        }

        for (const d of diagnostics) {
            if (d.type === "noEffect") fail(`${d.patch.plugin}: ${d.replacement.match} had no effect (module ${moduleId})`);
            if (d.type === "error" && !isSuppressedPatchError(d.patch, d.error)) fail(`${d.patch.plugin}: ${d.replacement.match} errored (module ${moduleId}): ${d.error}`);
        }

        for (const patch of matched) {
            matchedPatches.add(patch);
            if (patch.fromBuild != null || patch.toBuild != null) {
                console.log(`     ${patch.plugin}: build-ranged patch ${patch.find} matched module ${moduleId}`);
            }
        }
    }

    for (const patch of registered) {
        if (isOutsideBuild(patch, buildNumber)) {
            console.log(`     ${patch.plugin}: build-ranged patch ${patch.find} skipped, outside build ${build}`);
        } else if (!matchedPatches.has(patch)) {
            fail(`${patch.plugin}: ${patch.find} found no module`);
        }
    }
}

console.log(failures ? `${failures} patch failures` : "All patches apply");
process.exit(failures ? 1 : 0);
