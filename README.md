# Perses Shared Libraries

A monorepo containing shared UI libraries for the [Perses](https://github.com/perses/perses) project. All libraries are versioned together and published as independent npm packages under the `@perses-dev` org.

## Overview

This monorepo manages the core UI libraries that power the Perses platform. Each workspace is published as a separate npm package, but they all share the same version number to ensure compatibility.

## Packages

| Package | NPM | Description |
|---------|-----|-------------|
| [`@perses-dev/components`](./components) | [![npm version](https://badge.fury.io/js/@perses-dev%2Fcomponents.svg)](https://www.npmjs.com/package/@perses-dev/components) | Common UI components used across Perses features |
| [`@perses-dev/dashboards`](./dashboards) | [![npm version](https://badge.fury.io/js/@perses-dev%2Fdashboards.svg)](https://www.npmjs.com/package/@perses-dev/dashboards) | The dashboards feature in Perses |
| [`@perses-dev/explore`](./explore) | [![npm version](https://badge.fury.io/js/@perses-dev%2Fexplore.svg)](https://www.npmjs.com/package/@perses-dev/explore) | The explore feature in Perses |
| [`@perses-dev/plugin-system`](./plugin-system) | [![npm version](https://badge.fury.io/js/@perses-dev%2Fplugin-system.svg)](https://www.npmjs.com/package/@perses-dev/plugin-system) | The plugin system for Perses |

## Getting Started

### Prerequisites

- Node.js 22+ 
- npm 10+

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/perses/shared.git
cd shared
npm install
```

### Development

This monorepo uses [Turborepo](https://turbo.build/repo) for efficient task running and caching.

#### Build all packages

```bash
npm run build
```

#### Run tests

```bash
npm run test
```

#### Type checking

```bash
npm run type-check
```

#### Linting

```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

#### Development mode

Watch for changes and rebuild automatically:

```bash
npm run start
```

#### Clean build artifacts

```bash
# Clean all build outputs
npm run clean

# Clean and reinstall all dependencies
npm run reinstall

# Clear Turborepo cache
npm run clear-turbo-cache
```

### Linking with Local Projects

To link these shared libraries with your local Perses UI or plugins development environment, use the provided script:

```bash
./scripts/link-with-perses/link-with-perses.sh
```

The script will back up your current dependencies, build and link the shared libraries for local development. By default, it will search for the Perses UI app as a sibling directory. You can also link with plugins by using the `--plugins` flag.

For detailed usage information:

```bash
./scripts/link-with-perses/link-with-perses.sh --help
```

Common commands:

```bash
# Link with Perses UI (default, sibling directory at ../perses)
./scripts/link-with-perses/link-with-perses.sh link

# Link with Perses UI at custom location
./scripts/link-with-perses/link-with-perses.sh link --perses ~/projects/perses

# Link with plugins (sibling directory at ../plugins)
./scripts/link-with-perses/link-with-perses.sh link --plugins

# Link with plugins at custom location
./scripts/link-with-perses/link-with-perses.sh link --plugins ~/projects/plugins

# Check link status
./scripts/link-with-perses/link-with-perses.sh status --plugins

# Unlink
./scripts/link-with-perses/link-with-perses.sh unlink
```

> [!WARNING]
> As the shared dependencies are file references, you cannot build for production while linked to local shared libraries. Make sure to unlink the shared libraries before building for production.

#### Workflow for Perses UI Development

1. Clone the perses repo [https://github.com/perses/perses](https://github.com/perses/perses)
2. From the perses `ui` folder install the ui dependencies with `npm install`.
3. From the perses root folder, start the Perses API in dev mode with `./scripts/api_backend_dev.sh`.
4. Clone this shared repo and install dependencies with `npm install`. ⚠️ Do not rename the cloned repo, otherwise it breaks the paths resolution on the perses repo side.
5. From the shared root folder, run `./scripts/link-with-perses/link-with-perses.sh link`. If your perses repo is in a different location than a sibling directory, use the `--perses` option to specify its location.
6. From the perses `ui/app` folder, run `npm run start:shared` to start the Perses UI in dev mode using the linked shared libraries with hot module reloading.
7. Make changes to the shared libraries and see them reflected in your local Perses UI.
8. When done, run `./scripts/link-with-perses/link-with-perses.sh unlink` to restore the original dependencies in the Perses UI.

#### Workflow for Plugins Development

1. Clone the plugins repo [https://github.com/perses/plugins](https://github.com/perses/plugins)
2. From the plugins root folder install dependencies with `npm install`.
3. Clone this shared repo and install dependencies with `npm install`.
4. From the shared root folder, run `./scripts/link-with-perses/link-with-perses.sh link --plugins`. If your plugins repo is in a different location than a sibling directory, use the `--plugins` option with the custom path.
5. From the plugins root folder, run the appropriate development command for your plugin.
6. Make changes to the shared libraries and see them reflected in your plugins.
7. When done, run `./scripts/link-with-perses/link-with-perses.sh unlink --plugins` to restore the original dependencies in the plugins repo.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our development process and how to submit pull requests.

## Release Process

See [RELEASE.md](./RELEASE.md) for information about the release process.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](./LICENSE) file for details.

## Links

- [Perses Project](https://github.com/perses/perses)
- [Perses Documentation](https://perses.dev/)
- [Report Issues](https://github.com/perses/perses/issues)
- [Report Plugins](https://github.com/perses/plugins)
