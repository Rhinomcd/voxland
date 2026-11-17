# Contributing to Voxland

Voxland is a Discord client mod for people who build with coding agents. Use Claude Code, Codex, Cursor, or whatever helps you. We care about the change and the person who stands behind it, not about which tool typed it.

Agents make code cheap to write, and reviewing it is still slow. These rules keep review fair to the people who do it, and keep Discord users and upstream projects from getting hurt by what we build.

## Before you write code

Bugs go in [issues](https://github.com/Rhinomcd/voxland/issues). Ideas for features and plugins go in [Ideas discussions](https://github.com/Rhinomcd/voxland/discussions/categories/ideas). Questions go in [Q&A](https://github.com/Rhinomcd/voxland/discussions/categories/q-a).

Search open PRs first. Testing someone else's PR and commenting with what you saw helps more than opening a second one.

Report Voxland bugs here, never to Vencord or Vesktop. They don't support forks, and a Voxland report there wastes their time.

## AI policy

- **A human owns every PR.** You read the whole diff before you open the PR. You can explain what it does and how it fits the rest of the code. When a reviewer asks a question, you answer it. An agent may help you draft the reply, but you send it and stand behind it.
- **Disclose the tools.** End every PR body with the model and harness that did the work, such as `Claude Opus 5.5 via Claude Code`, or `No AI`. Any model is accepted.
- **Label agent posts.** When an agent posts an issue, comment, or review for you, the post says so and names the model.
- **No unattended agents.** Don't let an agent file issues or PRs here on its own. A human reads every post before it goes out. Bulk automated posts get their owner [banned](#bans).
- **Leave upstream alone.** Vencord, Vesktop, and Equicord ban AI-assisted contributions. Respect that. Don't send them Voxland work, and don't point agents at their repos or Discord servers.

<a id="rules-for-a-pr"></a>

## Rules for a PR

These rules apply to every PR from outside the maintainer team, drafts included. The team is the logins in [.github/TRIAGE_EXEMPTIONS.td](.github/TRIAGE_EXEMPTIONS.td). Following the rules doesn't guarantee a review or a merge.

<a id="discuss-first"></a>

### Discuss first

A small fix for an obvious bug needs no discussion. A larger fix links the issue that shows the bug.

Everything else needs a maintainer's agreement before you start. That covers new plugins, new features, behavior changes, refactors, and dependency changes. Open an [Ideas discussion](https://github.com/Rhinomcd/voxland/discussions/categories/ideas), wait for a maintainer to approve it, and link it from the PR.

<a id="one-problem"></a>

### One problem per PR

Fix one problem or add one thing. Include every change it needs, tests and docs included. Cleanup, refactors, and a second fix go in their own PRs.

<a id="verification"></a>

### Show that it works

Say how you checked the change and what you saw. "Tests pass" and "the build is green" are not evidence. Run it in a real Discord client.

UI changes need before and after screenshots. Add a short video when the change involves motion or timing. Upload them to the PR; don't commit them. Redact other people's names, avatars, and messages.

<a id="open-pr-limit"></a>

### 3 open PRs per person

You can have 3 open PRs. A fourth is closed automatically when you open it. Get one merged or closed, then reopen it.

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

<a id="bans"></a>

## Bans

- If you flood us with automated issues or PRs, you will be banned.
- If you make reviewers' lives harder, you will be banned. Examples: repeated pings, fighting over a closure, a second account to get around a limit, or pasting agent replies you didn't read.

A banned account is denounced in [.github/VOUCHED.td](.github/VOUCHED.td) with the reason. Any issue or PR it opens is closed when it is opened.

<a id="closure-and-reconsideration"></a>

## When your PR is closed

A PR that breaks a rule gets a notice naming the rule and how to fix it. The PR closes 72 hours later. A reply or a push in that time sends it back for another look.

After it closes, fix the problem and comment on the PR, or open a focused replacement PR that links the old one.

## Setup

Voxland builds like Vencord. Install dependencies with `pnpm install`, then build with `pnpm build --dev` for the desktop app or `pnpm buildWeb --dev` for the browser extension. [AGENTS.md](AGENTS.md) has the checks to run before a PR.

These rules are adapted from [T3 Code's](https://github.com/pingdotgg/t3code/blob/main/CONTRIBUTING.md), with credit to its maintainers.
