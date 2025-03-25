---
title: Markdown Extensions Demo
description: Demonstration of BunPress's enhanced markdown capabilities
---

# Markdown Extensions Demo

[[toc]]

## Custom Containers

::: tip
This is a tip container with default title
:::

::: tip Custom Title
This is a tip container with custom title
:::

::: info
This is an info container
:::

::: warning
This is a warning container
:::

::: danger
This is a danger container
:::

::: details Click me to expand
This content is hidden by default but can be revealed by clicking.
- You can include any markdown content here
- Including lists
- And code blocks
:::

## Code Highlighting

```javascript
// This code will be highlighted
function greet(name) {
  return `Hello, ${name}!`;
}

// Call the function
console.log(greet('BunPress User'));
```

```typescript
// TypeScript code highlighting
interface User {
  id: number;
  name: string;
  email?: string;
}

const user: User = {
  id: 1,
  name: 'BunPress User'
};

function getUser(id: number): User {
  return user;
}
```

## Heading Links

The headings in this document automatically get anchor links that you can use to link directly to sections.

## Table of Contents

The table of contents at the top of this page is automatically generated from the headings in the document. 