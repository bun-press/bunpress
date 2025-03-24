# BunPress Search Index Plugin

The Search Index plugin generates a JSON search index from your content, enabling client-side search functionality in your BunPress site.

## Features

- Creates a search index from your content's frontmatter and body
- Configurable fields to include in the index
- Removes HTML tags and stopwords for improved search quality
- Generates excerpts for search results
- Highly configurable

## Installation

This plugin is included by default in BunPress, so you don't need to install it separately.

## Usage

Add the Search Index plugin to your `bunpress.config.ts` file:

```typescript
import { defineConfig } from 'bunpress';
import { searchIndexPlugin } from 'bunpress/plugins';

export default defineConfig({
  // ... other config
  plugins: [
    searchIndexPlugin({
      filename: 'search-index.json',
      fields: ['title', 'description', 'content', 'tags'],
      snippetLength: 160
    })
  ]
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filename` | `string` | `'search-index.json'` | Output filename for the search index |
| `outputDir` | `string` | `'dist'` | Directory where the search index will be generated |
| `fields` | `string[]` | `['title', 'description', 'content']` | Fields to include in the search index |
| `filterItems` | `(item: ContentFile) => boolean` | `() => true` | Function to filter content files |
| `stopwords` | `string[]` | Common English words | Words to exclude from the search index |
| `snippetLength` | `number` | `160` | Maximum length of text snippet in search results |

## How It Works

The Search Index plugin performs the following tasks:

1. During the build process, it collects all content files.
2. At the end of the build, it processes each content file:
   - Extracts frontmatter fields specified in the `fields` option
   - Processes content text by removing HTML tags and stopwords
   - Generates excerpts for search results
3. The plugin then writes a JSON file to the output directory, which can be used for client-side search.

## Using the Search Index

Once generated, you can use the search index in your client-side code to implement search functionality:

```javascript
// Example using fetch to load the search index
async function loadSearchIndex() {
  const response = await fetch('/search-index.json');
  return await response.json();
}

// Example search function (using basic text matching)
function search(query, searchIndex) {
  const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
  
  return searchIndex.filter(item => {
    // Check if any search term is present in the item's title, description, or content
    return terms.some(term => 
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.content && item.content.includes(term))
    );
  });
}

// Example usage
async function searchSite(query) {
  const searchIndex = await loadSearchIndex();
  const results = search(query, searchIndex);
  console.log(`Found ${results.length} results for "${query}"`);
  return results;
}
```

For more advanced search capabilities, consider combining this plugin with a client-side search library like [MiniSearch](https://github.com/lucaong/minisearch), [Fuse.js](https://fusejs.io/), or [FlexSearch](https://github.com/nextapps-de/flexsearch).

## Advanced Usage

### Custom Fields

Include additional frontmatter fields in your search index:

```typescript
searchIndexPlugin({
  fields: ['title', 'description', 'content', 'tags', 'author', 'category']
})
```

### Filtering Content

Filter which content appears in the search index:

```typescript
searchIndexPlugin({
  filterItems: (item) => {
    // Only include published items
    return item.frontmatter.published !== false;
    
    // Or, only include items from specific sections
    // return item.route.startsWith('/blog') || item.route.startsWith('/docs');
  }
})
```

### Custom Stopwords

Provide your own list of stopwords:

```typescript
searchIndexPlugin({
  stopwords: ['a', 'an', 'the', 'in', 'on', 'at', 'by', 'for']
})
```