/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Word } from '../types';
import { 
  Volume2, 
  CheckCircle, 
  XCircle, 
  RotateCw, 
  HelpCircle, 
  Award, 
  Sparkles, 
  Settings, 
  BookOpen, 
  RefreshCcw,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizProps {
  words: Word[];
  categories: Record<string, { name: string; description: string; icon: string; color: string }>;
}

type QuizType = 'enToFa' | 'faToEn' | 'spelling';

interface Question {
  id: string;
  word: Word;
  options: string[]; // Options (only for multiple choice)
  correctOption: string; // Correct answer
}

export default function Quiz({ words, categories }: QuizProps) {
  // Quiz states
  const [isPlaying, setIsPlaying] = useState(false);
  const [quizType, setQuizType] = useState<QuizType>('enToFa');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quizLength, setQuizLength] = useState<number>(10);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [spellingInput, setSpellingInput] = useState('');
  const [spellingHintUsed, setSpellingHintUsed] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [incorrectList, setIncorrectList] = useState<Word[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Play audio
  const playNativeAudio = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;

      utterance.onstart = () => setPlayingAudioId(id);
      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Build the entire quiz session
  const startQuiz = () => {
    // Filter source words
    const sourceWords = words.filter(
      (w) => selectedCategory === 'all' || w.category === selectedCategory
    );

    if (sourceWords.length < 4) {
      alert('تعداد کلمه‌ها در این دسته‌بندی برای برگزاری آزمون کافی نیست. لطفاً دسته دیگری انتخاب کنید.');
      return;
    }

    // Shuffle and pick words
    const shuffledList = [...sourceWords].sort(() => 0.5 - Math.random());
    const selectedLength = Math.min(quizLength, shuffledList.length);
    const selectedWords = shuffledList.slice(0, selectedLength);

    // Create questions
    const generatedQuestions: Question[] = selectedWords.map((item) => {
      let options: string[] = [];
      let correctOption = '';

      if (quizType === 'enToFa') {
        correctOption = item.meaning;
        // Collect 3 random incorrect Persian options
        const incorrects = words
          .filter((w) => w.id !== item.id)
          .map((w) => w.meaning)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        
        options = [correctOption, ...incorrects].sort(() => 0.5 - Math.random());
      } else if (quizType === 'faToEn') {
        correctOption = item.word;
        // Collect 3 random incorrect English options
        const incorrects = words
          .filter((w) => w.id !== item.id)
          .map((w) => w.word)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        
        options = [correctOption, ...incorrects].sort(() => 0.5 - Math.random());
      } else {
        // Spelling mode doesn't need multiple-choice options
        correctOption = item.word.toLowerCase().trim();
      }

      return {
        id: item.id,
        word: item,
        options,
        correctOption,
      };
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setSpellingInput('');
    setSpellingHintUsed(false);
    setIsAnswered(false);
    setScore(0);
    setIncorrectList([]);
    setShowSummary(false);
    setIsPlaying(true);
  };

  // Hint generator for spelling mode
  const currentHint = useMemo(() => {
    if (!questions[currentIndex]) return '';
    const word = questions[currentIndex].word.word;
    const firstChar = word.charAt(0);
    const lastChar = word.charAt(word.length - 1);
    const midUnderscores = '_ '.repeat(word.length - 2).trim();
    return `${firstChar} ${midUnderscores} ${lastChar}`;
  }, [questions, currentIndex]);

  // Handle choice selection for multiple-choice quiz
  const handleSelectAnswer = (ans: string) => {
    if (isAnswered) return;
    setSelectedAnswer(ans);
    setIsAnswered(true);

    const correctAns = questions[currentIndex].correctOption;
    if (ans === correctAns) {
      setScore((prev) => prev + 1);
    } else {
      setIncorrectList((prev) => [...prev, questions[currentIndex].word]);
    }
  };

  // Submit spelling answer
  const handleSubmitSpelling = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !spellingInput.trim()) return;
    setIsAnswered(true);

    const actual = spellingInput.toLowerCase().trim();
    const correct = questions[currentIndex].correctOption.toLowerCase().trim();

    if (actual === correct) {
      setScore((prev) => prev + 1);
    } else {
      setIncorrectList((prev) => [...prev, questions[currentIndex].word]);
    }
  };

  // Progress to next question or show summary
  const handleNextQuestion = () => {
    setIsAnswered(false);
    setSelectedAnswer(null);
    setSpellingInput('');
    setSpellingHintUsed(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  // Text message based on percentage
  const feedbackMessage = useMemo(() => {
    const pct = (score / questions.length) * 100;
    if (pct === 100) return { title: 'فوق‌العاده و بی‌نقص! ⭐', msg: 'شما تمام لغات را به درستی املانویسی و ترجمه کردید. شاهکار کردید!' };
    if (pct >= 80) return { title: 'عالی بود! 👏', msg: 'سطح تسلط شما بر لغات خیره‌کننده است. همین فرمان را ادامه دهید.' };
    if (pct >= 50) return { title: 'خوب و رضایت‌بخش 👍', msg: 'نتیجه خوبی به دست آوردید، اما هنوز جا برای بهتر شدن دارید.' };
    return { title: 'نیاز به مرور مداوم 📚', msg: 'با مرور هر روزه فلش‌کارت‌ها و دسته‌بندی‌ها به زودی املای تمام لغات را یاد خواهید گرفت.' };
  }, [score, questions]);

  return (
    <div className="max-w-2xl mx-auto" id="quiz-root-section">
      <AnimatePresence mode="wait">
        {!isPlaying ? (
          /* CONFIGURATION SCREEN */
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-[#FCFCFA] p-8 rounded-none border border-black shadow-editorial-lg space-y-6 text-right"
          >
            <div className="flex items-center gap-3.5 border-b border-stone-200 pb-4">
              <span className="p-3 bg-stone-100 border border-black text-black">
                <Settings className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-serif font-black text-black">آزمون سنجش سطح تسلط واژگان</h2>
                <p className="text-xs text-stone-500 mt-1 font-bold">میزان ماندگاری واژگان در ذهن کاوشگر خود را بسنجید</p>
              </div>
            </div>

            {/* Step 1: Mode Select */}
            <div className="space-y-3">
              <label className="text-xs font-serif font-bold text-black block">۱. انتخاب شیوه برگزاری آزمون:</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  id="quiztype-en-to-fa"
                  onClick={() => setQuizType('enToFa')}
                  className={`p-4 rounded-none border text-right transition-all flex flex-col justify-between h-32 cursor-pointer ${
                    quizType === 'enToFa'
                      ? 'border-black bg-white shadow-editorial-sm'
                      : 'border-black/20 bg-stone-50/50 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-black font-serif font-black text-sm">چند گزینه‌ای (EN ➔ FA)</span>
                  <span className="text-[11px] text-stone-500 font-medium">لغت انگلیسی ارائه شده و ترجمه فارسی آن پرسیده می‌شود.</span>
                </button>

                <button
                  id="quiztype-fa-to-en"
                  onClick={() => setQuizType('faToEn')}
                  className={`p-4 rounded-none border text-right transition-all flex flex-col justify-between h-32 cursor-pointer ${
                    quizType === 'faToEn'
                      ? 'border-black bg-white shadow-editorial-sm'
                      : 'border-black/20 bg-stone-50/50 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-black font-serif font-black text-sm">چند گزینه‌ای (FA ➔ EN)</span>
                  <span className="text-[11px] text-stone-500 font-medium">معنی فارسی ارائه شده و گزینه صواب انگلیسی آن گزینش می‌شود.</span>
                </button>

                <button
                  id="quiztype-spelling"
                  onClick={() => setQuizType('spelling')}
                  className={`p-4 rounded-none border text-right transition-all flex flex-col justify-between h-32 cursor-pointer ${
                    quizType === 'spelling'
                      ? 'border-black bg-white shadow-editorial-sm'
                      : 'border-black/20 bg-stone-50/50 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-black font-serif font-black text-sm">املا و نوشتار (پیشرفته)</span>
                  <span className="text-[11px] text-stone-500 font-medium">معنی فارسی و تلفظ پخش شده و شما املای دقیق واژه را مکتوب می‌کنید.</span>
                </button>
              </div>
            </div>

            {/* Step 2: Category Choose */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-serif font-bold text-black block">۲. تعیین قلمروی لغات:</label>
                <select
                  id="quiz-category-config"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white border border-black rounded-none p-3 focus:outline-none cursor-pointer text-black font-serif font-bold text-sm"
                >
                  <option value="all">همه واژگان موجود برنامه</option>
                  {Object.entries(categories).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-serif font-bold text-black block">۳. تعداد واژه‌های آزمون:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 20].map((num) => (
                    <button
                      id={`quiz-len-${num}`}
                      key={num}
                      type="button"
                      onClick={() => setQuizLength(num)}
                      className={`py-3 rounded-none text-xs font-bold transition-all border cursor-pointer ${
                        quizLength === num
                          ? 'bg-black border-black text-white shadow-editorial-sm font-black'
                          : 'bg-white border-black/20 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {num} سواله
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-black/10 pt-5 mt-4">
              <button
                id="start-quiz-session-btn"
                onClick={startQuiz}
                className="w-full bg-black hover:bg-stone-900 text-white py-4 rounded-none font-serif font-bold transition-all shadow-editorial flex items-center justify-center gap-2 text-base cursor-pointer border border-black"
              >
                <Sparkles className="h-5 w-5 text-amber-400 fill-current" />
                شروع آزمون هوشمند سنجش تسلط
              </button>
            </div>
          </motion.div>
        ) : showSummary ? (
          /* SUMMARY / SCORE SCREEN */
          <motion.div
            key="summary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#FCFCFA] p-8 rounded-none border border-black shadow-editorial-lg text-center space-y-6 text-right"
          >
            <div className="space-y-3 pt-4 text-center">
              <div className="inline-block p-4 rounded-none bg-stone-100 border border-black text-black">
                <Award className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-serif font-black text-black">{feedbackMessage.title}</h2>
              <p className="text-sm text-stone-600 font-medium max-w-md mx-auto leading-relaxed">{feedbackMessage.msg}</p>
            </div>

            {/* Score Ring Display */}
            <div className="flex flex-col items-center justify-center py-2">
              <span className="text-xs text-stone-400 font-bold block mb-1">میزان درستی پاسخ‌ها:</span>
              <div className="bg-black border border-black rounded-none px-6 py-4 flex items-center gap-3 shadow-editorial-sm">
                <div className="text-right">
                  <span className="block text-3xl font-black text-white font-mono tracking-tight">
                    {score} <span className="text-sm text-stone-400">از {questions.length}</span>
                  </span>
                  <p className="text-[10px] text-stone-300 font-mono tracking-widest uppercase">CORRECT RESPONSES</p>
                </div>
              </div>
            </div>

            {/* Incorrect summaries if any */}
            {incorrectList.length > 0 && (
              <div className="bg-stone-50 p-5 rounded-none border border-black/20 space-y-3">
                <h3 className="text-xs font-serif font-bold text-stone-700 flex items-center gap-2 justify-end">
                  لغاتی که در این نوبت پاسخ نادرست دادید و نیاز به توجه مکرر دارند:
                  <span className="h-2 w-2 rounded-full bg-black" />
                </h3>
                <div className="flex flex-wrap gap-2 justify-end" dir="ltr">
                  {incorrectList.map((item, idx) => (
                    <span 
                      key={`${item.id}-${idx}`}
                      className="px-3 py-1.5 bg-white border border-black/15 text-xs text-stone-850 font-bold rounded-none flex items-center gap-1.5"
                    >
                      <button 
                        onClick={() => playNativeAudio(item.word, item.id)}
                        className="text-black hover:opacity-85"
                      >
                        <Volume2 className="h-3.5 w-3.5 text-black" />
                      </button>
                      <span className="font-sans font-black">{item.word}</span>
                      <span className="text-stone-400 text-[10px] font-serif">({item.meaning})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Restart Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-black/10 pt-5">
              <button
                id="retry-same-quiz-btn"
                onClick={startQuiz}
                className="bg-black hover:bg-stone-900 text-white font-serif font-bold text-sm py-3.5 rounded-none border border-black transition-all shadow-editorial-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCcw className="h-4 w-4 text-white" />
                مشارکت دوباره در همین آزمون
              </button>
              
              <button
                id="quit-to-config-btn"
                onClick={() => setIsPlaying(false)}
                className="bg-white hover:bg-stone-100 text-stone-800 font-serif font-bold text-sm py-3.5 rounded-none border border-black transition-all shadow-editorial-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                تغییر تنظیمات و خروج
              </button>
            </div>
          </motion.div>
        ) : (
          /* ACTIVE QUESTIONS SCREEN */
          <motion.div
            key="active"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="bg-[#FCFCFA] p-7 rounded-none border border-black shadow-editorial-lg space-y-6 text-right"
          >
            {/* Top Stat Ribbon */}
            <div className="flex justify-between items-center bg-stone-50 p-4 rounded-none border border-black/10">
              <span className="text-xs font-serif font-bold text-stone-500">پرسش {currentIndex + 1} از {questions.length}</span>
              
              {/* Question progress dot bar */}
              <div className="flex gap-1">
                {questions.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`h-2.5 w-2.5 rounded-full border border-black/20 transition-all ${
                      idx === currentIndex 
                        ? 'bg-black scale-110 border-black' 
                        : idx < currentIndex 
                          ? 'bg-stone-400' 
                          : 'bg-stone-200'
                    }`}
                  />
                ))}
              </div>

              <div className="text-xs font-serif">
                صحیح تا اینجا: <span className="font-extrabold text-black font-mono">{score}</span>
              </div>
            </div>

            {/* Question Box */}
            <div className="space-y-4">
              <span className="text-xs font-serif font-bold text-stone-500 block">سوال آزمون: کلمه منطبق بر ساختار زیر کدام است؟</span>
              
              {/* Challenge layout depending on mode */}
              <div className="p-6 rounded-none bg-white border border-black text-center space-y-3 shadow-editorial-sm">
                {quizType === 'enToFa' ? (
                  /* Shows English word */
                  <div className="space-y-2">
                    <h1 className="text-3xl font-serif font-black text-black tracking-tight">
                      {questions[currentIndex].word.word}
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-stone-500 font-mono italic">
                        {questions[currentIndex].word.phonetic}
                      </span>
                      <button 
                        onClick={() => playNativeAudio(questions[currentIndex].word.word, questions[currentIndex].id)}
                        className={`p-1.5 rounded-none border transition-all cursor-pointer ${
                          playingAudioId === questions[currentIndex].id
                            ? 'bg-black text-white'
                            : 'bg-white text-black border-black/25 hover:bg-stone-100'
                        }`}
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : quizType === 'faToEn' ? (
                  /* Shows Persian meaning */
                  <h1 className="text-2xl font-serif font-black text-[#1A1A1A] leading-snug">
                    {questions[currentIndex].word.meaning}
                  </h1>
                ) : (
                  /* Spelling test - Shows definition and translation, lets user play auditory pronounces */
                  <div className="space-y-3">
                    <span className="text-[9px] uppercase font-mono tracking-widest font-black bg-stone-100 border border-stone-200 text-stone-800 px-2.5 py-1 rounded-none">
                      SPELLING: {questions[currentIndex].word.pos}
                    </span>
                    <h1 className="text-2xl font-serif font-black text-black leading-snug">
                      {questions[currentIndex].word.meaning}
                    </h1>
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <button 
                        onClick={() => playNativeAudio(questions[currentIndex].word.word, questions[currentIndex].id)}
                        id="play-quiz-audio"
                        type="button"
                        className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border transition-all cursor-pointer rounded-none shadow-editorial-sm ${
                          playingAudioId === questions[currentIndex].id
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-black hover:bg-stone-50'
                        }`}
                      >
                        <Volume2 className="h-4 w-4" />
                        پخش صوتی واژه راهنما
                      </button>
                      <p className="text-[10px] text-stone-400 font-bold font-serif">با گوش سپردن به صدای واژه، املای صحیح را تجسم کنید</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input section based on quizType */}
            {quizType !== 'spelling' ? (
              /* MULTIPLE CHOICES LAYOUT */
              <div className="grid grid-cols-1 gap-2.5">
                {questions[currentIndex].options.map((option, idx) => {
                  const isCorrect = option === questions[currentIndex].correctOption;
                  const isUserChosen = option === selectedAnswer;
                  
                  let btnStyle = 'border-black/30 bg-white hover:border-black hover:bg-stone-50 text-stone-800 shadow-editorial-sm';
                  
                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black';
                    } else if (isUserChosen) {
                      btnStyle = 'border-rose-600 bg-rose-50 text-rose-950';
                    } else {
                      btnStyle = 'border-[#F0F0EE] bg-white opacity-40 text-stone-400 pointer-events-none';
                    }
                  }

                  return (
                    <button
                      id={`quiz-option-${idx}`}
                      key={idx}
                      onClick={() => handleSelectAnswer(option)}
                      disabled={isAnswered}
                      className={`w-full p-4 rounded-none border text-right font-serif font-black text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                    >
                      <span>{option}</span>
                      <div className="flex items-center">
                        {isAnswered && isCorrect && <CheckCircle className="h-5 w-5 text-emerald-600" />}
                        {isAnswered && isUserChosen && !isCorrect && <XCircle className="h-5 w-5 text-rose-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* WRITING / SPELLING CHALLENGE LAYOUT */
              <form onSubmit={handleSubmitSpelling} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-serif font-bold text-stone-500 block">املای انگلیسی دقیق واژه را مکتوب کنید:</label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      placeholder="Type correct spelling..."
                      value={spellingInput}
                      onChange={(e) => setSpellingInput(e.target.value)}
                      disabled={isAnswered}
                      className="w-full text-center text-lg font-bold py-3.5 px-4 bg-white border border-black rounded-none text-black focus:outline-none focus:ring-0 focus:border-black font-sans"
                      autoFocus
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                    />
                  </div>
                </div>

                {/* Hint option button */}
                {!isAnswered && (
                  <div className="flex justify-between items-center px-1">
                    <button
                      id="use-spelling-hint-btn"
                      type="button"
                      onClick={() => setSpellingHintUsed(true)}
                      className="text-xs text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-none border border-amber-200 transition-all cursor-pointer shadow-editorial-sm"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      دریافت راهنمای املا (حرف اول و آخر)
                    </button>
                    {spellingHintUsed && (
                      <span className="text-xs font-mono font-bold text-stone-700 tracking-wider bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-none" dir="ltr">
                        {currentHint}
                      </span>
                    )}
                  </div>
                )}

                {/* Submit writing button */}
                {!isAnswered && (
                  <button
                    id="submit-spelling-btn"
                    type="submit"
                    className="w-full py-3 bg-black hover:bg-stone-900 text-white font-serif font-black text-xs rounded-none border border-black shadow-editorial-sm transition-all cursor-pointer"
                  >
                    ارسال جهت راستی‌آزمایی املا
                  </button>
                )}

                {/* Show writing spelling verification result */}
                {isAnswered && (
                  <div className={`p-4 rounded-none border text-center space-y-2 ${
                    spellingInput.toLowerCase().trim() === questions[currentIndex].correctOption.toLowerCase().trim()
                      ? 'bg-emerald-50 border-emerald-350 text-emerald-950 shadow-editorial-sm'
                      : 'bg-rose-50 border-rose-350 text-rose-950 shadow-editorial-sm'
                  }`}>
                    <div className="flex items-center justify-center gap-2">
                      {spellingInput.toLowerCase().trim() === questions[currentIndex].correctOption.toLowerCase().trim() ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                          <span className="font-serif font-black text-sm">بسیار عالی! هم املای واژه و هم تلفظ ذهن شما بی‌کم‌وکاست بود.</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-rose-600" />
                          <span className="font-serif font-black text-sm">واژ‌ه‌نگاری نادرست بود. املای کلمه نیاز به ممارست بیشتر دارد.</span>
                        </>
                      )}
                    </div>
                    {spellingInput.toLowerCase().trim() !== questions[currentIndex].correctOption.toLowerCase().trim() && (
                      <p className="text-xs font-bold leading-relaxed">
                        نگارش شما: <span className="font-mono text-xs text-rose-600 underline font-extrabold">{spellingInput}</span> | ترتب صحیح املا: <span className="font-mono text-sm text-emerald-700 font-extrabold">{questions[currentIndex].correctOption}</span>
                      </p>
                    )}
                    <div className="bg-white/80 border border-black/5 p-3 rounded-none max-w-sm mx-auto text-xs text-stone-600 font-medium">
                      کابرد کلمه در مثال: {questions[currentIndex].word.example}
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* Submit & Next Button section */}
            {isAnswered && (
              <div className="pt-3" id="next-question-btn-wrapper">
                <button
                  id="quiz-next-question-btn"
                  onClick={handleNextQuestion}
                  className="w-full bg-black text-white py-3.5 rounded-none border border-black text-xs font-black shadow-editorial hover:bg-stone-900 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {currentIndex + 1 < questions.length ? 'انتقال به پرسش پیش‌رو' : 'اتمام آزمون و مشاهده کارنامه نهایی'}
                  <span className="text-[10px] font-mono tracking-widest bg-stone-950 text-[#F8F8F3] px-2 py-0.5 rounded-none leading-none">
                    PROGRESS: {currentIndex + 1}/{questions.length}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
