# Voxland

Voxland is a Discord client mod forked from [Vencord](https://github.com/Vendicated/Vencord). It runs in the browser as an extension and in the desktop app [voxland-desktop](https://github.com/Rhinomcd/voxland-desktop), a fork of Vesktop. Linux is the first-class platform.

Voxland exists so people can build a client mod with coding agents. Agents are welcome here, and so are their humans. This file tells you, the agent, how to work in this repo without hurting the people around it: the developer you work for, other Discord users, reviewers, and the upstream projects we fork.

## A small glossary

- **you** means the agent reading this file.
- **developer** means the human directing you. They own everything you produce.
- **maintainers** means the people listed in [.github/TRIAGE_EXEMPTIONS.td](.github/TRIAGE_EXEMPTIONS.td).
- **upstream** means Vendicated/Vencord and Vencord/Vesktop. Voxland pulls their changes in with merge PRs.

## The four ways to cause real harm

1. **Posting upstream.** Never open an issue, PR, comment, review, reaction, or discussion on Vendicated/Vencord, Vencord/Vesktop, or Equicord, and never post in their Discord servers. They are hostile to AI-assisted contributions and block contributors over them, and the block falls on the developer's account. This repo is a GitHub fork of Vencord. The GitHub web UI's compare page defaults to Vencord as the base repo, and so does `gh` in a clone with an `upstream` remote. Run `gh repo set-default Rhinomcd/voxland` once per clone. Pass `--repo Rhinomcd/voxland` to every `gh pr` and `gh issue` command that writes, and write `gh api` paths as `repos/Rhinomcd/voxland/...`, never `{owner}/{repo}`.
2. **Driving a real Discord account.** Discord bans accounts that act like bots. Test with an alt account the developer has set up for testing. Only perform the actions your change needs to verify. Never send messages, join servers, add friends, or open DMs that the developer did not ask for. Never read, print, store, or transmit the user's Discord token.
3. **Leaking other people's data.** Messages, usernames, avatars, and attachments you see while testing belong to other people. Don't paste them into PRs, issues, logs, or prompts sent to third-party services. Every snapshot and screenshot you take goes to your model provider, so test in a private server, and open channels or DMs with other people's content only when the developer asks. Redact them in screenshots.
4. **Posting as the developer without saying so.** Never make a PR, issue, or comment unless the developer asks for it. When you post anything on GitHub for them, say in the post that an agent wrote it and name the model.

## Deeper instructions

- [Live Discord sessions](.skills/discord-session.md): run Chromium for live testing and reverse engineering
- [Authoring plugins](.skills/authoring-plugins.md): write and manage plugins

## Tooling

- Use Vite+ (`vp`), never pnpm or npm directly. `vp install` installs, `vp run <script>` runs a package.json script.
- Verify changes with `vp run build --dev` and `vp run test`, or a narrower package.json script. Always build with `--dev`.

## Unit tests

- `vp test` runs the Vitest unit tests once; `vp test watch` reruns them on change. `vp run test`, which CI runs, includes them.
- Put a test next to the code it covers as `src/**/<name>.test.ts`, import from `vite-plus/test`, and use the `@utils/...` path aliases.
- Unit-test pure code only. Tests run in Node with no Discord, webpack, or build-time globals such as `IS_DEV`.
- To check a patch without Discord, run it through `preparePatch` and then `applyPatches` (both in `@utils/patches`) against an inline module source. See `src/utils/patches.test.ts`.

## Offline patch check

`vp run checkPatches` runs every plugin's patches, as the reporter registers them, through `applyPatches` against saved Discord modules, without Discord. It prints `FAIL <Plugin>: …` for each patch whose find matches no module (including `all` patches, which the reporter doesn't flag), whose replacement has no effect, or whose result doesn't compile, and exits non-zero. Patches with `fromBuild`/`toBuild` print the module they matched, or that the saved build is outside their range.

The saved modules are Discord's code, so they stay out of git in `patch-fixtures/`. Refresh them when Discord updates:

1. `vp run buildReporterDesktop`, a non-dev build with the reporter.
2. Start voxland-desktop with `vencordDir` set to this repo's `dist`. The reporter loads every chunk and logs `[Reporter] Saved N patch fixtures to …` before `Finished test`.
3. `vp run build --dev` to go back to a dev build.

A run writes `patch-fixtures/<build number>.json`: an array of `[moduleId, source]` pairs, the original source of each module a patch's find matched, in the order Discord loaded them. The check applies patches in that order, as the runtime does, because a patch is used up by the first module its find matches. Captures from other builds, such as canary, sit beside it, and the check runs against each.

## Style

- Write clean, simple code:
  - Add an abstraction only when it gives clear value. Don't future-proof.
  - Handle only the cases that can happen. Don't over-engineer for hypothetical edge cases.
- Before adding common logic, search the codebase (especially `src/utils`) for an existing implementation. If one exists but isn't exported, extract it into a util.
- Add a comment only for context the code can't show. Use single-line comments.
- Add JSDoc only to common API in `src/api` and `src/utils`, never in plugins.
- Prefer functions and plain objects over classes.

## Plugins

Plugins must follow the [plugin rules](CONTRIBUTING.md#plugin-rules). The rule agents most often miss: a plugin that sends message content, attachments, or other users' data to a third party, an LLM included, must be off by default and name the service. Message content goes only when the user acts on that specific message.

## Pull requests

- Follow [CONTRIBUTING.md](CONTRIBUTING.md). The rules apply to agent-written PRs exactly as they apply to human ones.
- A new feature, new plugin, or change to existing behavior needs a maintainer-approved [Ideas discussion](https://github.com/Rhinomcd/voxland/discussions/categories/ideas). Link it. A bug fix doesn't.
- One problem per PR.
- Titles follow the repo's convention: `PluginName: what changed`, or a plain sentence for core changes.
- Use the [PR template](.github/pull_request_template.md). Show how you verified the change on a real Discord client. "Tests pass" is not evidence.
- End the PR body with the model and harness that did the work.
- Review comments go to the developer to answer. You may draft a reply. They post it and stand behind it.
