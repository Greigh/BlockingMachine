<div align="center">
  <img src="../../assets/blockingmachine.png" width="200" alt="BlockingMachine Logo" />

# BlockingMachine Desktop

[![GitHub Release](https://img.shields.io/github/v/release/danielhipskind/BlockingMachine)](https://github.com/danielhipskind/BlockingMachine/releases)
[![License](https://img.shields.io/github/license/danielhipskind/BlockingMachine)](LICENSE)
[![Electron](https://img.shields.io/badge/built%20with-Electron-blue.svg)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/written%20in-TypeScript-3178c6.svg)](https://www.typescriptlang.org/)

_Modern, lightweight ad-blocking filter management tool for your desktop_

</div>

---

## Features

### 🚀 Advanced Filter Management
- **Multiple Filter Sources**: Import and manage filter lists from various sources
- **Custom Rules**: Add your own custom blocking rules alongside existing lists
- **Smart Deduplication**: Automatically removes duplicate rules to optimize performance
- **Rule Statistics**: View detailed information about processed rules

### 💡 User-Friendly Interface
- **Light & Dark Mode**: Adapts to your system theme or choose your preference
- **Modern UI**: Clean, intuitive interface with responsive design
- **Interactive Dashboard**: Visualize your filter statistics
- **Progress Tracking**: Real-time progress indicators during processing

### 🔄 Export Flexibility
- **Multiple Formats**: Export to various formats including:
  - AdGuard Home
  - AdBlock Plus
  - Hosts File
  - dnsmasq
  - Unbound
  - Domain List
  - Plain Text

### ⚙️ Seamless Experience
- **Automatic Updates**: Stay current with the latest app improvements
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Persistent Settings**: Your configuration is saved between sessions
- **Fast Processing**: Efficient handling of even large filter lists

## Installation

### macOS
1. Download the latest `.dmg` file from [Releases](https://github.com/danielhipskind/BlockingMachine/releases)
2. Open the `.dmg` file and drag BlockingMachine to your Applications folder
3. Open BlockingMachine from your Applications folder

### Windows
1. Download the latest `.exe` installer from [Releases](https://github.com/danielhipskind/BlockingMachine/releases)
2. Run the installer and follow the prompts
3. Launch BlockingMachine from the Start menu

### Linux
1. Download the `.AppImage` or `.deb` package from [Releases](https://github.com/danielhipskind/BlockingMachine/releases)
2. Make the AppImage executable: `chmod +x BlockingMachine*.AppImage`
3. Run the AppImage or install the .deb package

## Quick Start

1. **Add Filter Sources**
   - Navigate to the Sources tab
   - Add popular filter lists or custom sources
   - Enable the sources you want to use

2. **Add Custom Rules (Optional)**
   - Navigate to the Custom Rules tab
   - Add any specific rules you need

3. **Process Rules**
   - Go to the Process tab
   - Click "Generate Filter Lists"
   - Wait for processing to complete

4. **Use Your Generated List**
   - Find your exported file in the configured save location
   - Import it into your ad-blocker or DNS blocker of choice

## Screenshot Gallery

![Dashboard](../../assets/screenshots/dashboard.png)
![Sources Management](../../assets/screenshots/sources.png)
![Rule Processing](../../assets/screenshots/processing.png)
![Settings Panel](../../assets/screenshots/settings.png)

## Advanced Usage

### Managing Filter Sources

```json
// Example filter source structure
{
  "name": "EasyList",
  "url": "https://easylist.to/easylist/easylist.txt",
  "enabled": true
}
```

### Custom Rules Syntax 

BlockingMachine supports standard AdGuard/AdBlock Plus syntax:

```bash
  ! Comment line (ignored)
  ||example.com^
  @@||whitelisted-domain.com^
  domain.com/ads/*
```

### Export Format Details

| Format    | Description               | Best For                  |
| --------- | ------------------------- | ------------------------- |
| `adguard` | AdGuard Home compatible   | AdGuard Home, AdGuard DNS |
| `abp`     | AdBlock Plus compatible   | Browser extensions        |
| `hosts`   | Hosts file format         | System-level blocking     |
| `dnsmasq` | dnsmasq configuration     | Routers, Pi-hole          |
| `unbound` | Unbound DNS configuration | Custom DNS servers        |
| `domains` | Simple domain list        | DNS blocklists            |
| `plain`   | Raw text list             | Custom implementations    |

## Troubleshooting

### Common Issues

1. **Application doesn't start**
   - Check for error logs in the console
   - Verify your system meets the minimum requirements
   - Try reinstalling the application

2. **Filter processing fails**
   - Check your internet connection
   - Verify that filter source URLs are valid and accessible
   - Try with fewer sources if processing large lists

3. **Export file not generated**
   - Ensure you have write permissions to the save location
   - Check for error messages in the application
   - Try choosing a different save location

### Debug Mode

Run BlockingMachine in debug mode to view detailed logs:

```bash
  # macOS/Linux
  DEBUG=blockingmachine:* /Applications/BlockingMachine.app/Contents/MacOS/BlockingMachine

  # Windows
  set DEBUG=blockingmachine:* & "C:\Program Files\BlockingMachine\BlockingMachine.exe"
```

## Building From Source

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Git

### Setup

  ```bash
  # Clone the repository
  git clone https://github.com/danielhipskind/BlockingMachine.git

  # Navigate to the electron app directory
  cd BlockingMachine/packages/electron-app

  # Install dependencies
  npm install

  # Start the development server
  npm start

  # Build the application
  npm run make
  
## Build Options

``` bash
  # Build for macOS
  npm run make -- --platform=darwin

  # Build for Windows
  npm run make -- --platform=win32

  # Build for Linux
  npm run make -- --platform=linux
```

## Contributing

We welcome contributions to BlockingMachine Desktop! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

Please read our Contributing Guide for more details.

### Code Style

We use ESLint and Prettier to maintain code quality. Before submitting a pull request:

```bash
# Run linter
  npm run lint

  # Fix linting issues automatically
  npm run lint:fix
```

### Technology Stack

- **Electron**: Cross-platform desktop application framework
- **React**: UI library for building interactive interfaces
- **TypeScript**: Type-safe JavaScript
- **Recharts**: Responsive charting library
- **Electron Store**: Persistent settings storage
- **@blockingmachine/core**: Core rule processing functionality

## License
This project is licensed under the BSD-3-Clause License.

## Related Projects

- [BlockingMachine Core](https://github.com/danielhipskind/BlockingMachine/tree/main/packages/core) - Core functionality library
- [BlockingMachine CLI](https://github.com/danielhipskind/BlockingMachine/tree/main/packages/cli) - Command line interface

<div align="center"> Made with ❤️ by <a href="https://danielhipskind.com/">Daniel Hipskind</a> </div>