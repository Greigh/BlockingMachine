<!-- markdownlint-disable -->
<p align="center">
  <img src="public/images/BlockingMachine.png" alt="Blocking Machine" width="200" />
</p>
<h1 align="center">BlockingMachine</h1>
<p align="center">
  <a href="https://github.com/greigh/BlockingMachine/actions/workflows/updates.yml" target="_blank">
    <img src="https://img.shields.io/github/actions/workflow/status/greigh/BlockingMachine/updates.yml?branch=main" alt="Update TXT Files status">
  </a>
  <a href="https://github.com/greigh/BlockingMachine/actions/workflows/eslint.yml" target="_blank">
    <img src="https://img.shields.io/github/actions/workflow/status/greigh/BlockingMachine/eslint.yml?branch=main" alt="ESLint status">
  </a>
  <a href="https://github.com/greigh/BlockingMachine/actions/workflows/markdownlint.yml" target="_blank">
    <img src="https://img.shields.io/github/actions/workflow/status/greigh/BlockingMachine/markdownlint.yml?branch=main" alt="MarkdownLint status">
  </a>
  <a href="https://github.com/greigh/BlockingMachine/actions/workflows/aglint.yml" target="_blank">
    <img src="https://img.shields.io/github/actions/workflow/status/greigh/BlockingMachine/aglint.yml?branch=main" alt="AGLint status">
  </a>
  <a href="https://github.com/greigh/BlockingMachine/blob/main/LICENSE" target="_blank">
    <img src="https://img.shields.io/github/license/greigh/BlockingMachine" alt="License">
  </a>
  <a href="https://github.com/greigh/BlockingMachine/graphs/contributors" target="_blank">
    <img src="https://img.shields.io/github/contributors/greigh/BlockingMachine" alt="GitHub contributors">
  </a>
  <a href="https://github.com/greigh/BlockingMachine/graphs/commit-activity" target="_blank">
    <img src="https://img.shields.io/github/commit-activity/m/greigh/BlockingMachine" alt="GitHub commit activity">
  </a>
  <a href="https://github.com/greigh/BlockingMachine/issues" target="_blank">
    <img src="https://img.shields.io/github/issues/greigh/BlockingMachine" alt="GitHub issues">
  </a>
  <a href="https://github.com/greigh/BlockingMachine/issues?q=is%3Aissue+is%3Aclosed" target="_blank">
    <img src="https://img.shields.io/github/issues-closed/greigh/BlockingMachine" alt="GitHub closed issues">
  </a>
</p>
<!-- markdownlint-restore -->

## Rule Counts and Links (Lists are updated at midnight everyday)

- **[AdGuard Rules](adguard.txt):** <!-- adguardCount -->73573
  - [DNS Rewrite Filter](adguard_dnsrewrite.txt)
  - [Normal Filter List](AdGuard.txt)
- **[Browser Rules](browserRules.txt):** <!-- browserRulesCount -->57629
- **[Hosts Rules](hosts.txt):** <!-- hostsCount -->70217
- More lists to come!

## Third Party Filters
<!-- thirdPartyFilters -->
<!-- endThirdPartyFilters -->

# Blocking Machine

This web application maintains an up-to-date, unified list of blocking rules from various sources. It aggregates rules
from trusted sources and converts them into a standardized format.

## Features

- Aggregates filter lists from multiple sources
- Converts rules to AdGuard compatible format
- Provides a unified blocklist endpoint
- Supports DNS rewrites
- Automatic daily updates
- Basic web interface for status monitoring

## How to Use

### Prerequisites for Whole Home Filtering

- [AdGuard Home](https://adguard.com/en/adguard-home/overview.html) (Recommended)
- [PiHole](https://pi-hole.net/) (Hosts filter only)
- [Wireguard](https://www.wireguard.com/) (more advanced)

### Prerequisites for iOS Filtering

- [AdGuard Pro](https://adguard.com/en/adguard-ios-pro/overview.html) (Recommended)
- [AdBlocker DNS Ultimate AdBlock](https://apps.apple.com/us/app/adblocker-dns-ultimate-adblock/id6475119148)

### Prerequisites for Android Filtering

- [AdGuard](https://adguard.com/en/adguard-android/overview.html) (Recommended)

### Prerequisites for Windows Filtering

- [AdGuard](https://adguard.com/en/adguard-windows/overview.html) (Recommended)

### Prerequisites for macOS Filtering

- [AdGuard](https://adguard.com/en/adguard-mac/overview.html)

### Prerequisites for Browser Filtering

- [Brave Browser](https://brave.com/)
  - Chromium-based browser with built-in filtering (Recommended)
- Chrome and other Chromium Browsers
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

### Prerequisites for System Based Filtering

- Block using the Hosts File on your computer (Not Recommended)
  - macOS: `/private/etc/hosts`
  - Windows: `C:\Windows\System32\drivers\etc\hosts`
  - Linux: `/etc/hosts`

### Add the Filter

- [AdGuard](adguard.txt): AdGuard Home, Wireguard, and other Adguard-based filter tools
- [Browser Rules](browserRules.txt): Chrome, Safari, Firefox, and other browser-based plugin filtering
- [Hosts](hosts.txt): PiHole, System-based blocking, and other hosts-based filter tools (Not Recommended)

## How to Build from Source

### Prerequisites

- [Node.js](https://nodejs.org/en/download) (version 20 or higher)
- [npm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) (Node Package Manager)

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
npm start
```
