# Contributing to BunPress

Thank you for your interest in contributing to BunPress! This guide will help you get started with the development process.

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
   bun run dev
   ```

## Project Structure

Please see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for a detailed overview of the codebase organization.

## Development Workflow

### Local Development

1. Make your changes to the source code
2. Run the development server to test:
   ```bash
   bun run dev
   ```
3. Test your changes with example content:
   ```bash
   bun run build
   ```
4. Run tests to ensure everything works:
   ```bash
   bun test
   ```

### Adding a New Plugin

1. Create a new directory in `src/plugins/`
2. Implement the Plugin interface from `src/core/plugin.ts`
3. Add tests in a `__tests__` subdirectory
4. Export your plugin in `src/plugins/index.ts`
5. Document your plugin's usage

### Modifying Core Functionality

When modifying core functionality:

1. Understand the component's role in the architecture
2. Follow existing patterns and coding style
3. Update or add tests for your changes
4. Update documentation if necessary

### Adding or Updating Components

When working with theme components:

1. Place components in the appropriate theme directory
2. Follow React best practices and use TypeScript
3. Create tests for your components
4. Ensure mobile responsiveness

## Testing

BunPress uses Bun's built-in test runner. Tests should be placed in a `__tests__` directory next to the code they test.

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Run specific tests
bun test core
```

## Code Style

- Use TypeScript for all code
- Follow consistent naming conventions:
  - kebab-case for filenames
  - PascalCase for components
  - camelCase for variables and functions
- Use ES modules (not CommonJS)
- Include JSDoc comments for public APIs

## Submitting Changes

1. Create a branch for your changes
2. Make your changes following the guidelines above
3. Run tests to ensure everything works
4. Submit a pull request with a clear description of your changes

## Documentation

- Update documentation when adding or changing features
- Keep the memory-bank files updated with architectural decisions
- Add JSDoc comments to functions and interfaces
- Create examples for new features

Thank you for contributing to BunPress! 