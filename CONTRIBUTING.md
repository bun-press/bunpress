# Contributing to BunPress

Thank you for your interest in contributing to BunPress! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/yourusername/bunpress.git
   cd bunpress
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bunpress dev
   ```

## Project Structure

```
bunpress/
├── src/
│   ├── core/          # Core functionality
│   ├── plugins/       # Plugin system
│   └── theme/         # Theme system
├── themes/            # Default themes
├── example/           # Example site
└── tests/             # Test files
```

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Add test cases for bug fixes

### Documentation

- Update documentation for new features
- Add JSDoc comments for public APIs
- Keep the README up to date

## Pull Request Process

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes and commit them:
   ```bash
   git commit -m "feat: add my feature"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/my-feature
   ```

4. Create a Pull Request

### PR Guidelines

- Use clear and descriptive titles
- Reference related issues
- Include screenshots for UI changes
- Add tests for new features
- Update documentation as needed

## Issue Guidelines

When creating an issue:

1. Use the issue template
2. Provide a clear description
3. Include steps to reproduce
4. Add relevant code snippets
5. Specify your environment

## Community Guidelines

- Be respectful and inclusive
- Help others when possible
- Follow the code of conduct
- Report inappropriate behavior

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a release tag
4. Publish to npm

## Questions?

Feel free to ask questions in the GitHub issues or discussions.

Thank you for contributing to BunPress! 