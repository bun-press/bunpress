# Centralized Routing System

This document explains the centralized routing system implemented in BunPress to improve DRY (Don't Repeat Yourself) principles in the codebase.

## Overview

The routing system provides a unified approach to route handling across different server implementations. It replaces duplicated routing logic with a single, configurable system that can be used consistently throughout the application.

## Key Features

- **Path Pattern Matching**: Support for both RegExp and string patterns with automatic conversion
- **Middleware Support**: Global and group-specific middleware chains
- **Route Grouping**: Organize routes with common prefixes and middleware
- **HTTP Method Handlers**: Convenience methods for GET, POST, PUT, DELETE, etc.
- **Static File Handling**: Built-in static file serving with caching controls
- **Path Normalization**: Consistent handling of trailing slashes and base paths
- **Error Handling**: Standardized route error handling

## Benefits for DRY Principles

1. **Elimination of Duplicated Route Handling Logic**:
   - Previously, each server implementation had its own route handling logic
   - Now, routing logic is centralized and reused across implementations

2. **Consistent API Across Servers**:
   - All server implementations use the same route registration pattern
   - Middleware chains work the same way everywhere

3. **Unified Error Handling**:
   - Centralized approach to handling route errors
   - Consistent error responses throughout the application

4. **Improved Maintainability**:
   - Changes to routing only need to be made in one place
   - New features can be added once and used everywhere

## Usage Example

```typescript
import { createRouter } from '../lib/route-utils';

// Create a router instance
const router = createRouter({
  trailingSlash: false,
  basePath: '/app'
});

// Add routes
router.get('/users', (req) => {
  return Response.json({ users: ['user1', 'user2'] });
});

// Add route groups
router.group('/api', (router) => {
  router.get('/products', (req) => {
    return Response.json({ products: ['product1', 'product2'] });
  });
  
  router.post('/orders', (req) => {
    // Handle order creation
    return new Response('Order created', { status: 201 });
  });
});

// Add middleware
const authMiddleware = async (req, next) => {
  const token = req.headers.get('Authorization');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  return next();
};

// Apply middleware to a route group
router.group('/admin', (router) => {
  router.get('/dashboard', (req) => {
    return new Response('Admin Dashboard');
  });
}, [authMiddleware]);

// Serve static files
router.addRoute('/*', router.createStaticFileHandler('public', {
  cacheControl: {
    'image/*': 'public, max-age=86400',
    'text/css': 'public, max-age=86400'
  }
}));

// Use in a server
const server = Bun.serve({
  fetch: async (req) => {
    return await router.handleRequest(req) || new Response('Not Found', { status: 404 });
  }
});
```

## Integration with Existing Servers

To integrate the routing system with existing server implementations:

1. Replace the array of routes with a Router instance
2. Convert middleware chains to use the Router middleware system
3. Use the Router's handleRequest method in the fetch handler
4. For static files, use the Router's createStaticFileHandler

See the example in `src/examples/router-example.ts` for a complete implementation.

## Architecture

The routing system consists of several key components:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Router      │────▶│      Route      │────▶│  RouteHandler   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   RouteGroup    │     │  MiddlewareChain│     │    Response     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Future Improvements

Potential enhancements to the routing system include:

- **Route Generators**: Automatic route generation from directory structure
- **Named Routes**: Support for named routes with reverse routing
- **Nested Middleware**: Support for nested middleware scopes
- **Caching Layer**: Built-in response caching for routes
- **Rate Limiting**: Configurable rate limiting for routes
- **Schema Validation**: Request and response schema validation 