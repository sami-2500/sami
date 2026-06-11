/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Word, WordProgress, MasteryState } from '../types';
import { 
  Volume2, 
  RotateCw, 
  CheckCircle2, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft, 
  Star,
  RefreshCcw,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FlashcardsProps {
  words: Word[];
  progress: Record<string, WordProgress>;
  onToggleStar: (wordId: string) => void;
  onUpdateMastery: (wordId: string, state: MasteryState) => void;
  categories: Record<string, { name: string; description: string; icon: string; color: string }>;
}

export default function Flashcards({
  words,
  progress,
  onToggleStar,
  onUpdateMastery,
  categories,
}: FlashcardsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [playingWord, setPlayingWord] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'starred' | 'learning'>('all');

  // Filter words based on chosen category and sub-filters
  const activeSuite = useMemo(() => {
    return words.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      
      // View mode (progress status filter)
      const prog = progress[item.id];
      if (viewMode === 'starred' && (!prog || !prog.starred)) {
        return false;
      }
      if (viewMode === 'learning' && prog && prog.mastery === 'mastered') {
        return false; // Show only learning or unseen
      }
      return true;
    });
  }, [words, progress, selectedCategory, viewMode]);

  const currentWord = useMemo(() => {
    if (activeSuite.length === 0) return null;
    // Bind to existing index or wrap around
    const idx = Math.min(currentIndex, activeSuite.length - 1);
    return activeSuite[idx >= 0 ? idx : 0];
  }, [activeSuite, currentIndex]);

  const syncIndex = (newIdx: number) => {
    setIsFlipped(false);
    // Wrap index safety
    if (newIdx >= activeSuite.length) {
      setCurrentIndex(0);
    } else if (newIdx < 0) {
      setCurrentIndex(activeSuite.length - 1);
    } else {
      setCurrentIndex(newIdx);
    }
  };

  const playAudio = (text: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid flipping when clicking the speaker
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;

      utterance.onstart = () => setPlayingWord(true);
      utterance.onend = () => setPlayingWord(false);
      utterance.onerror = () => setPlayingWord(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const currentProg = currentWord ? progress[currentWord.id] : null;

  const handleDecision = (state: MasteryState) => {
    if (!currentWord) return;
    onUpdateMastery(currentWord.id, state);
    
    // Automatically transition to the next card after setting status
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex + 1 < activeSuite.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Wrapped list
        setCurrentIndex(0);
        alert('تبریک! به انتهای این مجموعه فلش‌کارت رسیدید. مرور دوباره از ابتدا دایر می‌شود.');
      }
    }, 300);
  };

  return (
    <div className="space-y-6" id="flashcard-section">
      {/* Category and Mode selection header */}
      <div className="bg-[#FCFCFA] p-5 rounded-none border border-black shadow-editorial-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <span className="text-xs font-serif font-black text-black ml-1">بخش مرور:</span>
          {/* Main category select */}
          <select
            id="flashcard-category-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="bg-white border border-black text-xs font-bold text-black px-3 py-2 rounded-none focus:outline-none cursor-pointer"
          >
            <option value="all">همه دسته‌ها</option>
            {Object.entries(categories).map(([key, cat]) => (
              <option key={key} value={key}>{cat.name}</option>
            ))}
          </select>

          {/* Sub collection filters */}
          <button
            id={`viewmode-all-btn`}
            onClick={() => { setViewMode('all'); setCurrentIndex(0); setIsFlipped(false); }}
            className={`px-3 py-2 rounded-none text-xs font-bold transition-all border cursor-pointer ${
              viewMode === 'all'
                ? 'bg-black text-white border-black shadow-editorial-sm'
                : 'bg-white border-black/20 text-stone-600 hover:bg-stone-100 shadow-editorial-sm'
            }`}
          >
            تمام لغات
          </button>
          <button
            id={`viewmode-starred-btn`}
            onClick={() => { setViewMode('starred'); setCurrentIndex(0); setIsFlipped(false); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-none text-xs font-bold transition-all border cursor-pointer ${
              viewMode === 'starred'
                ? 'bg-amber-100 border-black text-black'
                : 'bg-white border-black/20 text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
            فقط نشان‌شده‌ها
          </button>
          <button
            id={`viewmode-learning-btn`}
            onClick={() => { setViewMode('learning'); setCurrentIndex(0); setIsFlipped(false); }}
            className={`px-3 py-2 rounded-none text-xs font-bold transition-all border cursor-pointer ${
              viewMode === 'learning'
                ? 'bg-stone-900 border-black text-white'
                : 'bg-white border-black/20 text-stone-600 hover:bg-stone-100'
            }`}
          >
            واژگان نامسلط (جدید/درحال مطالعه)
          </button>
        </div>

        <div className="text-xs text-stone-600 font-bold font-mono uppercase tracking-wider">
          CARDS COUNT: <span className="text-black font-extrabold">{activeSuite.length}</span>
        </div>
      </div>

      {activeSuite.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-none border border-black shadow-editorial space-y-4">
          <span className="inline-block p-4 rounded-none bg-stone-100 border border-black text-stone-600">
            <BookOpen className="h-10 w-10" />
          </span>
          <h3 className="text-lg font-serif font-black text-black">کارت یادگیری یافت نشد</h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            در این دسته‌بندی و فیلتر انتخابی، کلمه‌ای وجود ندارد. فیلترها را ریست کنید تا کارت‌ها نمایش داده شوند.
          </p>
          <button
            id="reset-flashcards-filters"
            onClick={() => {
              setSelectedCategory('all');
              setViewMode('all');
              setCurrentIndex(0);
              setIsFlipped(false);
            }}
            className="px-5 py-3 bg-black hover:bg-stone-900 text-white text-xs font-bold rounded-none transition-all border border-black shadow-editorial-sm cursor-pointer"
          >
            نمایش همه لغات
          </button>
        </div>
      ) : (
        currentWord && (
          <div className="max-w-xl mx-auto space-y-6">
            {/* Card Progress Indicator */}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-mono font-bold text-stone-450">CARD {currentIndex + 1} OF {activeSuite.length}</span>
              <div className="h-2.5 bg-stone-200 border border-black rounded-none w-40 overflow-hidden">
                <div 
                  className="h-full bg-black transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / activeSuite.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Main Interactive Flip Card Wrapper */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              id="flashcard-click-area"
              className="relative cursor-pointer select-none group min-h-[340px]"
            >
              <AnimatePresence mode="wait">
                {!isFlipped ? (
                  /* FRONT OF CARD */
                  <motion.div
                    key="front"
                    id="flashcard-front"
                    initial={{ opacity: 0, rotateY: -80 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: 80 }}
                    transition={{ duration: 0.25 }}
                    className="w-full bg-[#FCFCFA] p-8 rounded-none border border-black shadow-editorial flex flex-col justify-between min-h-[340px] text-center"
                  >
                    {/* Header Controls */}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono tracking-widest uppercase bg-stone-100 text-stone-800 border border-stone-300 px-2.5 py-1 rounded-none font-bold">
                        {currentWord.pos === 'noun' && 'اسم | Noun'}
                        {currentWord.pos === 'verb' && 'فعل | Verb'}
                        {currentWord.pos === 'adjective' && 'صفت | Adj'}
                        {currentWord.pos === 'adverb' && 'قید | Adv'}
                        {currentWord.pos === 'other' && 'سایر'}
                      </span>
                      
                      <button
                        id="flashcard-star-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(currentWord.id);
                        }}
                        className={`p-2 rounded-none border transition-all cursor-pointer ${
                          currentProg?.starred
                            ? 'bg-amber-100 border-black text-black shadow-editorial-sm'
                            : 'bg-white border-black/20 text-stone-450 hover:text-black hover:border-black'
                        }`}
                      >
                        <Star className={`h-4.5 w-4.5 ${currentProg?.starred ? 'fill-current text-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* Word Middle Content */}
                    <div className="space-y-4" dir="ltr">
                      <h1 className="text-4xl font-serif font-black text-black tracking-tight leading-none">
                        {currentWord.word}
                      </h1>
                      <div className="inline-flex items-center gap-2.5 px-3.5 py-1 bg-white border border-black/10 rounded-none">
                        <span className="text-xs text-stone-605 font-mono italic">
                          {currentWord.phonetic}
                        </span>
                        <div className="h-3.5 w-[1px] bg-stone-200" />
                        <span className="text-[10px] font-serif font-bold text-stone-500">
                          {categories[currentWord.category]?.name}
                        </span>
                      </div>
                    </div>

                    {/* Footer Tips */}
                    <div className="space-y-3">
                      <button
                        id={`pronounce-btn-${currentWord.id}`}
                        onClick={(e) => playAudio(currentWord.word, e)}
                        className={`mx-auto p-4 rounded-none transition-all border cursor-pointer ${
                          playingWord 
                            ? 'bg-stone-900 text-white border-black shadow-editorial-sm' 
                            : 'bg-white border-black text-black hover:bg-stone-100 shadow-editorial-sm'
                        }`}
                        title="تلفظ صوتی"
                      >
                        <Volume2 className={`h-6 w-6 ${playingWord ? 'animate-pulse' : ''}`} />
                      </button>
                      <p className="text-xs text-stone-400 font-bold flex items-center justify-center gap-1.5 pt-2 font-serif">
                        <RotateCw className="h-3.5 w-3.5 text-black" />
                        برای مشاهده معنی کلمه کلیک کنید
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  /* BACK OF CARD (REVEAL) */
                  <motion.div
                    key="back"
                    id="flashcard-back"
                    initial={{ opacity: 0, rotateY: 80 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    exit={{ opacity: 0, rotateY: -80 }}
                    transition={{ duration: 0.25 }}
                    className="w-full bg-black p-8 rounded-none border border-black shadow-editorial text-[#F8F8F3] flex flex-col justify-between min-h-[340px] text-right"
                  >
                    {/* Header info */}
                    <div className="flex justify-between items-center border-b border-stone-800 pb-3" dir="ltr">
                      <span className="text-[10px] font-mono tracking-widest uppercase text-white font-sans bg-stone-900 px-3 py-1 rounded-none border border-stone-850">
                        {currentWord.word}
                      </span>
                      <span className="text-xs text-stone-400 font-bold font-serif">معنی و مثال</span>
                    </div>

                    {/* Center Meaning & Example */}
                    <div className="space-y-5 my-auto">
                      <div className="space-y-1">
                        <span className="text-[10px] text-stone-500 font-bold block uppercase tracking-wide">ترجمه به فارسی</span>
                        <h2 className="text-2xl font-serif font-black text-white leading-snug">
                          {currentWord.meaning}
                        </h2>
                      </div>

                      <div className="bg-stone-950 p-4 rounded-none border border-stone-850 space-y-2">
                        <div className="space-y-1 text-left" dir="ltr">
                          <span className="text-[9px] font-mono tracking-widest font-bold text-stone-500 block uppercase">SAMPLE SENTENCE</span>
                          <p className="text-xs font-semibold text-stone-300 leading-relaxed font-sans">
                            {currentWord.example}
                          </p>
                        </div>
                        <div className="space-y-1 text-right border-t border-dashed border-stone-900 pt-2">
                          <span className="text-[9px] font-serif font-bold text-white block">ترجمه مثال</span>
                          <p className="text-xs text-stone-400 leading-relaxed font-sans">
                            {currentWord.exampleTranslation}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Tips for back */}
                    <div className="pt-2">
                      <p className="text-xs text-stone-500 font-bold flex items-center justify-center gap-1.5 text-center font-serif">
                        <RefreshCcw className="h-3 w-3 text-stone-400" />
                        کلیک کنید تا به روی کارت برگردید
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick action buttons for self-assessment */}
            <div className="space-y-3">
              <div className="text-center">
                <span className="text-xs text-stone-500 font-bold font-serif">وضعیت تسلط خود بر این لغت را ثبت کنید:</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="needs-review-btn"
                  onClick={() => handleDecision('learning')}
                  className="bg-white hover:bg-stone-50 text-black py-3 rounded-none text-xs font-bold transition-all border border-black flex items-center justify-center gap-2 shadow-editorial-sm cursor-pointer"
                >
                  <RefreshCcw className="h-4 w-4 text-black" />
                  بلد نبودم (نیاز به مرور)
                </button>
                <button
                  id="mastered-learn-btn"
                  onClick={() => handleDecision('mastered')}
                  className="bg-black hover:bg-stone-900 text-white py-3 rounded-none text-xs font-bold transition-all border border-black flex items-center justify-center gap-2 shadow-editorial-sm cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  بلدم (ملکه ذهن شده است)
                </button>
              </div>
            </div>

            {/* Navigation keys */}
            <div className="flex justify-between items-center pt-2">
              <button
                id="prev-flashcard-btn"
                onClick={() => syncIndex(currentIndex - 1)}
                className="px-4 py-2.5 bg-white hover:bg-stone-100 border border-black rounded-none text-black hover:shadow-editorial shadow-editorial-sm transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <ChevronRight className="h-4 w-4 text-black" />
                قبلی
              </button>

              <button
                id="next-flashcard-btn"
                onClick={() => syncIndex(currentIndex + 1)}
                className="px-4 py-2.5 bg-white hover:bg-stone-100 border border-black rounded-none text-black hover:shadow-editorial shadow-editorial-sm transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                بعدی
                <ChevronLeft className="h-4 w-4 text-black" />
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
