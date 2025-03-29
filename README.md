<div align="center">
  <img src="./public/images/BlockingMachine.png" width="200" alt="BlockingMachine Logo">

# BlockingMachine

[![CI Status](https://github.com/Greigh/BlockingMachine/actions/workflows/main.yml/badge.svg)](https://github.com/Greigh/BlockingMachine/actions/workflows/main.yml)
[![GitHub Release](https://img.shields.io/github/v/release/Greigh/BlockingMachine)](https://github.com/Greigh/BlockingMachine/releases)
[![COMMITS](https://img.shields.io/github/commit-activity/m/greigh/BlockingMachine)](https://github.com/greigh/BlockingMachine/graphs/commit-activity)
[![ISSUES](https://img.shields.io/github/issues/greigh/BlockingMachine)](https://github.com/greigh/BlockingMachine/issues)

Last Updated: March 26, 2025

---

**BlockingMachine** is a comprehensive ad-blocking and privacy protection system that converts, optimizes,
and distributes filter lists across multiple platforms. It bridges the gap between different ad-blocking
tools by providing unified, regularly updated filter lists.

</div>

## 🚀 Highlights

- **49K+** Domains Blocked
- **Daily** Updates
- **4** Filter Formats
- **Cross-Platform** Support
- **Strict** Validation

## Table of Contents

- [Features](#features)
- [Available Filters](#available-filters)
- [Quick Start](#quick-start)
- [Compatibility](#compatibility)
- [Build from Source](#build-from-source)
- [How BlockingMachine Works](#how-blockingmachine-works)
- [Chrome MV3 Impact](#chrome-mv3-impact)
- [Contributing](#contributing)

## Features

- **Multi-Platform Support**
  - DNS-level blocking (AdGuard Home, Pi-hole)
  - Browser extensions (uBlock Origin, AdGuard)
  - System-level (hosts file)
  - Mobile devices (iOS, Android)
- **Smart Rule Processing**
  - Automatic rule deduplication
  - Syntax validation
  - Format conversion
  - Performance optimization
- **Regular Updates**
  - Daily filter updates
  - Automatic GitHub Actions workflow
  - Real-time status monitoring
  - Discord notifications

## Available Filters

### Current Statistics

| Filter Type | Rule Count |
|-------------|------------|
| Browser Rules | 42,103 |
| DNS Rules | 49,055 |
| Hosts Rules | 48,412 |
| Total Unique Rules | 49,055 |

_Last Updated: March 26, 2025 at 22:35 UTC_

### Quick Subscribe Links

| Filter Type | Subscribe Link |
|-------------|---------------|
| AdGuard DNS | [Subscribe](https://raw.githubusercontent.com/Greigh/BlockingMachine/main/filters/output/adguard_dnsrewrite.txt) |
| AdGuard | [Subscribe](https://raw.githubusercontent.com/Greigh/BlockingMachine/main/filters/output/adguard.txt) |
| Browser | [Subscribe](https://raw.githubusercontent.com/Greigh/BlockingMachine/main/filters/output/browserRules.txt) |
| Hosts | [Subscribe](https://raw.githubusercontent.com/Greigh/BlockingMachine/main/filters/output/hosts.txt) |

## ⚡ Quick Start

1. **Choose Your Platform**:
   - [Browser Extension](#browser-filtering)
   - [Network-Wide](#whole-home-filtering)
   - [Mobile Device](#mobile-filtering)

2. **Copy the Filter URL**:
   | For | Use This |
   |-----|-----------|
   | AdGuard Home | `https://raw.githubusercontent.com/Greigh/BlockingMachine/main/public/filters/adguard-dns.txt` |
   | uBlock Origin | `https://raw.githubusercontent.com/Greigh/BlockingMachine/main/public/filters/browser.txt` |
   | Hosts File | `https://raw.githubusercontent.com/Greigh/BlockingMachine/main/public/filters/hosts.txt` |

3. **[Follow Setup Guide](#how-to-use)**

## Compatibility

### Browsers

- Firefox (Recommended) ✅
- Brave ✅
- Chrome (Limited MV3 Support) ⚠️
- Edge (Limited MV3 Support) ⚠️
- Safari ✅

### Mobile

- iOS 14+ ✅
- Android 8+ ✅
- iPadOS 14+ ✅

### DNS Servers

- AdGuard Home ✅
- Pi-hole (Limited) ⚠️
- NextDNS ✅

## Build from Source

### Prerequisites

- [Node.js](https://nodejs.org/en/download)(version 20 or higher)
- [npm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)(Node Package Manager)

### Installation

```sh
# Clone the repository
git clone https://github.com/greigh/BlockingMachine.git

# Navigate to project directory
cd BlockingMachine

# Install dependencies
npm install
```

### Running the Script

To run the Blocking Machine script, use the following command:

```sh
# Update filter lists
npm run update-filters

# Create new release
npm run update-release

# Debug mode
npm run debug

# Verbose logging
npm run verbose
```

### Available Scripts

| Category | Script | Description |
|----------|--------|-------------|
| **Main** | `npm run update-filters` | Updates all filter lists |
| | `npm run update-filters:ci` | Updates filters in CI environment |
| **Linting** | `npm run lint` | Runs all linters |
| | `npm run eslint` | Runs ESLint code checks |
| | `npm run mdlint` | Validates markdown files |
| | `npm run aglint` | Validates filter syntax |
| **Testing** | `npm test` | Runs all test suites |
| | `npm run test:coverage` | Generates coverage report |
| | `npm run test:watch` | Runs tests in watch mode |
| **Debug** | `npm run debug` | Enables debug logging |
| | `npm run verbose` | Enables verbose logging |

### CI/CD Workflow

BlockingMachine uses a streamlined GitHub Actions workflow that runs:

- Daily at midnight UTC
- On push to main branch
- Manually via workflow dispatch

The workflow performs these tasks:

1. **Lints & Tests**
   - ESLint for code quality
   - AGLint for filter syntax
   - MarkdownLint for documentation

2. **Updates & Deploys**
   - Downloads latest filter rules
   - Processes and optimizes rules
   - Updates GitHub Pages

3. **Notifies**
   - Posts status to Discord
   - Updates README stats
   - Generates changelog

## How BlockingMachine Works

### The Problem

Ad blockers and privacy tools often use different rule formats:

- Browser extensions use one format
- DNS blockers use another
- System-level blockers need hosts files
- Some tools need special syntax for advanced features

### Our Solution

BlockingMachine solves this by:

1. **Collecting Rules**: Gathers blocking rules from trusted sources
2. **Processing**: Converts all rules into a standard format
3. **Optimizing**: Removes duplicates and validates rules
4. **Converting**: Creates different versions for various blocking tools
5. **Distributing**: Provides ready-to-use files for different systems

### Rule Types

#### DNS Rules

```plaintext
||ads.example.com^
```

- Blocks at the domain level
- Works with AdGuard Home, Pi-hole
- Most efficient for network-wide blocking

#### Browser Rules

```plaintext
# Element hiding rules
##.ad-container
example.com##.sponsored-content

# Network rules
||ads.example.com^$script
||tracker.example.com^$third-party

# Exception rules
@@||example.com/assets^$image

# Cosmetic rules
example.com#@#.social-share
*##.cookie-notice

# Specific content blocking
||example.com^$media,domain=site.com
||ads.com^$popup,third-party
example.com##.sidebar:style(position: absolute !important;)

# Generic hiding
example.com$generichide
||example.com^$elemhide
```

- Blocks specific page elements
- Works with uBlock Origin, AdGuard
- More precise but requires browser extension
- Supports advanced filtering options

#### Hosts Rules

```plaintext
0.0.0.0 ads.example.com
```

- System-level blocking
- Works on any operating system
- No special software needed

### Daily Updates

1. Download latest rules from sources
2. Convert to standard format
3. Remove duplicates
4. Validate rules
5. Generate different versions
6. Update distribution files
7. Send notifications

## Chrome MV3 Impact

### What Changed?

Chrome switched from Manifest V2 (MV2) to Manifest V3 (MV3), which affects how browser extensions block ads and trackers.

### What to Do

1. **Best Options**:

   - Use a non-Chrome browser like Firefox or Brave
   - Use system-wide blocking (like AdGuard or Pi-hole)

2. **If You Must Use Chrome**:

   - Consider multiple layers of protection
   - Use DNS-level blocking when possible
   - Accept that some ads might get through

## 🤝 Contributing

We welcome contributions! Please follow these steps:

- [Report bugs](https://github.com/Greigh/BlockingMachine/issues)
- [Request features](https://github.com/Greigh/BlockingMachine/issues)
- [Submit pull requests](https://github.com/Greigh/BlockingMachine/pulls)

Please read our [Contributing Guidelines](./docs/CONTRIBUTING.md) before submitting changes.

---

<div align="center">
Made with ❤️ by [Daniel Hipskind](https://danielhipskind.com/) aka Greigh
</div>