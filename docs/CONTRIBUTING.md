# Contributing to Blockingmachine

First off, thank you for considering contributing to Blockingmachine! Everyone can help make this tool better.

## Table of Contents

- [Contributing to Blockingmachine](#contributing-to-blockingmachine)
  - [Table of Contents](#table-of-contents)
  - [Code of Conduct](#code-of-conduct)
  - [How Can I Help?](#how-can-i-help)
    - [Reporting False Positives or Broken Websites](#reporting-false-positives-or-broken-websites)
    - [Suggesting Websites to Block](#suggesting-websites-to-block)
    - [Other Ways to Help](#other-ways-to-help)
    - [Reporting Bugs](#reporting-bugs)
    - [Suggesting Enhancements](#suggesting-enhancements)
    - [Pull Requests](#pull-requests)
  - [Development Setup](#development-setup)
  - [Filter List Guidelines](#filter-list-guidelines)
  - [Testing Your Changes](#testing-your-changes)
    - [Testing Filter Rules](#testing-filter-rules)
  - [Issue Templates](#issue-templates)
  - [Communication Guidelines](#communication-guidelines)
  - [Project Structure](#project-structure)
  - [Questions?](#questions)
  - [License](#license)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Help?

### Reporting False Positives or Broken Websites

If a website isn't working properly or something is blocked that shouldn't be:

1. **Check if Already Reported**
   - Search [existing issues](https://github.com/Greigh/Blockingmachine/issues) first
   - Look for the website name or similar problems

2. **Report the Problem**
   - Visit our [Issue Tracker](https://github.com/Greigh/Blockingmachine/issues/new)
   - Include:
     - Website URL
     - What's not working (videos, images, checkout, etc.)
     - Your ad blocker (uBlock Origin, AdGuard, etc.)
     - Screenshots if possible

3. **Temporary Fix**
   You can add a temporary exception while we investigate:

   - **For DNS-based blockers (AdGuard Home, Pi-hole):**

     ```adguard
     @@||example.com^$dnsrewrite=greigh.github.io/blockingmachine
     ```

     Replace `example.com` with the website you want to unblock

   - **For Browser Extensions:**

     ```adguard
     @@||example.com^
     ```

     Replace `example.com` with the website you want to unblock

   Add these rules to your ad blocker's custom filters section.

### Suggesting Websites to Block

Found ads or trackers we're missing?

1. **Check Current Lists**
   - Search our [existing filters](https://github.com/Greigh/Blockingmachine/issues?q=label%3Awebsite-suggestion)

2. **Submit New Website**
   - Provide the website URL
   - Describe where the ads appear
   - Include screenshots if possible

### Other Ways to Help

- **Share Your Experience**: Tell us how Blockingmachine works for you
- **Spread the Word**: Star the repository if you find it useful
- **Help Others**: Answer questions in issues

### Reporting Bugs

1. **Check Existing Issues** - Search the [issue tracker](https://github.com/Greigh/Blockingmachine/issues) to avoid duplicates
2. **Use the Bug Report Template** - When creating a new issue, use the bug report template
3. **Provide Details** - Include:
   - Your environment (OS, Node.js version, etc.)
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages or screenshots

### Suggesting Enhancements

1. **Check Existing Suggestions** - Search [existing suggestions](https://github.com/Greigh/Blockingmachine/issues?q=is%3Aissue+label%3Aenhancement)
2. **Use the Feature Request Template** - When creating a new suggestion
3. **Be Specific** - Explain why this enhancement would be useful

### Pull Requests

1. **Fork the Repository**
2. **Create a Branch** - Use a descriptive name:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```

3. **Make Your Changes**
   - Follow the coding style
   - Add tests if applicable
   - Update documentation if needed

4. **Commit Your Changes**
   - Use meaningful commit messages
   - Reference issues and pull requests

   ```bash
   git commit -m "feat: add new filter conversion feature

   This adds support for converting XYZ format filters.
   Closes #123"
   ```

5. **Push to Your Fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide a clear description

## Development Setup

1. **Prerequisites**
   - Node.js (v20 or higher)
   - npm (latest version)

2. **Installation**

   ```bash
   git clone https://github.com/YourUsername/Blockingmachine.git
   cd Blockingmachine
   npm install
   ```

3. **Running Tests**

   ```bash
   npm test
   ```

4. **Code Style**
   - We use ESLint
   - Run linting: `npm run lint`
   - Auto-fix: `npm run lint:fix`

## Filter List Guidelines

When contributing new filter rules:

1. **Verify the Rule**
   - Test on multiple websites
   - Ensure no false positives
   - Check compatibility with major ad blockers

2. **Format Guidelines**
   - One rule per line
   - Include comments for complex rules
   - Follow [AdGuard syntax](https://kb.adguard.com/en/general/how-to-create-your-own-ad-filters)

3. **Documentation**
   - Add rule description in comments
   - Reference related issues/websites

## Testing Your Changes

### Testing Filter Rules

1. **Local Testing**
   - Add your rule to your ad blocker's custom filters
   - Test on multiple browsers
   - Test with and without VPN/proxy
   - Document any inconsistencies

2. **Compatibility Testing**

   ```adguard
   ! Test both formats
   ||example.com^$third-party
   ||example.com^$dnsrewrite
   ```

## Issue Templates

We provide several issue templates:

- **False Positive Report**: For reporting incorrectly blocked content
- **Feature Request**: For suggesting new features
- **Bug Report**: For reporting technical issues
- **Filter Request**: For suggesting new domains to block

## Communication Guidelines

- Be clear and concise
- Include specific examples
- Use screenshots when helpful
- Respect the time of volunteer maintainers
- Follow up on your issues and PRs

## Project Structure

```plaintext
Blockingmachine/
├── src/                # Source code
├── public/            
│   └── filters/       # Generated filter lists
├── tests/             # Test files
└── config/            # Configuration files
```

## Questions?

Feel free to [open an issue](https://github.com/Greigh/Blockingmachine/issues/new) or contact the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.