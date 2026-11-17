# Live Discord Sessions

- Before you open Discord, ask the developer which account the Chromium profile is logged in to. Continue only with an alt account set up for testing, never their main account
- Run Chromium and use the Chrome Devtools MCP to control it
- Build the web extension with `vp run buildWeb --dev` and install it from `dist/chromium-unpacked`. Rebuild and reload as needed
- Navigate to `https://canary.discord.com/app`
- Ensure the ConsoleShortcuts plugin is enabled. Run `Vencord.Settings.plugins.ConsoleShortcuts.enabled = true` to enable it
It exports many useful helpers as `window.shortcutList`
- Ensure a user is logged in. `AuthenticationStore.getId()` should return an id once Discord loaded. If not, ask the developer to log in with their test alt. Follow the account rules in [AGENTS.md](../AGENTS.md#the-four-ways-to-cause-real-harm)

## Reverse Engineering

Discord uses React and Webpack.

Many modules are lazy-loaded, most notably most context menus and modals

ConsoleShortcuts exposes helpers for interacting with webpack, most notably:
- `wpsearch("some", "code")`: Search all webpack modules by keywords, returns record of matching module IDs and their source code
- `wreq.m[id].toString()` to read module source code
- `wreq(id)` to load the exports of a module
- `loadLazyChunks()` loads **all** lazy loaded modules. Use this sparingly, it downloads a significant amount of code.
- `getIntlMessageFromHash("hash")`: Retrieves a Discord intl message based on its hash
