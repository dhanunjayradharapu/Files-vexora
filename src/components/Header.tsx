import React, { useState } from 'react';
import { Search, Menu, X, FileBox, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ToolCategory } from '../data/tools';

interface HeaderProps {
  onNavigateHome: () => void;
  onSelectCategory: (category: ToolCategory | null) => void;
  onOpenSearch?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateHome,
  onSelectCategory,
  searchQuery,
  setSearchQuery,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const handleNavClick = (category: ToolCategory | null) => {
    onNavigateHome();
    onSelectCategory(category);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick(null)}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-lg group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-all ring-1 ring-white/20">
              <span className="font-extrabold tracking-tighter text-base font-mono">V</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-[#1E1B4B] dark:text-white whitespace-nowrap">
                Vex<span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">ora</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500 hidden sm:block -mt-1 font-mono">
                Workspace
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => handleNavClick(null)}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap cursor-pointer py-1"
          >
            All Tools
          </button>
          <button
            onClick={() => handleNavClick('pdf')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap cursor-pointer py-1"
          >
            PDF Tools
          </button>
          <button
            onClick={() => handleNavClick('image')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap cursor-pointer py-1"
          >
            Image Tools
          </button>
          <button
            onClick={() => handleNavClick('powerpoint')}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap cursor-pointer py-1"
          >
            PowerPoint
          </button>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
              setTimeout(() => {
                const el = document.getElementById('faq');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap cursor-pointer py-1"
          >
            FAQ
          </a>
        </nav>

        {/* Zone 3: Search, Theme Toggle & Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Search bar desktop */}
          <div className="relative hidden lg:block w-52 xl:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tools (e.g. compress)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onNavigateHome();
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-[#1E1B4B] dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search toggle on smaller screens */}
          <button
            onClick={() => setIsSearchVisible(!isSearchVisible)}
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Privacy badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>100% Client-Side</span>
          </div>

          {/* Mobile hamburger menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search bar dropdown */}
      {isSearchVisible && (
        <div className="lg:hidden px-4 pb-3 pt-1 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search all tools..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onNavigateHome();
              }}
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 text-[#1E1B4B] dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 shadow-lg">
          <button
            onClick={() => handleNavClick(null)}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600"
          >
            All Tools
          </button>
          <button
            onClick={() => handleNavClick('pdf')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600"
          >
            PDF Tools
          </button>
          <button
            onClick={() => handleNavClick('image')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600"
          >
            Image Tools
          </button>
          <button
            onClick={() => handleNavClick('powerpoint')}
            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600"
          >
            PowerPoint Tools
          </button>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              onNavigateHome();
              setMobileMenuOpen(false);
              setTimeout(() => {
                const el = document.getElementById('faq');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600"
          >
            FAQ & Privacy
          </a>
        </div>
      )}
    </header>
  );
};
