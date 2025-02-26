<p align="center"><img src="./public/images/BlockingMachine.png" width="200">

<center>

# Blocking Machine

[![UPDATEFILTERS](https://img.shields.io/github/actions/workflow/status/badges/shields/updatefilters.yml?label=Filter%20Updates)](https://github.com/Greigh/BlockingMachine/blob/main/.github/workflows/updatefilters.yml)
[![ESLINT](https://img.shields.io/github/actions/workflow/status/badges/shields/eslint.yml?label=eslint)](https://github.com/greigh/BlockingMachine/actions/workflows/eslint.yml)
[![MDLINT](https://img.shields.io/github/actions/workflow/status/badges/shields/mdlint.yml?label=mdlint)](https://github.com/greigh/BlockingMachine/actions/workflows/mdlint.yml)
[![AGLINT](https://img.shields.io/github/actions/workflow/status/badges/shields/aglint.yml?label=aglint)](https://github.com/greigh/BlockingMachine/actions/workflows/aglint.yml)
[![LICENSE](https://img.shields.io/github/license/greigh/BlockingMachine)](https://github.com/greigh/BlockingMachine/blob/main/LICENSE)
[![COMMITS](https://img.shields.io/github/commit-activity/m/greigh/BlockingMachine)](https://github.com/greigh/BlockingMachine/graphs/commit-activity)
[![ISSUES](https://img.shields.io/github/issues/greigh/BlockingMachine)](https://github.com/greigh/BlockingMachine/issues)
[![CLOSEDISSUES](https://img.shields.io/github/issues-closed/greigh/BlockingMachine)](https://github.com/greigh/BlockingMachine/issues?q=is%3Aissue+is%3Aclosed)

</center>

Last Updated: February 26, 2025 at 1:58 AM

## Rule Counts and Links (Lists are updated at midnight everyday)

- **AdGuard Rules:** <!-- adguardCount -->73617 rules
  - [DNS Rewrite Filter](adguard_dnsrewrite.txt)
  - [Normal Filter List](adguard.txt)
- **[Browser Rules](browserRules.txt):** <!-- browserRulesCount -->57641 rules
- **[Hosts Rules](hosts.txt):** <!-- hostsCount -->70262 rules
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
