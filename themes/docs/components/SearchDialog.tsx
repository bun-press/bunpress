import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { X } from 'lucide-react';

export interface SearchResult {
  id: string;
  url: string;
  title?: string;
  description?: string;
  content?: string;
  excerpt: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchIndexUrl?: string;
}

export function SearchDialog({ 
  open, 
  onOpenChange, 
  searchIndexUrl = '/search-index.json' 
}: SearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchIndex, setSearchIndex] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch search index on component mount
  useEffect(() => {
    if (!open) return;

    const fetchSearchIndex = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(searchIndexUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to load search index: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setSearchIndex(data);
      } catch (err) {
        console.error('Error fetching search index:', err);
        setError(err instanceof Error ? err.message : 'Failed to load search index');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we haven't already
    if (searchIndex.length === 0) {
      fetchSearchIndex();
    }
  }, [open, searchIndexUrl, searchIndex.length]);

  // Simple search function
  const performSearch = useCallback((term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const normalizedTerm = term.toLowerCase();
    
    // Search through the index
    const results = searchIndex.filter(item => {
      // Check title
      if (item.title && item.title.toLowerCase().includes(normalizedTerm)) {
        return true;
      }
      
      // Check description
      if (item.description && item.description.toLowerCase().includes(normalizedTerm)) {
        return true;
      }
      
      // Check content if available
      if (item.content && item.content.toLowerCase().includes(normalizedTerm)) {
        return true;
      }
      
      // Check excerpt as fallback
      if (item.excerpt && item.excerpt.toLowerCase().includes(normalizedTerm)) {
        return true;
      }
      
      return false;
    });
    
    setSearchResults(results);
  }, [searchIndex]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  // Navigate to a search result
  const navigateToResult = (result: SearchResult) => {
    window.location.href = result.url;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-lg font-medium">Search Documentation</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)} 
            className="absolute right-4 top-4"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <div className="px-4 pb-2">
          <Input
            placeholder="Search for documentation..."
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            autoFocus
            className="h-10"
          />
        </div>
        
        {isLoading && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading search index...
          </div>
        )}
        
        {error && (
          <div className="p-4 text-center text-sm text-destructive">
            {error}
          </div>
        )}
        
        {!isLoading && !error && searchTerm && searchResults.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No results found for "{searchTerm}"
          </div>
        )}
        
        {searchResults.length > 0 && (
          <div className="max-h-[300px] overflow-y-auto">
            <ul className="divide-y">
              {searchResults.map((result) => (
                <li key={result.id} className="p-3 hover:bg-accent cursor-pointer">
                  <button 
                    className="text-left w-full block"
                    onClick={() => navigateToResult(result)}
                  >
                    <p className="font-medium text-foreground">{result.title || result.url}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.description || result.excerpt}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 