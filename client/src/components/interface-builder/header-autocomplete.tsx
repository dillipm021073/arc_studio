import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HeaderAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  type: 'key' | 'value';
  currentKey?: string;
}

// Common HTTP headers with their common values
const COMMON_HEADERS: Record<string, string[]> = {
  'Accept': [
    'application/json',
    'application/xml',
    'text/html',
    'text/plain',
    '*/*',
    'application/json, text/plain, */*'
  ],
  'Accept-Encoding': ['gzip, deflate', 'gzip, deflate, br', 'gzip', 'deflate', 'br'],
  'Accept-Language': ['en-US,en;q=0.9', 'en-US', 'en', '*'],
  'Authorization': ['Bearer ', 'Basic ', 'Token '],
  'Cache-Control': ['no-cache', 'no-store', 'max-age=0', 'must-revalidate'],
  'Connection': ['keep-alive', 'close'],
  'Content-Type': [
    'application/json',
    'application/xml',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
    'text/xml',
    'text/html'
  ],
  'Content-Length': [],
  'Cookie': [],
  'Host': [],
  'Origin': [],
  'Referer': [],
  'User-Agent': [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'PostmanRuntime/7.32.1',
    'axios/1.5.0'
  ],
  'X-Requested-With': ['XMLHttpRequest'],
  'X-API-Key': [],
  'X-Auth-Token': [],
  'X-CSRF-Token': [],
  'X-Forwarded-For': [],
  'X-Forwarded-Host': [],
  'X-Forwarded-Proto': ['https', 'http'],
  'If-None-Match': [],
  'If-Modified-Since': [],
  'SOAPAction': []
};

export function HeaderAutocomplete({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  type,
  currentKey
}: HeaderAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type === 'key') {
      // Filter header keys
      const filtered = Object.keys(COMMON_HEADERS).filter(header =>
        header.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0 && value.length > 0);
    } else if (type === 'value' && currentKey) {
      // Get common values for the current header key
      const headerValues = COMMON_HEADERS[currentKey] || [];
      const filtered = headerValues.filter(val =>
        val.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setIsOpen(false);
    }
  }, [value, type, currentKey]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          selectSuggestion(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (type === 'key' && value.length > 0) {
            const filtered = Object.keys(COMMON_HEADERS).filter(header =>
              header.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredSuggestions(filtered);
            setIsOpen(filtered.length > 0);
          }
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      
      {isOpen && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700",
                selectedIndex === index && "bg-gray-100 dark:bg-gray-700"
              )}
              onClick={() => selectSuggestion(suggestion)}
            >
              <span className="text-sm">{suggestion}</span>
              {type === 'key' && COMMON_HEADERS[suggestion]?.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  ({COMMON_HEADERS[suggestion].length} common values)
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}