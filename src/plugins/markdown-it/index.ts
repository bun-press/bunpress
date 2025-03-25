import MarkdownIt from 'markdown-it';
import type { Plugin } from '../../core/plugin';
import markdownItContainer from 'markdown-it-container';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItToc from 'markdown-it-toc-done-right';
import markdownItHighlightjs from 'markdown-it-highlightjs';

// Define the options interface for the markdown-it plugin
export interface MarkdownItOptions {
  html?: boolean;
  linkify?: boolean;
  typographer?: boolean;
  breaks?: boolean;
  // Options for extended features
  containers?: {
    tip?: boolean;
    info?: boolean;
    warning?: boolean;
    danger?: boolean;
    details?: boolean;
    custom?: Array<{
      name: string;
      options?: any;
    }>;
  };
  anchor?:
    | false
    | {
        level?: number[];
        permalink?: boolean;
        permalinkSymbol?: string;
        slugify?: (str: string) => string;
      };
  toc?:
    | false
    | {
        level?: number[];
        containerClass?: string;
        listClass?: string;
        itemClass?: string;
        linkClass?: string;
      };
  codeHighlight?:
    | false
    | {
        theme?: string;
        register?: Record<string, string>;
        ignoreIllegals?: boolean;
      };
}

/**
 * Process block content with markdown-it rules
 */
function renderContainer(_md: MarkdownIt, name: string): (tokens: any[], idx: number) => string {
  return (tokens, idx) => {
    const token = tokens[idx];
    const info = token.info.trim().slice(name.length).trim();
    const title = info || name.charAt(0).toUpperCase() + name.slice(1);

    if (token.nesting === 1) {
      return `<div class="custom-container ${name}">
              <p class="custom-container-title">${title}</p>\n`;
    } else {
      return '</div>\n';
    }
  };
}

/**
 * Creates a markdown-it plugin with enhanced features
 */
export default function markdownItPlugin(options: MarkdownItOptions = {}): Plugin {
  const md = new MarkdownIt({
    html: options.html ?? true,
    linkify: options.linkify ?? true,
    typographer: options.typographer ?? true,
    breaks: options.breaks ?? false,
  });

  // Add container support
  const containers = options.containers || {};

  // Add default containers (tip, info, warning, danger)
  if (containers.tip !== false) {
    md.use(markdownItContainer, 'tip', { render: renderContainer(md, 'tip') });
  }

  if (containers.info !== false) {
    md.use(markdownItContainer, 'info', { render: renderContainer(md, 'info') });
  }

  if (containers.warning !== false) {
    md.use(markdownItContainer, 'warning', { render: renderContainer(md, 'warning') });
  }

  if (containers.danger !== false) {
    md.use(markdownItContainer, 'danger', { render: renderContainer(md, 'danger') });
  }

  // Add details container for collapsible content
  if (containers.details !== false) {
    md.use(markdownItContainer, 'details', {
      validate: (params: string) => {
        return params.trim().match(/^details\s+(.*)$/);
      },
      render: (tokens: any[], idx: number) => {
        const token = tokens[idx];

        if (token.nesting === 1) {
          const m = token.info.trim().match(/^details\s+(.*)$/);
          const summary = m ? m[1] : 'Details';
          return `<details><summary>${summary}</summary>\n`;
        } else {
          return '</details>\n';
        }
      },
    });
  }

  // Add custom containers
  if (containers.custom && Array.isArray(containers.custom)) {
    for (const container of containers.custom) {
      if (container.name) {
        md.use(markdownItContainer, container.name, {
          ...container.options,
          render: container.options?.render || renderContainer(md, container.name),
        });
      }
    }
  }

  // Add anchors to headings if anchor options are provided and not false
  if (options.anchor !== false) {
    md.use(markdownItAnchor, {
      level: options.anchor?.level || [1, 2, 3, 4, 5, 6],
      permalink: options.anchor?.permalink !== false,
      permalinkSymbol: options.anchor?.permalinkSymbol || '#',
      slugify: options.anchor?.slugify,
    });
  }

  // Add table of contents support if toc options are provided and not false
  if (options.toc !== false) {
    md.use(markdownItToc, {
      level: options.toc?.level || [2, 3],
      containerClass: options.toc?.containerClass || 'table-of-contents',
      listClass: options.toc?.listClass || 'toc-list',
      itemClass: options.toc?.itemClass || 'toc-item',
      linkClass: options.toc?.linkClass || 'toc-link',
    });
  }

  // Add code highlighting if codeHighlight options are provided and not false
  if (options.codeHighlight !== false) {
    md.use(markdownItHighlightjs, {
      auto: true,
      code: true,
      register: options.codeHighlight?.register,
      ignoreIllegals: options.codeHighlight?.ignoreIllegals !== false,
      inline: true,
    });
  }

  return {
    name: 'markdown-it',
    options,
    transform: (content: string) => {
      return md.render(content);
    },
  };
}
