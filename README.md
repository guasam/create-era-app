# create-electron-react-app

A CLI tool to quickly create modern Electron applications with React, TypeScript, Vite, and TailwindCSS.

## Quick Start

```bash
# Create a new project
npx create-electron-react-app my-app

# Or with specific options
npx create-electron-react-app my-app --yes --no-git
```



## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--yes` | Skip prompts and use defaults | `false` |
| `--no-git` | Skip git initialization | `true` |
| `--no-install` | Skip dependency installation | `true` |

## What You Get

A fully configured Electron application with:

- **Electron** - Cross-platform desktop framework
- **React** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **Shadcn UI** - Beautiful component library
- **Conveyor** - Type-safe IPC communication
- **Custom Window** - Custom titlebar and controls
- **Dark/Light Mode** - Built-in theme switching
- **Hot Reload** - Instant development feedback

## Development

```bash
cd my-app
npm run dev          # Start development server
npm run build:win    # Build for Windows
npm run build:mac    # Build for macOS
npm run build:linux  # Build for Linux
```

## Documentation

For detailed information about the generated application structure, features, and usage, see the [Electron React App repository](https://github.com/guasam/electron-react-app).

## License

MIT License - see [LICENSE](https://github.com/guasam/electron-react-app/blob/main/LICENSE) file for details.
