import React from 'react';
import { AlertCircle, Check, Info, XCircle, SquareAsterisk } from 'lucide-react';
import { cn } from '../../../../src/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type CalloutType = 'default' | 'info' | 'warning' | 'error' | 'success' | 'tip';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const icons = {
  default: SquareAsterisk,
  info: Info,
  warning: AlertCircle,
  error: XCircle,
  success: Check,
  tip: Info,
};

const variants = {
  default: 'bg-muted text-foreground',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-900 dark:text-blue-400',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-900 dark:text-amber-400',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-900 dark:text-red-400',
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/50 dark:border-green-900 dark:text-green-400',
  tip: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/50 dark:border-purple-900 dark:text-purple-400',
};

const iconColors = {
  default: 'text-foreground',
  info: 'text-blue-600 dark:text-blue-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
  success: 'text-green-600 dark:text-green-400',
  tip: 'text-purple-600 dark:text-purple-400',
};

export function Callout({
  type = 'default',
  title,
  children,
  className,
}: CalloutProps) {
  const IconComponent = icons[type];

  return (
    <Alert className={cn('my-6 border', variants[type], className)}>
      <IconComponent className={cn('h-4 w-4', iconColors[type])} />
      {title && <AlertTitle className="mb-1 font-medium">{title}</AlertTitle>}
      <AlertDescription className="text-sm">{children}</AlertDescription>
    </Alert>
  );
} 