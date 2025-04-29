<div align="center">
  <img src="../../assets/blockingmachine.png" width="200" alt="BlockingMachine Logo" />

# BlockingMachine Desktop

[![GITHUB RELEASE](https://img.shields.io/github/v/release/greigh/Blockingmachine)](https://github.com/greigh/Blockingmachine/releases)
[![LICENSE](https://img.shields.io/github/license/greigh/BlockingMachine)](LICENSE)
[![ELECTRON](https://img.shields.io/badge/built%20with-Electron-blue.svg)](https://www.electronjs.org/)
[![TYPESCRIPT](https://img.shields.io/badge/written%20in-TypeScript-3178c6.svg)](https://www.typescriptlang.org/)

_Modern, lightweight ad-blocking filter management tool for your desktop_

</div>

---

# Related Projects

- [BlockingMachine Core](https://github.com/greigh/Blockingmachine-core)
- [BlockingMachine CLI](https://github.com/greigh/Blockingmachine-cli)
- [Blockingmachine Database](https://github.com/greigh/Blockingmachine-database)

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
- **Multiple Application Support**: Export to various formats including:
  - AdGuard Home
  - AdBlock Plus
  - uBlock Origin
  - Hosts File
  - dnsmasq
  - Unbound
  - Domain List
  - Plain Text

### ⚙️ Seamless Experience
- **Automatic Updates**: Stay current with the latest app improvements
- **Cross-Platform**: Works on Windows (Beta), macOS (Beta - Stable), and Linux (Linux support coming soon)
- **Persistent Settings**: Your configuration is saved between sessions
- **Fast Processing**: Efficient handling of even large filter lists
- **User Feedback**: We welcome your feedback to improve the app
- **Community Driven**: Open-source project with contributions from the community
- **Privacy First**: No data collection, your filter lists stay local
  - While this is a local application, we do not collect any data or telemetry. Your filter lists and rules are processed entirely on your machine.
  - We may change this in the future to allow for cloud processing and **data sharing**, but this will be an opt-in feature and will be clearly communicated.
  - We are committed to transparency regarding any future changes to data handling practices.

## Installation

### macOS (Beta - Stable)
1. Download the latest `.dmg` file from [Releases](https://github.com/greigh/BlockingMachine/releases)
2. Open the `.dmg` file and drag BlockingMachine to your Applications folder
3. Open BlockingMachine from your Applications folder 
4. The app should be properly signed and notarized. If you encounter a security warning, open Privacy & Security settings, scroll to the bottom, and allow the app to run

### Windows (Beta)
1. Download the latest `.exe` installer from [Releases](https://github.com/greigh/BlockingMachine/releases)
2. Run the installer and follow the prompts
3. Launch BlockingMachine from the Start menu
4. **Note**: Windows support is currently in beta. Please see the [Windows Support](#windows-support-beta) section for more details.
5. **Known Limitations**: The Windows version may require additional permissions for filter list generation and update functionality.
6. **Reporting Windows Issues**: If you encounter issues with the Windows version, please check our [GitHub Issues](https://github.com/greigh/Blockingmachine/issues) to see if it's already reported.

### Linux (Coming Soon)
1. Download the `.AppImage` or `.deb` package from [Releases](https://github.com/greigh/BlockingMachine/releases)
2. Make the AppImage executable: `chmod +x BlockingMachine*.AppImage`
3. Run the AppImage or install the .deb package
4. **Note**: Linux support is coming soon. Please check back for updates.

## Windows Support (Beta)

The Windows version of BlockingMachine is currently in beta testing. While we've implemented all the necessary components for Windows support, it hasn't been extensively tested on all Windows configurations.

### Known Limitations

- The Windows version may require additional permissions for filter list generation and update functionality
- Some visual elements may appear differently compared to the macOS version
- The app has been tested primarily on Windows 10/11, older versions may have compatibility issues

### Windows-Specific Features

- Installation includes automatic setup of application folders
- Native Windows notifications for update alerts
- Option to run at startup (configurable in Settings)
- Context menu integration for .blocklist files

### Reporting Windows Issues

If you encounter issues with the Windows version:

1. Please check our [GitHub Issues](https://github.com/greigh/Blockingmachine/issues) to see if it's already reported
2. If not, submit a new issue with:
   - Your Windows version
   - Steps to reproduce the problem
   - Any error messages you receive
   - Screenshots if applicable

We're actively working to improve the Windows experience and appreciate your feedback during this beta phase.

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

## Development Timeline

### Current Release (v1.0.0-beta.3)
- 🚀 Core functionality implementation
- 💻 macOS (beta - stable) and Windows support (beta)
- 🔄 Automatic updates (beta)
- 🌓 Light and dark mode
- 📊 Basic statistics dashboard
- 🗄️ Multiple export formats
- 🔍 Rule filtering capabilities
- 🐞 Initial bug fixes

### Upcoming Features (v1.0.0)
- 📱 Enhanced UI responsiveness
- 🖥️ Improved Windows stability
- 🐧 Linux support
- ⚡ Performance optimizations for large lists
- 💾 Better offline capabilities
- 📝 Enhanced logging and diagnostics
- 🔔 Customizable notifications
- 🔄 Background list updates

### Future Roadmap (v2.0+)
- 🌐 Built-in network monitoring
- ☁️ Optional cloud synchronization
- 📊 Advanced analytics dashboard
- 🧩 Extension/plugin system
- 🛡️ Enhanced security features
- 🔧 Rule editor with syntax highlighting
- 🌍 Internationalization support
- 📂 Profile management for different devices/networks

### Version History

#### 1.0.0-beta.3 (Latest)
- Added initial Windows support
- Fixed critical stability issues
- Enhanced dark mode implementation
- Improved memory usage for large filter lists
- Documentation improvements
- Updated README for clarity and consistency

#### 1.0.0-beta.2
- 🎉 Initial public beta release
- Performance optimizations
- Improved UI responsiveness
- Added export to additional formats
- Fixed file handling issues
- Enhanced status reporting
- Added auto-update functionality
- Added basic dashboard statistics

#### 1.0.0-beta.1
- Initial macOS-only release
- Basic UI implementation
- Core filtering functionality
- Settings persistence
- Essential export options

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
  git clone https://github.com/greigh/BlockingMachine.git

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
This project is licensed under the BSD-3-Clause License. Read the [LICENSE](LICENSE) file for details.

<div align="center"> Made with ❤️ by <a href="https://danielhipskind.com/">Daniel Hipskind</a> </div>