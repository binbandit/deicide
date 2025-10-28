# deicide

A no-fuss CLI for wrangling TypeScript monorepos. It sets up your tsconfigs so everything just clicks, and keeps an eye on potential LSP hiccups. Think of it as that one tool you grab when you're tired of fighting configs.

(Oh, and pronunciation: "dee-uh-side." Like the word for offing a deity – fitting, since it's here to murder your monorepo woes.)

## Why this exists
I've spent too many hours tweaking tsconfigs in big repos, only to watch VS Code grind to a halt. deicide handles the basics: auto-generates a root tsconfig with composite refs and paths, plus per-package setups. It detects your package manager (npm, pnpm, yarn classic or berry) and throws in tips for stuff like Yarn's PnP. Right now it's v0.1 – focused on init and diagnostics – but dev and ci commands are coming to make local workflows smoother.

## Installation
Grab it from npm:

```
npm install -g deicide
```

Or if you're on pnpm/yarn, same deal. Works wherever Node is.

## Usage
Fire it up in your monorepo root (where package.json lives with workspaces defined).

### Init
Sets up tsconfigs for all your packages. Runs quick, overwrites if needed (back up first if you're paranoid).

```
deicide init
```

It'll spit out something like: "Generated tsconfig.json for 5 packages." And if you're on Yarn Berry, it'll nudge you to run their SDK setup for VS Code.

### TS Doctor
Quick check for LSP troublemakers – file count, Zod/ArkType gotchas, missing SDKs.

```
deicide ts-doctor
```

Example output:
```
TS Doctor Report:
- Package Manager: pnpm
- Files scanned: 150
- No major LSP issues detected. Your monorepo is healthy!
```

Or if there's stuff to fix: warnings with actionable advice.

Dev and CI are placeholders for now – they'll handle app startup with deps and affected-only runs soon. Stay tuned.

## Contributing
Fork it, tweak, PR. Keep it simple – we're aiming for lightweight here. If you've got ideas for the dev command (like better log grouping), hit me up.

## License
MIT – do what you want with it.

Built in a weekend because monorepos shouldn't suck this much. Feedback welcome.
