import React, { ReactNode } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface TranslatedTextProps {
  textKey: string;
  params?: Record<string, string>;
  fallback?: string;
  as?: React.ElementType;
  children?: ReactNode;
  className?: string;
}

/**
 * Component that renders translated text using the translation key
 */
export function TranslatedText({
  textKey,
  params,
  fallback,
  as: Component = 'span',
  children,
  className,
  ...props
}: TranslatedTextProps & React.HTMLAttributes<HTMLElement>) {
  const { t, isLoaded } = useTranslation();
  
  // If translations aren't loaded yet and we have a fallback, use it
  if (!isLoaded && fallback) {
    return <Component className={className} {...props}>{fallback}</Component>;
  }
  
  // If we have children, use them as fallback
  if (!isLoaded && children) {
    return <Component className={className} {...props}>{children}</Component>;
  }
  
  // Get the translated text
  const translatedText = t(textKey, params);
  
  // If the translation is the same as the key (not found) and we have children, use them
  if (translatedText === textKey && children) {
    return <Component className={className} {...props}>{children}</Component>;
  }
  
  // Otherwise, render the translated text
  return <Component className={className} {...props}>{translatedText}</Component>;
} 