import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight, CornerDownLeft, Sparkles, Lock, CheckCircle2 } from 'lucide-react';
import { TOOLS, CATEGORIES } from '../data/toolsData';
import { Tool } from '../types';
import { ToolIcon } from './ToolIcon';
import { useAuth } from '../context/AuthContext';

interface GlobalSearchBarProps {
  onOpenTool: (tool: Tool) => void;
  onFilterInDirectory?: (query: string) => void;
  className?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onOpenTool,
  onFilterInDirectory,
  className = '',
}) => {
  const { hasAccessToPack } = useAuth();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Detect OS for shortcut hint (⌘K vs Ctrl+K)
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent));
    }
  }, []);

  // Global keyboard shortcut to focus search: Cmd+K / Ctrl+K / '/'
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in another input/textarea
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInputActive =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category name map for quick labels
  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    CATEGORIES.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, []);

  // Search & relevance scoring algorithm
  const filteredTools = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // When empty and opened, show top 6 featured tools
      return TOOLS.filter((t) => t.featured).slice(0, 6);
    }

    return TOOLS.map((tool) => {
      const name = tool.name.toLowerCase();
      const desc = tool.description.toLowerCase();
      const cat = tool.category.toLowerCase();
      const pack = (tool.pack || '').toLowerCase();
      const badge = (tool.badge || '').toLowerCase();

      let score = -1;

      if (name === trimmed) {
        score = 100;
      } else if (name.startsWith(trimmed)) {
        score = 80;
      } else if (name.includes(trimmed)) {
        score = 60;
      } else if (desc.includes(trimmed)) {
        score = 40;
      } else if (cat.includes(trimmed) || (categoryMap[tool.category] && categoryMap[tool.category].toLowerCase().includes(trimmed))) {
        score = 30;
      } else if (pack.includes(trimmed) || badge.includes(trimmed)) {
        score = 20;
      }

      return { tool, score };
    })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.tool);
  }, [query, categoryMap]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  const handleSelectTool = (tool: Tool) => {
    onOpenTool(tool);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredTools.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredTools.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredTools.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools.length > 0 && selectedIndex < filteredTools.length) {
        handleSelectTool(filteredTools[selectedIndex]);
      } else if (onFilterInDirectory && query.trim()) {
        onFilterInDirectory(query.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleViewInDirectory = () => {
    if (onFilterInDirectory) {
      onFilterInDirectory(query.trim());
      setIsOpen(false);
    }
  };

  const popularSuggestions = ['JSON', 'cURL', 'Regex', 'Base64', 'Luau', 'Color', 'JWT', 'Cron'];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex items-center group">
        <div className="absolute left-3 pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
          <Search className="w-3.5 h-3.5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Filter tools by name or description..."
          className="w-full bg-white/90 hover:bg-white focus:bg-white text-slate-900 placeholder-slate-400 text-xs rounded-xl pl-9 pr-14 py-2 border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
        />

        {/* Right Action: Clear Button or Keyboard Shortcut */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200 pointer-events-none select-none">
              {isMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Glassmorphic Dropdown (Light Mode) */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 md:left-auto md:right-0 md:w-[480px] lg:w-[540px] mt-2 glass-panel bg-white/95 border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn">
          {/* Header Bar */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {query.trim() ? `Search Results` : `Featured Tools`}
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-semibold">
                {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
              </span>
            </div>

            {query.trim() && onFilterInDirectory && (
              <button
                type="button"
                onClick={handleViewInDirectory}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Open in Directory</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Results List */}
          <div ref={listRef} className="max-h-[380px] overflow-y-auto py-1 scrollbar-thin divide-y divide-slate-100">
            {filteredTools.length > 0 ? (
              filteredTools.map((tool, idx) => {
                const isSelected = idx === selectedIndex;
                const isUnlocked = hasAccessToPack(tool.pack);
                const categoryLabel = categoryMap[tool.category] || tool.category;

                return (
                  <div
                    key={tool.id}
                    onClick={() => handleSelectTool(tool)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-4 py-3 cursor-pointer flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Tool Icon in Frosted Container */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <ToolIcon name={tool.icon} className="w-4 h-4" />
                    </div>

                    {/* Tool Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                          {tool.name}
                        </span>

                        {/* Category Tag */}
                        <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[130px]">
                          {categoryLabel}
                        </span>

                        {/* Tier / Entitlement Badge */}
                        {tool.pack ? (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ml-auto shrink-0 flex items-center gap-1 ${
                              isUnlocked
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isUnlocked ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>UNLOCKED</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-2.5 h-2.5" />
                                <span>{tool.badge || `${tool.pack.toUpperCase()} PACK`}</span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 ml-auto shrink-0">
                            FREE
                          </span>
                        )}
                      </div>

                      {/* Tool Description */}
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>

                    {/* Enter shortcut hint when selected */}
                    {isSelected && (
                      <div className="hidden sm:flex items-center text-blue-600 shrink-0 self-center pl-1">
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800">
                    No tools match &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Try searching by tool name, keyword, or description.
                  </p>
                </div>

                {/* Quick suggestions */}
                <div className="pt-2">
                  <div className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                    Popular Utilities
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {popularSuggestions.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setQuery(item);
                          inputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Shortcuts Guide */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between text-[10px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-mono shadow-xs">↑</kbd>
                <kbd className="px-1 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-mono shadow-xs">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-mono shadow-xs">↵</kbd>
                <span>Launch</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-mono shadow-xs">esc</kbd>
                <span>Close</span>
              </span>
            </div>

            <span className="text-slate-500 hidden sm:inline">
              40 tools available
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
