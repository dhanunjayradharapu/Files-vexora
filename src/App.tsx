/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ToolPage } from './pages/ToolPage';
import { ToolCategory } from './data/tools';

export default function App() {
  const [currentToolId, setCurrentToolId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#/tool/')) {
        return hash.replace('#/tool/', '');
      }
    }
    return null;
  });

  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sync hash routing with window hashchange events
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/tool/')) {
        const id = hash.replace('#/tool/', '');
        setCurrentToolId(id);
      } else {
        setCurrentToolId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTool = (toolId: string) => {
    setCurrentToolId(toolId);
    window.location.hash = `#/tool/${toolId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setCurrentToolId(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-[#1E1B4B] dark:text-slate-100 transition-colors">
      <Header
        onNavigateHome={handleNavigateHome}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex-1">
        {currentToolId ? (
          <ToolPage
            toolId={currentToolId}
            onNavigateHome={handleNavigateHome}
            onSelectTool={handleSelectTool}
          />
        ) : (
          <HomePage
            onSelectTool={handleSelectTool}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
      </div>

      <Footer
        onSelectCategory={(cat) => {
          handleNavigateHome();
          setSelectedCategory(cat);
        }}
        onSelectTool={handleSelectTool}
      />
    </div>
  );
}
