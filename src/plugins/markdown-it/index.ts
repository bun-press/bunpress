import MarkdownIt from 'markdown-it';
import type { Plugin } from '../../core/plugin';

interface MarkdownItOptions {
  html?: boolean;
  linkify?: boolean;
  typographer?: boolean;
  breaks?: boolean;
}

export default function markdownItPlugin(options: MarkdownItOptions = {}): Plugin {
  const md = new MarkdownIt({
    html: options.html ?? true,
    linkify: options.linkify ?? true,
    typographer: options.typographer ?? true,
    breaks: options.breaks ?? false,
  });

  return {
    name: 'markdown-it',
    options,
    transform: (content: string) => {
      return md.render(content);
    },
  };
} 