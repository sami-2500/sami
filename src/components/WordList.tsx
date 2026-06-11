/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Word, WordProgress, MasteryState } from '../types';
import { 
  Search, 
  Volume2, 
  Star, 
  Check, 
  Filter, 
  BookOpen, 
  Layers, 
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WordListProps {
  words: Word[];
  progress: Record<string, WordProgress>;
  onToggleStar: (wordId: string) => void;
  onUpdateMastery: (wordId: string, state: MasteryState) => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  categories: Record<string, { name: string; description: string; icon: string; color: string }>;
}

export default function WordList({
  words,
  progress,
  onToggleStar,
  onUpdateMastery,
  activeCategory,
  onSelectCategory,
  categories,
}: WordListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPos, setSelectedPos] = useState<string>('all');
  const [selectedMastery, setSelectedMastery] = useState<string>('all');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  // Play audio using native Web Speech Synthesis
  const playAudio = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      
      utterance.onstart = () => setPlayingWordId(id);
      utterance.onend = () => setPlayingWordId(null);
      utterance.onerror = () => setPlayingWordId(null);

      window.speechSynthesis.speak(utterance);
    } else {
      alert('مرورگر شما از قابلیت تلفظ صوتی پشتیبانی نمی‌کند.');
    }
  };

  const filteredWords = useMemo(() => {
    return words.filter((item) => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }

      // POS filter
      if (selectedPos !== 'all' && item.pos !== selectedPos) {
        return false;
      }

      // Search term
      const wSearch = item.word.toLowerCase();
      const mSearch = item.meaning.toLowerCase();
      const query = searchTerm.toLowerCase();
      if (searchTerm && !wSearch.includes(query) && !mSearch.includes(query)) {
        return false;
      }

      // Starred filter
      const wordProg = progress[item.id];
      const isStarred = wordProg?.starred || false;
      if (showStarredOnly && !isStarred) {
        return false;
      }

      // Mastery filter
      const mastery = wordProg?.mastery || 'unseen';
      if (selectedMastery !== 'all' && mastery !== selectedMastery) {
        return false;
      }

      return true;
    });
  }, [words, progress, activeCategory, selectedPos, searchTerm, showStarredOnly, selectedMastery]);

  // Statistics for active category
  const activeStats = useMemo(() => {
    const catWords = words.filter(w => activeCategory === 'all' || w.category === activeCategory);
    const total = catWords.length;
    let mastered = 0;
    let learning = 0;
    let starCount = 0;

    catWords.forEach((item) => {
      const prog = progress[item.id];
      if (prog) {
        if (prog.mastery === 'mastered') mastered++;
        else if (prog.mastery === 'learning') learning++;
        if (prog.starred) starCount++;
      }
    });

    const unseen = total - mastered - learning;

    return { total, mastered, learning, unseen, starCount };
  }, [words, progress, activeCategory]);

  return (
    <div className="space-y-6" id="word-list-section">
      {/* Category selector */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          id={`category-all-btn`}
          onClick={() => onSelectCategory('all')}
          className={`relative p-4 rounded-none border text-right transition-all duration-300 overflow-hidden group ${
            activeCategory === 'all'
              ? 'border-black bg-white shadow-editorial'
              : 'border-black/20 bg-white/70 hover:bg-white hover:border-black'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`p-2 rounded-none text-black ${activeCategory === 'all' ? 'bg-stone-100 border border-black' : 'bg-stone-100 border border-stone-200'}`}>
              <Layers className="h-5 w-5" />
            </span>
            {activeCategory === 'all' && (
              <span className="h-2 w-2 rounded-full bg-black" />
            )}
          </div>
          <h3 className="font-serif font-black text-black text-sm">همه دسته‌ها</h3>
          <p className="text-xs text-stone-500 mt-1">مرور تمام {words.length} واژه</p>
        </button>

        {Object.entries(categories).map(([key, cat]) => {
          const isSelected = activeCategory === key;
          const count = words.filter((w) => w.category === key).length;
          
          return (
            <button
              id={`category-${key}-btn`}
              key={key}
              onClick={() => onSelectCategory(key)}
              className={`relative p-4 rounded-none border text-right transition-all duration-300 overflow-hidden ${
                isSelected
                  ? 'border-black bg-white shadow-editorial'
                  : 'border-black/20 bg-white/70 hover:bg-white hover:border-black'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`p-2 rounded-none text-black ${isSelected ? 'bg-stone-100 border border-black' : 'bg-stone-100 border border-stone-200'}`}>
                  {cat.icon === 'MessageSquare' && <BookOpen className="h-5 w-5" />}
                  {cat.icon === 'GraduationCap' && <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>}
                  {cat.icon === 'Briefcase' && <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
                  {cat.icon === 'Compass' && <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>}
                </span>
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-black" />
                )}
              </div>
              <h3 className="font-serif font-black text-black text-sm">{cat.name}</h3>
              <p className="text-xs text-stone-500 mt-1">{count} واژه کاربردی</p>
            </button>
          );
        })}
      </div>

      {/* Mini Stats Banner */}
      <div className="bg-black text-[#F8F8F3] p-5 rounded-none shadow-editorial border border-black flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-right">
          <h4 className="text-sm font-serif font-black text-[#F8F8F3]">وضعیت دسته فعلی: <span className="text-stone-300 font-bold">{activeCategory === 'all' ? 'همه دسته‌ها' : categories[activeCategory]?.name}</span></h4>
          <p className="text-xs text-stone-400 mt-1 font-mono tracking-wide uppercase">Total words: {activeStats.total}</p>
        </div>
        <div className="grid grid-cols-4 gap-2 w-full sm:w-auto text-center">
          <div className="bg-stone-900 border border-stone-800 px-3.5 py-2 rounded-none">
            <span className="block text-lg font-bold text-white font-mono">{activeStats.mastered}</span>
            <span className="text-[10px] text-stone-400 font-bold">بلدم</span>
          </div>
          <div className="bg-stone-900 border border-stone-800 px-3.5 py-2 rounded-none">
            <span className="block text-lg font-bold text-white font-mono">{activeStats.learning}</span>
            <span className="text-[10px] text-stone-400 font-bold">در حال مطالعه</span>
          </div>
          <div className="bg-stone-900 border border-stone-800 px-3.5 py-2 rounded-none">
            <span className="block text-lg font-bold text-stone-500 font-mono">{activeStats.unseen}</span>
            <span className="text-[10px] text-stone-400 font-bold">جدید</span>
          </div>
          <div className="bg-stone-900 border border-stone-800 px-3.5 py-2 rounded-none">
            <span className="block text-lg font-bold text-yellow-500 font-mono">{activeStats.starCount}</span>
            <span className="text-[10px] text-stone-400 font-bold">نشان‌شده</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#FCFCFA] p-5 rounded-none shadow-editorial-sm border border-black space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1" id="search-input-wrapper">
            <input
              type="text"
              placeholder="جستجوی لغت انگلیسی یا معنی فارسی..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-11 pl-4 py-3 bg-white border border-black rounded-none text-black focus:outline-none focus:ring-0 focus:border-black font-sans text-sm placeholder:text-stone-400 font-medium"
            />
            <Search className="absolute right-4 top-3.5 h-5 w-5 text-black pointer-events-none" />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* POS Filter */}
            <div className="relative flex items-center bg-white border border-black rounded-none px-3 py-1">
              <span className="text-[11px] text-stone-500 font-black ml-2 font-serif">نقش کلمه:</span>
              <select
                id="pos-select-filter"
                value={selectedPos}
                onChange={(e) => setSelectedPos(e.target.value)}
                className="bg-transparent text-xs text-black font-bold focus:outline-none cursor-pointer py-2 pl-2"
              >
                <option value="all">همه نقش‌ها</option>
                <option value="noun">Noun (اسم)</option>
                <option value="verb">Verb (فعل)</option>
                <option value="adjective">Adjective (صفت)</option>
                <option value="adverb">Adverb (قید)</option>
              </select>
            </div>

            {/* Mastery Filter */}
            <div className="relative flex items-center bg-white border border-black rounded-none px-3 py-1">
              <span className="text-[11px] text-stone-500 font-black ml-2 font-serif">وضعیت یادگیری:</span>
              <select
                id="mastery-select-filter"
                value={selectedMastery}
                onChange={(e) => setSelectedMastery(e.target.value)}
                className="bg-transparent text-xs text-black font-bold focus:outline-none cursor-pointer py-2 pl-2"
              >
                <option value="all">همه حالت‌ها</option>
                <option value="unseen">خوانده نشده (جدید)</option>
                <option value="learning">در حال یادگیری</option>
                <option value="mastered">کاملاً بلدم (ملکه ذهن)</option>
              </select>
            </div>

            {/* Starred-only button */}
            <button
              id="starred-only-toggle"
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-none border text-xs font-bold transition-all duration-200 cursor-pointer ${
                showStarredOnly
                  ? 'bg-black border-black text-white shadow-editorial-sm'
                  : 'bg-white border-black/30 text-stone-700 hover:bg-stone-100 shadow-editorial-sm'
              }`}
            >
              <Star className={`h-4 w-4 ${showStarredOnly ? 'fill-current' : ''}`} />
              فقط نشان‌شده‌ها
            </button>
          </div>
        </div>
      </div>

      {/* Words Grid Layout */}
      <div>
        {filteredWords.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-none border border-black shadow-editorial-sm space-y-4">
            <span className="inline-block p-4 rounded-none bg-stone-100 border border-black text-stone-600">
              <HelpCircle className="h-10 w-10" />
            </span>
            <h3 className="text-lg font-serif font-black text-black">هیچ کلمه‌ای یافت نشد</h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto">
              بسته به فیلترها و کلمه مورد جستجو، واژه‌ای یافت نشد. فیلترها را تغییر دهید یا واژگان جدید اضافه کنید.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredWords.map((item, index) => {
                const prog = progress[item.id] || { wordId: item.id, mastery: 'unseen', starred: false };
                const isPlaying = playingWordId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    id={`word-card-${item.id}`}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
                    className="group bg-[#FCFCFA] p-6 rounded-none border border-black hover:border-black hover:shadow-editorial shadow-editorial-sm transition-all duration-300 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Action Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <button
                            id={`star-btn-${item.id}`}
                            onClick={() => onToggleStar(item.id)}
                            className={`p-2 rounded-none transition-all border ${
                              prog.starred
                                ? 'bg-amber-100 border-black text-black'
                                : 'bg-white border-black/20 text-stone-400 hover:text-black group-hover:bg-amber-50/50'
                            }`}
                          >
                            <Star className={`h-4.5 w-4.5 ${prog.starred ? 'fill-current text-amber-500' : ''}`} />
                          </button>

                          <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-none bg-stone-100 text-stone-800 border border-stone-300 font-bold">
                            {item.pos === 'noun' && 'اسم (Noun)'}
                            {item.pos === 'verb' && 'فعل (Verb)'}
                            {item.pos === 'adjective' && 'صفت (Adj)'}
                            {item.pos === 'adverb' && 'قید (Adv)'}
                            {item.pos === 'other' && 'سایر'}
                          </span>
                        </div>

                        {/* Mastery status badge */}
                        <div className="text-xs font-serif">
                          {prog.mastery === 'mastered' && (
                            <span className="bg-stone-900 text-white font-bold px-2.5 py-1 rounded-none flex items-center gap-1.5 border border-black">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              ملکه ذهن
                            </span>
                          )}
                          {prog.mastery === 'learning' && (
                            <span className="bg-white text-black font-bold px-2.5 py-1 rounded-none flex items-center gap-1.5 border border-black">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                              در حال مطالعه
                            </span>
                          )}
                          {prog.mastery === 'unseen' && (
                            <span className="bg-stone-50 text-stone-500 font-bold px-2.5 py-1 rounded-none flex items-center gap-1.5 border border-stone-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                              جدید / خوانده نشده
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Main English word and Phonetic */}
                      <div className="flex justify-between items-center bg-white p-3.5 rounded-none border border-black/15 mb-4" dir="ltr">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-serif font-black text-black tracking-tight">
                            {item.word}
                          </h2>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-stone-500 font-mono italic">
                              {item.phonetic}
                            </span>
                          </div>
                        </div>

                        <button
                          id={`pronounce-btn-${item.id}`}
                          onClick={() => playAudio(item.word, item.id)}
                          className={`p-3 rounded-none transition-all ${
                            isPlaying
                              ? 'bg-black text-white scale-95 shadow-editorial-sm'
                              : 'bg-white text-black hover:bg-stone-150 border border-black'
                          }`}
                          title="تلفظ با لهجه آمریکایی"
                        >
                          <Volume2 className={`h-5 w-5 ${isPlaying ? 'animate-bounce' : ''}`} />
                        </button>
                      </div>

                      {/* Persian Meaning */}
                      <div className="space-y-1 text-right">
                        <label className="text-[10px] text-stone-400 font-bold block uppercase tracking-wide">معنی به فارسی</label>
                        <p className="text-base font-serif font-black text-[#1a1a1a] pr-1">
                          {item.meaning}
                        </p>
                      </div>

                      {/* Example sentence */}
                      <div className="mt-4 bg-[#FBFBFA] p-4 rounded-none border border-black/10 space-y-2">
                        <div className="space-y-1 text-left" dir="ltr">
                          <span className="text-[9px] font-mono font-bold text-stone-400 block tracking-widest uppercase">EXAMPLE SENTENCE</span>
                          <p className="text-xs font-semibold text-stone-800 leading-relaxed font-sans mt-0.5">
                            {item.example}
                          </p>
                        </div>
                        <div className="space-y-1 text-right border-t border-dashed border-stone-300 pt-2">
                          <span className="text-[9px] font-serif font-bold text-stone-600 block">ترجمه مثال</span>
                          <p className="text-xs text-stone-600 leading-relaxed pr-1 mt-0.5">
                            {item.exampleTranslation}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Master State Switcher Buttons */}
                    <div className="border-t border-stone-200 pt-4 mt-2">
                      <span className="text-[10px] font-serif font-bold text-stone-500 text-right block mb-2">وضعیت یادگیری این لغت را مشخص کنید:</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          id={`mastery-unseen-${item.id}`}
                          onClick={() => onUpdateMastery(item.id, 'unseen')}
                          className={`py-2 rounded-none text-[11px] font-bold transition-all border ${
                            prog.mastery === 'unseen'
                              ? 'bg-stone-200 border-black text-black font-black'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          جدید / نشانه
                        </button>
                        <button
                          id={`mastery-learning-${item.id}`}
                          onClick={() => onUpdateMastery(item.id, 'learning')}
                          className={`py-2 rounded-none text-[11px] font-bold transition-all border ${
                            prog.mastery === 'learning'
                              ? 'bg-stone-900 border-black text-white font-black'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          در حال مطالعه
                        </button>
                        <button
                          id={`mastery-mastered-${item.id}`}
                          onClick={() => onUpdateMastery(item.id, 'mastered')}
                          className={`py-2 rounded-none text-[11px] font-bold transition-all border ${
                            prog.mastery === 'mastered'
                              ? 'bg-black border-black text-white font-black shadow-editorial-sm'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          کاملاً بلدم
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
