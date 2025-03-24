# Docs Theme Test Suite

This directory contains comprehensive tests for the BunPress docs theme components and end-to-end functionality.

## Test Structure

### Component Tests
Located in `components/` directory, these tests verify that individual UI components render correctly:

- **Navigation.test.tsx**: Tests for the main navigation component
- **Sidebar.test.tsx**: Tests for the sidebar navigation component
- **TOC.test.tsx**: Tests for the table of contents component
- **Footer.test.tsx**: Tests for the footer component with prev/next navigation

### End-to-End Tests
Located in `e2e/` directory, these tests verify the overall user experience:

- **docsTheme.test.ts**: Tests the end-to-end user flow and integrated functionality

## Setup Requirements

Before running the tests, ensure you have the required dependencies:

```bash
bun add -d jsdom @types/jsdom node-fetch @types/node-fetch
```

## Running Tests

To run all tests:

```bash
bun test themes/docs/__tests__
```

To run component tests only:

```bash
bun test themes/docs/__tests__/components
```

To run e2e tests only:

```bash
bun test themes/docs/__tests__/e2e
```

## Test Coverage

These tests cover:

1. **Component rendering**: Verifying that components render with correct props
2. **Responsive behavior**: Testing mobile and desktop layouts (where applicable)
3. **Interactive elements**: Testing interactive elements like collapsible sections
4. **Integrated functionality**: Testing how components work together in the layout
5. **Internationalization**: Testing i18n features
6. **Navigation flows**: Testing prev/next navigation between pages

## Mocking Approach

The tests use:

1. **JSDOM**: To provide a DOM environment for component tests
2. **Mock data**: To simulate theme configuration and content
3. **Mock HTTP responses**: To simulate server responses in E2E tests
4. **Mock filesystem**: To simulate content files

## Extending Tests

When adding new features to the docs theme, please:

1. Add component tests for any new components
2. Update existing tests if component behavior changes
3. Add e2e tests for new user flows
4. Run the full test suite before submitting changes 