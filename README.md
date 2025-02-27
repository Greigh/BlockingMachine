<div align="center">
  <img src="./public/images/BlockingMachine.png" width="200" alt="BlockingMachine Logo">

# BlockingMachine

[![UPDATEFILTERS](https://img.shields.io/github/actions/workflow/status/badges/shields/updatefilters.yml?label=Filter%20Updates)](https://github.com/Greigh/BlockingMachine/blob/main/.github/workflows/updatefilters.yml)
[![ESLint](https://github.com/Greigh/BlockingMachine/actions/workflows/eslint.yml/badge.svg)](https://github.com/Greigh/BlockingMachine/actions/workflows/eslint.yml)
[![MarkdownLint](https://github.com/Greigh/BlockingMachine/actions/workflows/mdlint.yml/badge.svg)](https://github.com/Greigh/BlockingMachine/actions/workflows/mdlint.yml)
[![AgLint](https://github.com/Greigh/BlockingMachine/actions/workflows/aglint.yml/badge.svg)](https://github.com/Greigh/BlockingMachine/actions/workflows/aglint.yml)
[![GitHub Pages](https://github.com/Greigh/BlockingMachine/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/Greigh/BlockingMachine/actions/workflows/pages/pages-build-deployment)
[![UpdateFilters](https://github.com/Greigh/BlockingMachine/actions/workflows/website.yml/badge.svg)](https://github.com/Greigh/BlockingMachine/actions/workflows/website.yml)
[![COMMITS](https://img.shields.io/github/commit-activity/m/greigh/BlockingMachine)](https://github.com/greigh/BlockingMachine/graphs/commit-activity)
[![ISSUES](https://img.shields.io/github/issues/greigh/BlockingMachine)](https://github.com/greigh/BlockingMachine/issues)
[![CLOSEDISSUES](https://img.shields.io/github/issues-closed/greigh/BlockingMachine)](https://github.com/greigh/BlockingMachine/issues?q=is%3Aissue+is%3Aclosed)

Last Updated: February 26, 2025 at 1:58 AM

---

**BlockingMachine** is a comprehensive ad-blocking and privacy protection system that converts, optimizes,
and distributes filter lists across multiple platforms. It bridges the gap between different ad-blocking
tools by providing unified, regularly updated filter lists.

[View Demo](https://greigh.github.io/BlockingMachine) • [Quick Start](#quick-start) • [Documentation](https://greigh.github.io/BlockingMachine/docs)

---

</div>

## 🚀 Highlights

- **50M+** Domains Blocked
- **Daily** Updates
- **4** Filter Formats
- **Cross-Platform** Support
- **Zero** False Positives Policy

## Table of Contents

- [BlockingMachine](#blockingmachine)
  - [🚀 Highlights](#-highlights)
  - [Table of Contents](#table-of-contents)
  - [Available Filters](#available-filters)
    - [Filter Lists](#filter-lists)
    - [Quick Subscribe Links](#quick-subscribe-links)
    - [Update Schedule](#update-schedule)
  - [Third Party Filters](#third-party-filters)
  - [Overview](#overview)
  - [How BlockingMachine Works](#how-blockingmachine-works)
    - [The Problem](#the-problem)
    - [Our Solution](#our-solution)
    - [Rule Types](#rule-types)
      - [DNS Rules](#dns-rules)
      - [Browser Rules](#browser-rules)
      - [Hosts Rules](#hosts-rules)
    - [Daily Updates](#daily-updates)
  - [Chrome MV3 Impact](#chrome-mv3-impact)
    - [What Changed?](#what-changed)
    - [What to Do](#what-to-do)
  - [How to Use](#how-to-use)
    - [Whole Home Filtering](#whole-home-filtering)
    - [Mobile Filtering](#mobile-filtering)
    - [Browser Filtering](#browser-filtering)
    - [System Filtering](#system-filtering)
  - [Build from Source](#build-from-source)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Running the Script](#running-the-script)
  - [Project Structure](#project-structure)
  - [⚡ Quick Start](#-quick-start)
  - [🤝 Contributing](#-contributing)
  - [Features](#features)
  - [Compatibility](#compatibility)
    - [Browsers](#browsers)
    - [Mobile](#mobile)
    - [DNS Servers](#dns-servers)
  - [Installation Guide](#installation-guide)
    - [System Requirements](#system-requirements)
    - [System-Specific Setup](#system-specific-setup)
      - [macOS](#macos)
      - [Windows](#windows)
      - [Linux](#linux)
    - [Installing BlockingMachine](#installing-blockingmachine)
    - [Configuration](#configuration)
    - [Verify Installation](#verify-installation)
    - [Running the Application](#running-the-application)
    - [Troubleshooting](#troubleshooting)
  - [Live Demo](#live-demo)
    - [Try it Now](#try-it-now)
    - [Quick Test](#quick-test)
    - [Demo Statistics](#demo-statistics)
    - [Live Status](#live-status)
  - [Show Your Support](#show-your-support)

## Available Filters

### Filter Lists

- **AdGuard DNS Filter**: Network-level blocking with DNS rewrites
- **AdGuard Standard**: Complete protection for AdGuard products
- **Browser Extension**: Compatible with uBlock Origin and AdBlock
- **Hosts Format**: System-level blocking for any OS

### Quick Subscribe Links

| Filter Type | Subscribe Link |
|-------------|---------------|
| AdGuard DNS | [Subscribe](https://raw.githubusercontent.com/Greigh/BlockingMachine/main/public/filters/adguard-dns.txt) |
| Standard | [Subscribe](https://raw.githubusercontent.com/Greigh/BlockingMachine/main/public/filters/standard.txt) |
| Browser | [Subscribe](https://raw.githubusercontent.com/Greigh/BlockingMachine/main/public/filters/browser.txt) |
| Hosts | [Subscribe](https://raw.githubusercontent.com/Greigh/BlockingMachine/main/public/filters/hosts.txt) |

### Update Schedule

- Lists update daily at midnight UTC
- Last update: February 26, 2025 at 1:58 AM

## Third Party Filters

<!-- thirdPartyFilters -->
<!-- endThirdPartyFilters -->

## Overview

BlockingMachine is a unified solution for managing ad blocking and privacy rules across different platforms and
tools. It automatically aggregates, processes, and distributes blocking rules in various formats to ensure
maximum compatibility and effectiveness.

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

## How to Use

### Whole Home Filtering

- [AdGuard Home](https://adguard.com/en/adguard-home/overview.html) (Recommended)
- [PiHole](https://pi-hole.net/) (Hosts filter only)
- [Wireguard](https://www.wireguard.com/) (more advanced)

### Mobile Filtering

- **iOS**:
  - [AdGuard Pro](https://adguard.com/en/adguard-ios-pro/overview.html) (Recommended)
  - [AdBlocker DNS Ultimate AdBlock](https://apps.apple.com/us/app/adblocker-dns-ultimate-adblock/id6475119148)
- **Android**:
  - [AdGuard](https://adguard.com/en/adguard-android/overview.html) (Recommended)

### Browser Filtering

- [Brave Browser](https://brave.com/)
  - Chromium-based browser with built-in filtering (Recommended)
- Chrome and other Chromium Browsers (only recommended for non-Chrome due to MV3 release)
  - [AdGuard](https://adguard.com/en/adguard-browser-extension/chrome/overview.html)
  - [uBlock](https://ublockorigin.com/)
  - [Adblock Plus](https://adblockplus.org/en/download)
- Safari
  - [AdGuard](https://adguard.com/en/adguard-safari/overview.html)
  - [uBlock](https://ublockorigin.com/)
  - [Adblock Plus](https://adblockplus.org/en/download)
- Firefox and other FireFox based browsers
  - [AdGuard](https://adguard.com/en/adguard-browser-extension/firefox/overview.html)
  - [uBlock](https://ublockorigin.com/)
  - [Adblock Plus](https://adblockplus.org/en/download)

### System Filtering

- Block using the Hosts File on your computer (Not Recommended)
  - macOS: `/private/etc/hosts`
  - Windows: `C:\Windows\System32\drivers\etc\hosts`
  - Linux: `/etc/hosts`

## Build from Source

### Prerequisites

- [Node.js](https://nodejs.org/en/download)(version 20 or higher)
- [npm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)(Node Package Manager)

### Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/greigh/BlockingMachine.git
    cd BlockingMachine
    ```

2. Install the dependencies:

    ```sh
    npm install
    ```

### Running the Script

To run the Blocking Machine script, use the following command:

```sh
npm start build
```

## Project Structure

```bash
BlockingMachine/
├── .github/
│   └── workflows/        # GitHub Actions workflows
│       ├── eslint.yml
│       ├── mdlint.yml
│       ├── aglint.yml
│       ├── website.yml
│       └── release.yml
├── src/                 # Source code
│   ├── update.js
│   └── utils/
│       └── filters.js
├── public/             # Public assets and generated files
│   ├── images/
│   │   └── BlockingMachine.png
│   └── filters/        # Generated filter lists
│       ├── adguard-dns.txt
│       ├── standard.txt
│       ├── browser.txt
│       └── hosts.txt
├── tests/              # Test files
│   └── update.test.js
├── config/             # Configuration files
│   ├── eslint.config.mjs
│   └── .markdownlint.json
├── docs/               # Documentation
├── CODE_OF_CONDUCT.md  # Project guidelines
├── CONTRIBUTING.md     # Contribution guidelines
├── LICENSE            # Project license
└── README.md         # Project documentation
```

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

## 🤝 Contributing

We welcome contributions! Here's how you can help:

- [Report bugs](https://github.com/Greigh/BlockingMachine/issues)
- [Suggest enhancements](https://github.com/Greigh/BlockingMachine/issues)
- [Submit pull requests](https://github.com/Greigh/BlockingMachine/pulls)

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting changes.

---

<div align="center">

Made with ❤️ by [Daniel Hipskind](https://danielhipskind.com/) aka Greigh

</div>

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

- **Easy Integration**
  - Simple subscription URLs
  - One-click installation
  - Cross-platform compatibility
  - No configuration needed

## Compatibility

### Browsers

- Firefox (Recommended) ✅
- Safari ✅
- Brave ✅
- Chrome (Limited MV3 Support) ⚠️
- Edge (Limited MV3 Support) ⚠️

### Mobile

- iOS 14+ ✅
- Android 8+ ✅
- iPadOS 14+ ✅

### DNS Servers

- AdGuard Home ✅
- Pi-hole (Limited) ⚠️
- NextDNS ✅

## Installation Guide

### System Requirements

- [Node.js](https://nodejs.org/en/download) (v20 or higher)
- [Git](https://git-scm.com/downloads)
- Package Manager: [npm](https://www.npmjs.com/get-npm) (comes with Node.js)

### System-Specific Setup

#### macOS

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version  # Should show v20.x.x or higher
npm --version   # Should show v10.x.x or higher
```

#### Windows

- Download and install Node.js from [official website](https://nodejs.org/)
- Open PowerShell as Administrator to run commands

#### Linux

```bash
# Using Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using Fedora
sudo dnf install nodejs
```

### Installing BlockingMachine

1. **Clone the Repository**

```bash
git clone https://github.com/Greigh/BlockingMachine.git
cd BlockingMachine
```

2. **Install Dependencies**

```bash
# Clean install for production
npm ci

# Regular install for development
npm install
```

### Configuration

```bash
# Copy example configuration
cp .env.example .env

# Edit configuration file with your preferred editor
code .env  # Using VS Code
```

### Verify Installation

```bash
# Run tests to ensure everything works
npm test

# Check linting
npm run lint
```

### Running the Application

```bash
# Development mode
npm run dev

# Production mode
npm start

# Build filter lists
npm run build
```

### Troubleshooting

1. **Clean Installation**

```bash
# Remove dependencies and cache
rm -rf node_modules package-lock.json
npm cache clean --force
```

2. **Version Conflicts**

```bash
# Check Node.js version
node --version
```

3. **Permission Issues**

```bash
# macOS/Linux
sudo chown -R $USER:$GROUP ~/.npm
```

## Live Demo

### Try it Now

Visit our [Live Demo Page](https://greigh.github.io/BlockingMachine) to:

- View real-time filter statistics
- Test filter effectiveness
- Check website compatibility
- Monitor update status

### Quick Test

1. **Add a Test Filter**

```bash
# AdGuard Home
https://raw.githubusercontent.com/Greigh/BlockingMachine/main/public/filters/adguard-dns.txt
```

2. **Visit Test Pages**

- [Ad Server Test](https://d3ward.github.io/toolz/adblock.html)
- [Tracking Test](https://trackertest.org)
- [Privacy Test](https://privacytests.org)

### Demo Statistics

| Metric | Count |
|--------|-------|
| Domains Blocked | 50M+ |
| False Positives | <0.001% |
| Update Frequency | Every 24h |
| Format Support | 4 Types |

### Live Status

[![Update Status](https://img.shields.io/github/actions/workflow/status/Greigh/BlockingMachine/updatefilters.yml?label=Filter%20Updates)](https://github.com/Greigh/BlockingMachine/actions)
[![Last Update](https://img.shields.io/badge/dynamic/json?color=success&label=Last%20Update&query=$.lastUpdate&url=https://raw.githubusercontent.com/Greigh/BlockingMachine/main/public/stats.json)](https://greigh.github.io/BlockingMachine)

---

## Show Your Support

Star the repo if you find it useful! ⭐

---
