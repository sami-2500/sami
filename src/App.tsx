/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Layers, 
  Flame, 
  CheckCircle, 
  RotateCcw, 
  Settings, 
  PlayCircle,
  Award,
  Sparkles,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Core imports
import { INITIAL_WORDS, CATEGORIES } from './data/vocabulary';
import { Word, WordProgress, MasteryState, StreakData } from './types';

// Components
import WordList from './components/WordList';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import CustomWordForm from './components/CustomWordForm';

export default function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'flashcards' | 'quiz' | 'custom'>('list');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Custom words persistence
  const [customWords, setCustomWords] = useState<Word[]>(() => {
    try {
      const stored = localStorage.getItem('vocab_custom_words');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Learning progress persistence
  const [progress, setProgress] = useState<Record<string, WordProgress>>(() => {
    try {
      const stored = localStorage.getItem('vocab_words_progress');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Active streak tracker
  const [streak, setStreak] = useState<StreakData>(() => {
    try {
      const stored = localStorage.getItem('vocab_user_streak');
      return stored ? JSON.parse(stored) : { lastActive: null, count: 0 };
    } catch {
      return { lastActive: null, count: 0 };
    }
  });

  // Calculate composite vocabulary list (built-in + user-generated custom words)
  const allWords = useMemo(() => {
    return [...INITIAL_WORDS, ...customWords];
  }, [customWords]);

  // Sync custom words to localStorage
  useEffect(() => {
    localStorage.setItem('vocab_custom_words', JSON.stringify(customWords));
  }, [customWords]);

  // Sync word progress to localStorage
  useEffect(() => {
    localStorage.setItem('vocab_words_progress', JSON.stringify(progress));
  }, [progress]);

  // Handle active streak on mount or interactions
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let currentStreakCount = streak.count;
    let lastActiveDate = streak.lastActive;

    if (lastActiveDate === null) {
      currentStreakCount = 1;
    } else if (lastActiveDate !== todayStr) {
      const lastDateTime = new Date(lastActiveDate).getTime();
      const todayTime = new Date(todayStr).getTime();
      const diffTime = Math.abs(todayTime - lastDateTime);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreakCount += 1;
      } else if (diffDays > 1) {
        currentStreakCount = 1; // broken streak
      }
    }

    const updated = { lastActive: todayStr, count: currentStreakCount };
    setStreak(updated);
    localStorage.setItem('vocab_user_streak', JSON.stringify(updated));
  }, []);

  // Update streak whenever activeTab shifts (user performs action)
  const trackUserActivity = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (streak.lastActive !== todayStr) {
      setStreak((prev) => {
        const count = prev.count === 0 ? 1 : prev.count;
        const updated = { lastActive: todayStr, count };
        localStorage.setItem('vocab_user_streak', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Add a user-defined custom word
  const handleAddCustomWord = (newWordData: Omit<Word, 'id' | 'isCustom'>) => {
    trackUserActivity();
    const newId = `c-${Date.now()}`;
    const newWord: Word = {
      ...newWordData,
      id: newId,
      isCustom: true,
    };
    setCustomWords((prev) => [newWord, ...prev]);
  };

  // Delete a user-defined custom word
  const handleDeleteCustomWord = (wordId: string) => {
    setCustomWords((prev) => prev.filter((item) => item.id !== wordId));
    setProgress((prev) => {
      const cloned = { ...prev };
      delete cloned[wordId];
      return cloned;
    });
  };

  // Toggle star status of a word
  const handleToggleStar = (wordId: string) => {
    trackUserActivity();
    setProgress((prev) => {
      const curr = prev[wordId] || { wordId, mastery: 'unseen', starred: false };
      return {
        ...prev,
        [wordId]: {
          ...curr,
          starred: !curr.starred,
        },
      };
    });
  };

  // Update mastery state of a word
  const handleUpdateMastery = (wordId: string, state: MasteryState) => {
    trackUserActivity();
    setProgress((prev) => {
      const curr = prev[wordId] || { wordId, mastery: 'unseen', starred: false };
      return {
        ...prev,
        [wordId]: {
          ...curr,
          mastery: state,
        },
      };
    });
  };

  // Factory reset progress & custom words
  const handleResetProgress = () => {
    const confirmReset = window.confirm('آیا مطمئن هستید که می‌خواهید تمام لغات شخصی و پیشرفت‌های تحصیلی خود را حذف کنید؟ این عمل غیرقابل بازگشت است.');
    if (confirmReset) {
      setProgress({});
      setCustomWords([]);
      localStorage.removeItem('vocab_custom_words');
      localStorage.removeItem('vocab_words_progress');
      alert('تمامی لغات شخصی و اطلاعات پیشرفت شما با موفقیت ریست شد.');
    }
  };

  // Computes stats over the whole database
  const overallStats = useMemo(() => {
    const total = allWords.length;
    let mastered = 0;
    let learning = 0;

    allWords.forEach((word) => {
      const prog = progress[word.id];
      if (prog) {
        if (prog.mastery === 'mastered') mastered++;
        else if (prog.mastery === 'learning') learning++;
      }
    });

    const unseen = total - mastered - learning;
    const progressPercent = total > 0 ? Math.round(((mastered + learning) / total) * 100) : 0;
    return { total, mastered, learning, unseen, progressPercent };
  }, [allWords, progress]);

  return (
    <div className="min-h-screen bg-[#F8F8F3] pb-16 flex flex-col items-center">
      
      {/* HEADER SECTION WITH PERSIAN CONCISE BRANDING */}
      <header className="w-full bg-[#F5F5F0] border-b border-black/15 sticky top-0 z-40 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-center">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3.5 text-right">
            <span className="p-2.5 rounded-none bg-black text-white shadow-editorial-sm flex items-center justify-center border border-black">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-[10px] font-mono tracking-widest bg-stone-200 text-stone-800 px-2 py-0.5 rounded-none border border-stone-300 font-bold uppercase">EDITION 1.0</span>
                <h1 className="text-xl font-serif font-black text-black tracking-tight">جعبه لغات انگلیسی همیار</h1>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-1">گزیده یادگیری زبان انگلیسی با الهام از طراحی مطبوعاتی</p>
            </div>
          </div>

          {/* Gamified Active Streaks and Counters */}
          <div className="flex items-center gap-3">
            {/* Mastered word counts */}
            <div className="bg-[#FCFCFA] border border-black rounded-none shadow-editorial-sm px-4 py-1.5 flex items-center gap-2.5" dir="rtl">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <div className="text-right">
                <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block leading-none font-bold">ملکه ذهن</span>
                <span className="text-sm font-extrabold text-black font-mono leading-none mt-1 inline-block">
                  {overallStats.mastered} <span className="text-[10px] font-serif font-bold text-stone-500">کلمه</span>
                </span>
              </div>
            </div>

            {/* Streak count banner */}
            <div className="bg-[#FCFCFA] border border-black rounded-none shadow-editorial-sm px-4 py-1.5 flex items-center gap-2.5" dir="rtl">
              <span className="text-amber-600 flex items-center justify-center">
                <Flame className="h-5 w-5 fill-amber-500 text-amber-500" />
              </span>
              <div className="text-right">
                <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block leading-none font-bold">مطالعه متوالی</span>
                <span className="text-sm font-extrabold text-black font-mono leading-none mt-1 inline-block">
                  {streak.count} <span className="text-[10px] font-serif font-bold text-stone-500">روز</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* OVERALL LEARNING PROGRESS ROW WITH BENTO STATS */}
      <div className="w-full max-w-5xl px-4 mt-8">
        <div className="bg-[#FCFCFA] p-6 rounded-none border border-black shadow-editorial grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Progress Percent circular visual */}
          <div className="flex items-center justify-between sm:justify-start gap-4 text-right">
            <div className="relative h-16 w-16 flex-shrink-0 flex items-center justify-center">
              {/* Outer stroke circle */}
              <svg className="absolute transform -rotate-90 w-16 h-16" viewBox="0 0 36 36">
                <path
                  className="text-stone-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-black"
                  strokeDasharray={`${overallStats.progressPercent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="square"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="text-sm font-bold text-black font-mono">{overallStats.progressPercent}%</span>
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-black">پیشرفت کل یادگیری</h3>
              <p className="text-[11px] text-stone-500 font-medium mt-1">تعداد {overallStats.mastered + overallStats.learning} کلمه در چرخه یادگیری فعال قرار گرفته است.</p>
            </div>
          </div>

          {/* Quick Counter Grid */}
          <div className="grid grid-cols-3 gap-3 border-y md:border-y-0 md:border-x border-stone-200 py-4 md:py-0 md:px-6 text-center">
            <div>
              <span className="block text-xl font-bold text-black font-mono">{overallStats.total}</span>
              <span className="text-[10px] text-stone-500 font-bold">کل لغات</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-stone-900 font-mono">{overallStats.learning}</span>
              <span className="text-[10px] text-stone-500 font-bold">در حال مطالعه</span>
            </div>
            <div>
              <span className="block text-xl font-bold text-stone-400 font-mono">{overallStats.unseen}</span>
              <span className="text-[10px] text-stone-500 font-bold">جدید</span>
            </div>
          </div>

          {/* Reset Action */}
          <div className="flex justify-center md:justify-end">
            <button
              id="reset-learning-app-btn"
              onClick={handleResetProgress}
              className="px-4 py-2.5 bg-white hover:bg-stone-55 border border-black hover:bg-stone-100 text-stone-700 rounded-none text-[11px] font-bold tracking-tight transition-all flex items-center gap-2 shadow-editorial-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              حذف لغات کاستوم و ریست پیشرفت
            </button>
          </div>

        </div>
      </div>

      {/* TAB SELECTOR BAR */}
      <nav className="w-full max-w-5xl px-4 mt-6" id="navigation-tabs" dir="rtl">
        <div className="bg-[#FCFCFA] p-1.5 rounded-none border border-black shadow-editorial-sm grid grid-cols-4 gap-1">
          <button
            id="tab-btn-list"
            onClick={() => setActiveTab('list')}
            className={`py-3.5 rounded-none text-xs font-serif font-black transition-all flex flex-col md:flex-row items-center justify-center gap-2 ${
              activeTab === 'list'
                ? 'bg-black text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>فهرست واژگان</span>
          </button>

          <button
            id="tab-btn-flashcards"
            onClick={() => setActiveTab('flashcards')}
            className={`py-3.5 rounded-none text-xs font-serif font-black transition-all flex flex-col md:flex-row items-center justify-center gap-2 ${
              activeTab === 'flashcards'
                ? 'bg-black text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <PlayCircle className="h-4 w-4" />
            <span>فلش‌کارت مرور</span>
          </button>

          <button
            id="tab-btn-quiz"
            onClick={() => setActiveTab('quiz')}
            className={`py-3.5 rounded-none text-xs font-serif font-black transition-all flex flex-col md:flex-row items-center justify-center gap-2 ${
              activeTab === 'quiz'
                ? 'bg-black text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>سنجش و آزمون</span>
          </button>

          <button
            id="tab-btn-custom"
            onClick={() => setActiveTab('custom')}
            className={`py-3.5 rounded-none text-xs font-serif font-black transition-all flex flex-col md:flex-row items-center justify-center gap-2 ${
              activeTab === 'custom'
                ? 'bg-black text-white'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>واژگان من</span>
          </button>
        </div>
      </nav>

      {/* WORKSPACE CONTENT SHEETS */}
      <main className="w-full max-w-5xl px-4 mt-6 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'list' && (
              <WordList
                words={allWords}
                progress={progress}
                onToggleStar={handleToggleStar}
                onUpdateMastery={handleUpdateMastery}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                categories={CATEGORIES}
              />
            )}

            {activeTab === 'flashcards' && (
              <Flashcards
                words={allWords}
                progress={progress}
                onToggleStar={handleToggleStar}
                onUpdateMastery={handleUpdateMastery}
                categories={CATEGORIES}
              />
            )}

            {activeTab === 'quiz' && (
              <Quiz
                words={allWords}
                categories={CATEGORIES}
              />
            )}

            {activeTab === 'custom' && (
              <CustomWordForm
                customWords={customWords}
                onAddCustomWord={handleAddCustomWord}
                onDeleteCustomWord={handleDeleteCustomWord}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
    </div>
  );
}
