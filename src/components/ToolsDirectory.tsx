import React, { useState, useMemo } from 'react';
import { TOOLS, CATEGORIES } from '../data/toolsData';
import { Tool, ToolCategory } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Wrench,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { ToolIcon } from './ToolIcon';

interface ToolsDirectoryProps {
  onOpenTool: (tool: Tool) => void;
  onOpenShop: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const ToolsDirectory: React.FC<ToolsDirectoryProps> = ({
  onOpenTool,
  onOpenShop,
  searchQuery,
  onSearchChange,
}) => {
  const { hasAccessToPack } = useAuth();
  const [search, setSearch] = useState(searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'free' | 'premium'>('all');

  const freeCount = useMemo(() => TOOLS.filter((t) => !t.pack).length, []);
  const packCount = useMemo(() => TOOLS.filter((t) => Boolean(t.pack)).length, []);

  // Synchronize with external search query if provided (e.g. from Navbar global search)
  React.useEffect(() => {
    if (searchQuery !== undefined) {
      setSearch(searchQuery);
    }
  }, [searchQuery]);

  const handleSearchInput = (val: string) => {
    setSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const filteredTools = TOOLS.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (accessFilter === 'free' && t.pack) return false;
    if (accessFilter === 'premium' && !t.pack) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.pack && t.pack.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hero Search & Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3 pt-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Developer & Creator Workspace
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          40 curated, client-side tools running privately in your browser.
          Zero telemetry, zero tracking, instant execution.
        </p>

        {/* Search Input */}
        <div className="relative max-w-xl mx-auto pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search all 40 utilities (e.g. JSON, Base64, Cron, Luau, cURL, RegEx)..."
            className="w-full bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearchInput('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'clay-button text-slate-700 hover:text-slate-900'
            }`}
          >
            All Tools ({TOOLS.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = TOOLS.filter((t) => t.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'clay-button text-slate-700 hover:text-slate-900'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Secondary Access Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500 pt-1">
          <span className="whitespace-nowrap shrink-0">
            Showing <strong className="text-slate-900 font-semibold">{filteredTools.length}</strong> of {TOOLS.length} utilities
          </span>

          <div className="flex items-center gap-1.5 p-1 bg-white/80 backdrop-blur-md rounded-xl border border-slate-200 shadow-xs shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setAccessFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer ${accessFilter === 'all' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All
            </button>
            <button
              onClick={() => setAccessFilter('free')}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer ${accessFilter === 'free' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Free ({freeCount})
            </button>
            <button
              onClick={() => setAccessFilter('premium')}
              className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer ${accessFilter === 'premium' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Packs ({packCount})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Tools */}
      {filteredTools.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Wrench className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-slate-800">No tools match your query.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setAccessFilter('all');
            }}
            className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTools.map((tool) => {
            const isUnlocked = hasAccessToPack(tool.pack);

            return (
              <div
                key={tool.id}
                onClick={() => onOpenTool(tool)}
                className="group glass-card rounded-2xl p-5 flex flex-col justify-between transition-all hover:-translate-y-1 cursor-pointer relative"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                      <ToolIcon name={tool.icon} className="w-5 h-5" />
                    </div>

                    {tool.pack ? (
                      <span
                        className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isUnlocked
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1'
                        }`}
                      >
                        {!isUnlocked && <Lock className="w-2.5 h-2.5" />}
                        <span>{tool.badge || tool.pack.toUpperCase()}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
                        FREE
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500 text-[11px] uppercase tracking-wider">
                    {CATEGORIES.find((c) => c.id === tool.category)?.name}
                  </span>
                  <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                    <span>{isUnlocked ? 'Launch' : 'Unlock'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
