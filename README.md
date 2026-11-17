# Voxland

Voxland is a Discord client mod and Linux desktop app, forked from [Vencord](https://github.com/Vendicated/Vencord) and [Vesktop](https://github.com/Vencord/Vesktop). It welcomes contributions written with AI.

## Why this exists

Discord on Linux still has rough edges, especially around streaming and screen sharing. Looking for alternatives led me to Vencord, its desktop app Vesktop, and Equicord, a fork of Vencord.

All of them are hostile to AI-assisted contributions, but none of them says clearly what is and isn't allowed. The rules [differ](https://github.com/Vendicated/Vencord/blob/e75ac9ace41f6212cfaa2d5f3670830be392da4e/CONTRIBUTING.md#ai-policy) between related repos, and some sit in places a contributor [never sees](https://github.com/Vencord/Vesktop/blob/a7a0e5d5c3a021a54aeda506e2cd3ea20d5c3efb/.github/pull_request_template.md?plain=1#L1-L4). [Similar PRs](https://github.com/Vencord/Vesktop/pull/1277#issuecomment-4826510080) get [very different treatment](https://github.com/Vencord/Vesktop/pull/1292#issuecomment-5040332173). Contributors don't get a policy. They get [mocked](https://github.com/Vencord/Vesktop/pull/1265#issuecomment-4480164228) in public review threads and [blocked without warning](https://github.com/Vendicated/Vencord/blob/e75ac9ace41f6212cfaa2d5f3670830be392da4e/.github/pull_request_template.md?plain=1#L14). [Profane](https://github.com/Vencord/Vesktop/commit/3cb2a7bc1306923b60157231430c5b4e78e531da), [hostile](https://github.com/Vencord/Vesktop/blob/a7a0e5d5c3a021a54aeda506e2cd3ea20d5c3efb/.github/pull_request_template.md?plain=1#L3) commit messages and comments are routine.

Voxland takes the opposite approach. The contribution policy is written down, including exactly how AI may be used, and the repo gives agents what they need to produce good PRs. With that in place, a community working alongside agents can ship more than a handful of maintainers can on their own.

Voxland is not affiliated with Discord, Vencord, Vesktop, or Equicord.

## Ground rules for contributors

These apply to every PR, whether a person, an agent, or both wrote it.

1. **Use AI openly.** Name the models and tools you used, for example in the PR's closing attribution line. We review the change, not who or what wrote it.
2. **A human answers for every PR.** If you opened it, you own it. You must be able to explain what it changes and why, and respond to review yourself.
3. **One problem per PR.** Split independent fixes into separate PRs, even small ones.
4. **Agree on features first.** Bug fixes can go straight to a PR. New features and changes to existing behavior start as a Discussion and need a maintainer's agreement before you build them.
5. **Show that it works.** Show how you (or better yet, your agents) reproduced the problem and checked the change, and what you saw. UI changes need before-and-after screenshots. "Tests pass" on its own is not evidence.
6. **Follow AGENTS.md.** It holds the project's conventions. Point your agent at it before it starts.
7. **Every PR gets AI review.** CodeRabbit and Macroscope review each PR. Fix or answer their findings before you ask for human review.

## What maintainers commit to

1. **A written policy that keeps evolving.** These rules are a starting point, not a rulebook set in stone. Tools and models change quickly, so we revise the policy often and in the open. When a PR shows a gap, we update the docs and explain why.
2. **We make good PRs easy to write.** The repo carries what agents need: AGENTS.md, scripts that launch and check the app, CI, and AI review. When agents keep making the same mistake, we fix the repo with a lint rule, a test, or a doc instead of blaming the contributor.
3. **A reason for every closed PR.** A closed PR gets a short explanation that names the rule it broke or the problem with the change.
4. **Blocks are a last resort.** We block accounts for harassment or repeated, deliberate spam, never for a single PR that misses the bar.
5. **Professional conduct.** We critique code, not people, in reviews, comments, and commit messages alike. Everyone else is held to the same standard.

---

# Vencord

![](https://img.shields.io/github/package-json/v/Vendicated/Vencord?style=for-the-badge&logo=github&logoColor=d3869b&label=&color=1d2021&labelColor=282828)
[![Codeberg Mirror](https://img.shields.io/static/v1?style=for-the-badge&label=Codeberg%20Mirror&message=codeberg.org/Vee/cord&color=2185D0&logo=data:image/png;base64,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)](https://codeberg.org/Vee/cord)

The cutest Discord client mod

![](https://github.com/user-attachments/assets/3fac98c0-c411-4d2a-97a3-13b7da8687a2)

## Features

-   Easy to install
-   [100+ built in plugins](https://vencord.dev/plugins)
-   Fairly lightweight despite the many inbuilt plugins
-   Excellent Browser Support: Run Vencord in your Browser via extension or UserScript
-   Works on any Discord branch: Stable, Canary or PTB all work
-   Custom CSS and Themes: Inbuilt css editor with support to import any css files (including BetterDiscord themes)
-   Privacy friendly: blocks Discord analytics & crash reporting out of the box and has no telemetry
-   Maintained very actively, broken plugins are usually fixed within 12 hours
-   Settings sync: Keep your plugins and their settings synchronised between devices / apps (optional)


## Installing / Uninstalling

Visit https://vencord.dev/download

## Join our Support/Community Server

https://discord.gg/D9uwnFnqmd

## Sponsors

|     **Thanks a lot to all Vencord [sponsors](https://github.com/sponsors/Vendicated)!!**     |
| :------------------------------------------------------------------------------------------: |
|   [![](https://meow.vendicated.dev/sponsors.png)](https://github.com/sponsors/Vendicated)    |
| *generated using [github-sponsor-graph](https://github.com/Vendicated/github-sponsor-graph)* |


## Star History

<a href="https://star-history.com/#Vendicated/Vencord&Timeline">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Vendicated/Vencord&type=Timeline&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Vendicated/Vencord&type=Timeline" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Vendicated/Vencord&type=Timeline" />
  </picture>
</a>

## Disclaimer

Discord is trademark of Discord Inc. and solely mentioned for the sake of descriptivity.
Mention of it does not imply any affiliation with or endorsement by Discord Inc.

<details>
<summary>Using Vencord violates Discord's terms of service</summary>

Client modifications are against Discord’s Terms of Service.

However, Discord is pretty indifferent about them and there are no known cases of users getting banned for using client mods! So you should generally be fine as long as you don’t use any plugins that implement abusive behaviour. But no worries, all inbuilt plugins are safe to use!

Regardless, if your account is very important to you and it getting disabled would be a disaster for you, you should probably not use any client mods (not exclusive to Vencord), just to be safe

Additionally, make sure not to post screenshots with Vencord in a server where you might get banned for it

</details>
