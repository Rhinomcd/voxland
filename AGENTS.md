# Voxland

Voxland is a Discord client mod forked from [Vencord](https://github.com/Vendicated/Vencord). It runs in the browser as an extension and in the desktop app [voxland-desktop](https://github.com/Rhinomcd/voxland-desktop), a fork of Vesktop. Linux is the first-class platform.

Voxland exists so people can build a client mod with coding agents. Agents are welcome here, and so are their humans. This file tells you, the agent, how to work in this repo without hurting the people around it: the developer you work for, other Discord users, reviewers, and the upstream projects we fork.

## A small glossary

- **you** means the agent reading this file.
- **developer** means the human directing you. They own everything you produce.
- **maintainers** means the people listed in [.github/TRIAGE_EXEMPTIONS.td](.github/TRIAGE_EXEMPTIONS.td).
- **upstream** means Vendicated/Vencord and Vencord/Vesktop. Voxland pulls their changes in with merge PRs.

## The four ways to cause real harm

1. **Posting upstream.** Never open an issue, PR, comment, review, reaction, or discussion on Vendicated/Vencord, Vencord/Vesktop, or Equicord, and never post in their Discord servers. They ban AI-assisted contributions, and the ban falls on the developer's account. This repo is a GitHub fork of Vencord, so `gh` and the GitHub web UI may default to Vencord as the base repo. Always pass `--repo Rhinomcd/voxland` to `gh pr create`, `gh issue create`, and `gh api` writes.
2. **Driving a real Discord account.** Discord bans accounts that act like bots. Test with an alt account the developer has set up for testing. Only perform the actions your change needs to verify. Never send messages, join servers, add friends, or open DMs that the developer did not ask for. Never read, print, store, or transmit the user's Discord token.
3. **Leaking other people's data.** Messages, usernames, avatars, and attachments you see while testing belong to other people. Don't paste them into PRs, issues, logs, or prompts sent to third-party services. Redact them in screenshots.
4. **Posting as the developer without saying so.** Never make a PR, issue, or comment unless the developer asks for it. When you post anything on GitHub for them, say in the post that an agent wrote it and name the model.

## Deeper instructions

- [Live Discord sessions](.skills/discord-session.md): run Chromium for live testing and reverse engineering
- [Authoring plugins](.skills/authoring-plugins.md): write and manage plugins

## Tooling

- Use pnpm, never npm.
- Verify changes with `pnpm build --dev` and `pnpm test`, or a narrower package.json script. Always build with `--dev`.

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
