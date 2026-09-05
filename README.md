# PomoTomo

**PomoTomo** is a lightweight Pomodoro timer for Windows, built with React, TypeScript, Vite, and Tauri.

Focus sessions, short breaks, and long breaks in a compact desktop app that stays out of your way.

## Features

- Configurable focus, short break, and long break durations
- Automatic or manual transitions between phases
- Session counter and progress state
- Desktop notifications
- Always-on-top mode
- Lightweight native Windows application

## Development

Requirements:

- Node.js 22 or newer
- Rust stable
- Windows development tools required by Tauri

Install dependencies and start the development server:

```bash
npm install
npm run tauri dev
```

Run the quality checks:

```bash
npm run lint
npm test
npm run build
```

## License

PomoTomo is distributed under the [MIT License](LICENSE).
