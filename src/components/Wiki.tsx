import React, { useState, useMemo } from 'react';
import {
  WIKI_ARTICLES,
  WIKI_CATEGORIES,
  WikiArticle,
} from '../data/wikiData';
import {
  Search,
  BookOpen,
  Sparkles,
  Code2,
  Wrench,
  Terminal,
  Palette,
  Shield,
  ShoppingBag,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  Tag,
  Clock,
  ArrowRight,
  ChevronRight,
  Bookmark,
  Printer,
  Compass,
} from 'lucide-react';
import { Tool } from '../types';
import { TOOLS } from '../data/toolsData';

interface WikiProps {
  onOpenTool?: (tool: Tool) => void;
  onOpenShop?: () => void;
  onOpenSupport?: () => void;
}

export const Wiki: React.FC<WikiProps> = ({
  onOpenTool,
  onOpenShop,
  onOpenSupport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedArticleId, setSelectedArticleId] = useState<string>(
    WIKI_ARTICLES[0]?.id || ''
  );
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Icon mapping for categories
  const getCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Code2':
        return <Code2 className={className} />;
      case 'Wrench':
        return <Wrench className={className} />;
      case 'Terminal':
        return <Terminal className={className} />;
      case 'Palette':
        return <Palette className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'ShoppingBag':
        return <ShoppingBag className={className} />;
      case 'HelpCircle':
        return <HelpCircle className={className} />;
      default:
        return <BookOpen className={className} />;
    }
  };

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return WIKI_ARTICLES.filter((art) => {
      const matchesCategory =
        selectedCategory === 'all' || art.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const activeArticle = useMemo(() => {
    const found = WIKI_ARTICLES.find((a) => a.id === selectedArticleId);
    return found || filteredArticles[0] || WIKI_ARTICLES[0];
  }, [selectedArticleId, filteredArticles]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleLaunchTool = (toolId: string) => {
    const tool = TOOLS.find((t) => t.id === toolId);
    if (tool && onOpenTool) {
      onOpenTool(tool);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Header */}
      <div className="mb-8 p-6 md:p-8 rounded-3xl glass-panel bg-white/75 border border-slate-200/90 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700 mb-3 shadow-xs">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              <span>IND HUB Documentation & Knowledge Base</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
              Official Wiki & Developer Manual
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Explore in-depth documentation, polymorphic Luau obfuscation guides,
              micro-benchmarking methodologies, API testing specs, and instant pack activation workflows.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 clay-button flex items-center gap-2 cursor-pointer"
              title="Print documentation article"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print Guide</span>
            </button>
            {onOpenSupport && (
              <button
                onClick={onOpenSupport}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold clay-button-primary flex items-center gap-2 cursor-pointer transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Need Assistance?</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Wiki Search Bar */}
        <div className="mt-6 relative z-10">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documentation, VM obfuscator, regex patterns, sensitivity math, pricing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'clay-button text-slate-700 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>All Topics ({WIKI_ARTICLES.length})</span>
        </button>

        {WIKI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'clay-button text-slate-700 hover:text-slate-900'
            }`}
          >
            {getCategoryIcon(cat.icon)}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Two Column Layout: Navigation Sidebar + Article Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Article List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 mb-1">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-600">
              Articles ({filteredArticles.length})
            </span>
            {searchQuery && (
              <span className="text-blue-600 font-medium">
                Filtered by &quot;{searchQuery}&quot;
              </span>
            )}
          </div>

          {filteredArticles.length === 0 ? (
            <div className="p-8 rounded-2xl glass-panel bg-white/70 text-center border border-slate-200">
              <Search className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">No matching articles</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your keywords or category filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 px-3 py-1.5 rounded-lg text-xs font-semibold clay-button text-slate-700 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredArticles.map((article) => {
              const isSelected = activeArticle?.id === article.id;
              return (
                <div
                  key={article.id}
                  onClick={() => setSelectedArticleId(article.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-blue-50/90 border-blue-300 shadow-sm'
                      : 'glass-card bg-white/70 border-slate-200/90 hover:bg-white/90'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {article.readTime}
                    </span>
                  </div>

                  <h3
                    className={`text-sm font-bold leading-snug line-clamp-2 ${
                      isSelected ? 'text-blue-900' : 'text-slate-900'
                    }`}
                  >
                    {article.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                    {article.summary}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1 text-slate-400">
                      <Tag className="w-3 h-3" />
                      <span>{article.tags.slice(0, 2).join(', ')}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Article Content */}
        <div className="lg:col-span-8">
          {activeArticle ? (
            <article className="p-6 md:p-8 rounded-3xl glass-panel bg-white/85 border border-slate-200/90 relative shadow-sm">
              {/* Top Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold uppercase tracking-wider text-[10px]">
                    {activeArticle.category}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {activeArticle.readTime}
                  </span>
                </div>

                {activeArticle.relatedToolId && onOpenTool && (
                  <button
                    onClick={() => handleLaunchTool(activeArticle.relatedToolId!)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold clay-button text-blue-700 border border-blue-200 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>Launch Associated Tool</span>
                    <ExternalLink className="w-3 h-3 text-blue-600" />
                  </button>
                )}
              </div>

              {/* Title & Summary */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-3">
                {activeArticle.title}
              </h1>
              <p className="text-sm font-medium text-slate-700 bg-slate-50/90 p-4 rounded-2xl border border-slate-200 mb-6 leading-relaxed">
                {activeArticle.summary}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mb-6">
                {activeArticle.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-md text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Content Body */}
              <div className="prose prose-sm max-w-none text-slate-700 space-y-4 leading-relaxed text-sm">
                {activeArticle.content.split('\n\n').map((paragraph, idx) => {
                  const trimmed = paragraph.trim();
                  if (!trimmed) return null;

                  if (trimmed.startsWith('### ')) {
                    return (
                      <h3
                        key={idx}
                        className="text-base font-bold text-slate-900 pt-3 pb-1 border-b border-slate-200"
                      >
                        {trimmed.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (trimmed.startsWith('#### ')) {
                    return (
                      <h4
                        key={idx}
                        className="text-sm font-bold text-blue-700 pt-2"
                      >
                        {trimmed.replace('#### ', '')}
                      </h4>
                    );
                  }
                  if (trimmed.startsWith('1. ') || trimmed.startsWith('- ')) {
                    const lines = trimmed.split('\n');
                    return (
                      <ul key={idx} className="space-y-1.5 pl-4 list-disc list-outside text-slate-700">
                        {lines.map((line, lidx) => (
                          <li key={lidx} className="pl-1">
                            {line.replace(/^[-*]|\d+\.\s*/, '').trim()}
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p key={idx} className="text-slate-700 leading-relaxed">
                      {trimmed}
                    </p>
                  );
                })}
              </div>

              {/* Code Snippet Box */}
              {activeArticle.codeSnippet && (
                <div className="mt-8 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-mono text-slate-300 uppercase text-[11px]">
                        {activeArticle.codeSnippet.language} Reference
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyCode(activeArticle.codeSnippet!.code)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedSnippet ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed bg-slate-950">
                    <code>{activeArticle.codeSnippet.code}</code>
                  </pre>
                </div>
              )}

              {/* Bottom Quick Navigation & Call to Action */}
              <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                  <span>IND HUB Official Documentation v3.5.0</span>
                </div>

                <div className="flex items-center gap-3">
                  {onOpenShop && (
                    <button
                      onClick={onOpenShop}
                      className="px-3.5 py-2 rounded-xl clay-button text-blue-700 border-blue-200 font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Explore Pricing & Packs</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ) : (
            <div className="p-12 text-center rounded-2xl glass-card bg-white/70 border border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-800">Select an article to begin reading</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
