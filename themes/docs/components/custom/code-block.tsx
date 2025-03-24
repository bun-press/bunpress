import { useState } from 'react';
import { Check, Copy, FileCode } from 'lucide-react';
import { cn } from '../../../../src/lib/utils';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
}

export function CodeBlock({
  code,
  language = 'tsx',
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className={cn('relative my-4 rounded-lg border bg-muted', className)}>
      {filename && (
        <div className="flex items-center gap-2 border-b bg-muted px-4 py-2 text-sm text-muted-foreground">
          <FileCode className="h-4 w-4" />
          <span>{filename}</span>
        </div>
      )}
      <div className="relative">
        <ScrollArea className="max-h-[500px] w-full">
          <div className="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 z-10 h-6 w-6 text-muted-foreground hover:bg-muted-foreground/20"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span className="sr-only">Copy code</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{copied ? 'Copied!' : 'Copy code'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <pre className="overflow-x-auto py-4">
              <code className={`language-${language}`}>
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className={cn(
                      'px-4 py-0.5',
                      highlightLines.includes(i + 1) && 'bg-muted-foreground/10'
                    )}
                  >
                    {showLineNumbers && (
                      <span className="mr-4 inline-block w-4 text-right text-muted-foreground">
                        {i + 1}
                      </span>
                    )}
                    <span>{line || ' '}</span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 