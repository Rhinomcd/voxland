# Contributing to Voxland

Voxland is a Discord client mod for people who build with coding agents. Use Claude Code, Codex, Cursor, or whatever helps you. We care about the change and the person who stands behind it, not about which tool typed it.

Agents make code cheap to write, and reviewing it is still slow. These rules keep review fair to the people who do it, and keep Discord users and upstream projects from getting hurt by what we build. Tools and models change quickly, so we revise these rules often and in the open.

## Before you write code

Bugs go in [issues](https://github.com/Rhinomcd/voxland/issues). Ideas for features and plugins go in [Ideas discussions](https://github.com/Rhinomcd/voxland/discussions/categories/ideas). Questions go in [Q&A](https://github.com/Rhinomcd/voxland/discussions/categories/q-a).

Search open PRs first. Testing someone else's PR and commenting with what you saw helps more than opening a second one.

Report Voxland bugs here, never to Vencord or Vesktop. They don't support forks, and a Voxland report there wastes their time.

## AI policy

- **A human owns every PR.** You read the whole diff before you open the PR. You can explain what it does and how it fits the rest of the code. When a reviewer asks a question, you answer it. An agent may help you draft the reply, but you send it and stand behind it.
- **Disclose the tools.** End every PR body with the model and harness that did the work, such as `Claude Opus 5.5 via Claude Code`, or `No AI`. Any model is accepted.
- **Label agent posts.** When an agent posts an issue, comment, or review for you, the post says so and names the model.
- **Test on an alt account.** Discord bans accounts that act like bots. Point agents at an alt account you set up for testing, never your main one.
- **No unattended agents.** Don't let an agent file issues or PRs here on its own. A human reads every post before it goes out. Repeated automated floods get their owner [blocked](#blocks).
- **Leave upstream alone.** Vencord, Vesktop, and Equicord are hostile to AI-assisted contributions and block contributors over them. Respect that. Don't send them Voxland work, and don't point agents at their repos or Discord servers.

<a id="rules-for-a-pr"></a>

## Rules for a PR

These rules apply to every PR, drafts included, whether a person, an agent, or both wrote it. Maintainers, the logins in [.github/TRIAGE_EXEMPTIONS.td](.github/TRIAGE_EXEMPTIONS.td), are exempt only from the open PR limit and the conflict window. Following the rules doesn't guarantee a merge, but a closed PR always gets a reason.

<a id="discuss-first"></a>

### Discuss first

Bug fixes can go straight to a PR. Link the issue if there is one.

New features, new plugins, and changes to existing behavior need a maintainer's agreement before you build them. Open an [Ideas discussion](https://github.com/Rhinomcd/voxland/discussions/categories/ideas), wait for a maintainer to approve it, and link it from the PR.

<a id="one-problem"></a>

### One problem per PR

Fix one problem or add one thing. Include every change it needs, tests and docs included. Cleanup, refactors, and a second fix go in their own PRs.

<a id="verification"></a>

### Show that it works

Say how you checked the change and what you saw. "Tests pass" and "the build is green" are not evidence. Run it in a real Discord client.

CodeRabbit and Macroscope review every PR. Fix or answer their findings before you ask for human review. If a bot hasn't posted within a day, ask for human review anyway.

UI changes need before and after screenshots. Add a short video when the change involves motion or timing. Upload them to the PR; don't commit them. Redact other people's names, avatars, and messages.

<a id="open-pr-limit"></a>

### 3 open PRs per person

You can have 3 open PRs. A fourth is closed automatically when you open it. Once one of the others is merged or closed, open a new PR from the same branch.

<a id="conflict-window"></a>

### Keep your PR mergeable

A PR that conflicts with its base branch gets a `needs-rebase` label. If it still conflicts after 7 days with no activity, it is closed.

Vouched contributors in [.github/VOUCHED.td](.github/VOUCHED.td) are exempt from the open PR limit and the conflict window. Maintainers vouch for people whose PRs keep landing cleanly.

## Plugin rules

Plugins must not hurt the people who use them or the people they talk to. Plugins inherited from Vencord predate these rules; new plugins and changes to existing ones must follow them.

- **Other people's data stays opt-in.** A plugin that sends message content, attachments, or other users' data to a third party, an LLM included, must be off by default and name the service in its description. Message content and attachments go only when the user acts on that specific message, such as clicking Translate. Never send them in the background.
- **Self-hosted services need a discussion.** Popular services like Google or GitHub are fine. A plugin that talks to a server run by the plugin's author needs maintainer approval first.
- No selfbots or API spam: animated statuses, message pruners, auto replies, Nitro snipers, quest automation, and the like.
- No FakeDeafen, FakeMute, or StereoMic.
- No plugins that interact with specific third-party Discord bots. Official Discord apps like YouTube Watch Together are fine.
- No simple slash command plugins like `/cat`. Make a [user-installable Discord app](https://discord.com/developers/docs/change-log#userinstallable-apps-preview) instead.
- No simple text replacement plugins. TextReplace covers them.
- No plugins that only hide or restyle UI. Use CSS.
- No raw DOM manipulation. Use patches and React.
- Add a dependency only when nothing in the codebase can do the job.

<a id="blocks"></a>

## Blocks

Blocks are a last resort. We block an account for harassment or for repeated, deliberate spam, such as floods of automated issues or PRs, or a second account made to get around the open PR limit. We never block for a single PR that misses the bar. We close it and say why.

A blocked account is denounced in [.github/VOUCHED.td](.github/VOUCHED.td) with the reason. Any issue or PR it opens is closed when it is opened. Blocking a maintainer also removes them from [.github/TRIAGE_EXEMPTIONS.td](.github/TRIAGE_EXEMPTIONS.td) and revokes their write access.

<a id="closure-and-reconsideration"></a>

## When your PR is closed

A PR that breaks a rule gets a notice naming the rule and how to fix it. The PR closes 72 hours later. A reply or a push in that time sends it back for another look.

Maintainers post the notice as a comment, then add the `triage:closing` label right away. Activity more than 15 seconds after the label clears it. The `triage:keep-open` label exempts a PR from every automatic rule.

After it closes, fix the problem and comment on the PR, or open a focused replacement PR that links the old one.

## Setup

Voxland builds with [Vite+](https://viteplus.dev/guide/) (`vp`). Install dependencies with `vp install`, then build with `vp run build --dev` to inject into Discord's own desktop client or `vp run buildWeb --dev` for the browser extension. [AGENTS.md](AGENTS.md) has the checks to run before a PR.

These rules are adapted from [T3 Code's](https://github.com/pingdotgg/t3code/blob/main/CONTRIBUTING.md), with credit to its maintainers.
