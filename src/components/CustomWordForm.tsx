/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Word } from '../types';
import { Plus, Trash2, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomWordFormProps {
  customWords: Word[];
  onAddCustomWord: (word: Omit<Word, 'id' | 'isCustom'>) => void;
  onDeleteCustomWord: (wordId: string) => void;
}

export default function CustomWordForm({
  customWords,
  onAddCustomWord,
  onDeleteCustomWord,
}: CustomWordFormProps) {
  const [word, setWord] = useState('');
  const [pos, setPos] = useState<'noun' | 'verb' | 'adjective' | 'adverb' | 'other'>('noun');
  const [phonetic, setPhonetic] = useState('');
  const [meaning, setMeaning] = useState('');
  const [example, setExample] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!word.trim() || !meaning.trim()) {
      setErrorMsg('وارد کردن نام کلمه به انگلیسی و معنی فارسی الزامی است.');
      return;
    }

    onAddCustomWord({
      word: word.trim(),
      pos,
      category: 'custom',
      phonetic: phonetic.trim() ? `/${phonetic.trim().replace(/^\/|\/$/g, '')}/` : '/.../',
      meaning: meaning.trim(),
      example: example.trim() || 'No custom sentence added.',
      exampleTranslation: exampleTranslation.trim() || 'مثالی ثبت نشده است.',
    });

    // Reset fields
    setWord('');
    setPos('noun');
    setPhonetic('');
    setMeaning('');
    setExample('');
    setExampleTranslation('');
    setShowForm(false);
  };

  return (
    <div className="space-y-6" id="custom-word-section">
      <div className="bg-[#FCFCFA] p-5 rounded-none border border-black shadow-editorial-sm flex flex-col md:flex-row gap-4 justify-between items-center text-right">
        <div>
          <h2 className="text-lg font-serif font-black text-black">لغت‌نامه خصوصی واژگان من</h2>
          <p className="text-xs text-stone-500 mt-1 font-bold">لغت‌های نوظهوری که خارج از کتب درسی فرا می‌گیرید را در دفتر خود ثبت و مرور کنید</p>
        </div>
        <button
          id="toggle-add-word-form-btn"
          onClick={() => setShowForm(!showForm)}
          className={`px-5 py-2.5 rounded-none text-xs font-serif font-black transition-all flex items-center gap-2 border cursor-pointer border-black shadow-editorial-sm ${
            showForm
              ? 'bg-stone-100 hover:bg-stone-200 text-stone-800'
              : 'bg-black hover:bg-stone-900 text-white'
          }`}
        >
          {showForm ? 'بستن فرم ثبت' : 'افزودن واژه جدید'}
          <Plus className={`h-4 w-4 transition-transform duration-300 ${showForm ? 'rotate-45' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            id="add-word-form-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-[#FCFCFA] p-6 rounded-none border border-black shadow-editorial space-y-4 text-right">
              <h3 className="text-sm font-serif font-black text-black flex items-center gap-1.5 justify-end mb-2">
                مشخصات ساختاری و معنایی واژه جدید را درج کنید:
                <Sparkles className="h-4 w-4 text-amber-500" />
              </h3>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-350 text-rose-800 text-xs font-bold rounded-none flex items-center gap-2 justify-end" id="form-error-msg">
                  <span>{errorMsg}</span>
                  <AlertCircle className="h-4 w-4" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Word fields */}
                <div className="space-y-1.5 align-right">
                  <label className="text-xs font-serif font-bold text-stone-700 block">کلمه به زبان انگلیسی (الزامی):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="e.g. Phenomenon"
                    className="w-full px-4 py-2.5 bg-white border border-black rounded-none text-black focus:outline-none font-sans text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-serif font-bold text-stone-700 block">معنی روان و سلیس فارسی (الزامی):</label>
                  <input
                    type="text"
                    value={meaning}
                    onChange={(e) => setMeaning(e.target.value)}
                    placeholder="مثال: پدیده، امر خارق‌العاده"
                    className="w-full px-4 py-2.5 bg-white border border-black rounded-none text-black focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pos and phonetic */}
                <div className="space-y-1.5">
                  <label className="text-xs font-serif font-bold text-stone-700 block">نقش دستوری کلمه در جمله (POS):</label>
                  <select
                    id="custom-word-pos"
                    value={pos}
                    onChange={(e) => setPos(e.target.value as any)}
                    className="w-full bg-white border border-black text-xs font-bold rounded-none p-2.5 focus:outline-none cursor-pointer text-black"
                  >
                    <option value="noun">Noun (اسم)</option>
                    <option value="verb">Verb (فعل)</option>
                    <option value="adjective">Adjective (صفت)</option>
                    <option value="adverb">Adverb (قید)</option>
                    <option value="other">سایر نقش‌ها</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-serif font-bold text-stone-700 block">تلفظ صوتی با الفبای فونتیک IPA (اختیاری):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={phonetic}
                    onChange={(e) => setPhonetic(e.target.value)}
                    placeholder="e.g. fəˈnɒmɪnən"
                    className="w-full px-4 py-2.5 bg-white border border-black rounded-none text-black focus:outline-none font-sans text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Example fields */}
                <div className="space-y-1.5">
                  <label className="text-xs font-serif font-bold text-stone-700 block">یک جمله مثال اصیل انگلیسی (اختیاری):</label>
                  <textarea
                    dir="ltr"
                    rows={2}
                    value={example}
                    onChange={(e) => setExample(e.target.value)}
                    placeholder="e.g. Lightning is a natural phenomenon."
                    className="w-full px-4 py-2 bg-white border border-black rounded-none text-black focus:outline-none font-sans text-xs resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-serif font-bold text-stone-700 block">ترجمه شیرین فارسی برای مثال بالا (اختیاری):</label>
                  <textarea
                    rows={2}
                    value={exampleTranslation}
                    onChange={(e) => setExampleTranslation(e.target.value)}
                    placeholder="مثال: رعد و برق یک پدیده طبیعی است."
                    className="w-full px-4 py-2 bg-white border border-black rounded-none text-black focus:outline-none text-xs resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-black/10 pt-3">
                <button
                  id="submit-custom-word-btn"
                  type="submit"
                  className="w-full bg-black hover:bg-stone-900 border border-black text-white font-serif font-bold text-xs py-3 rounded-none transition-all shadow-editorial-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  افزودن و امضای کلمه در صندوق خصوصی
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        {customWords.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-none border border-black shadow-editorial space-y-4">
            <span className="inline-block p-4 rounded-none bg-stone-100 border border-black text-stone-600">
              <BookOpen className="h-10 w-10" />
            </span>
            <h3 className="text-lg font-serif font-black text-black">دفترچه لغات شخصی خالی است</h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto">
              تک‌واژه‌هایی که هنگام تماشای فیلم یا مطالعه متون جذاب پیدا می‌کنید را ثبت کنید تا در قالب فلش‌کارت و آزمون بر روی آن‌ها تسلط یابید.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {customWords.map((item) => (
                <motion.div
                  id={`customword-${item.id}`}
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#FCFCFA] p-5 rounded-none border border-black relative flex flex-col justify-between hover:shadow-editorial-sm transition-all text-right space-y-4 shadow-editorial"
                >
                  <div>
                    {/* Header with tag and delete action */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-mono tracking-widest uppercase px-3 py-1 bg-stone-100 border border-stone-300 font-bold rounded-none text-stone-800">
                        {item.pos === 'noun' && 'اسم | Noun'}
                        {item.pos === 'verb' && 'فعل | Verb'}
                        {item.pos === 'adjective' && 'صفت | Adj'}
                        {item.pos === 'adverb' && 'قید | Adv'}
                        {item.pos === 'other' && 'سایر'}
                      </span>
                      
                      <button
                        id={`delete-customword-btn-${item.id}`}
                        onClick={() => onDeleteCustomWord(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-none transition-all cursor-pointer"
                        title="حذف از بایگانی"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {/* Word display */}
                    <div className="bg-white border border-black/10 py-3.5 px-4 rounded-none mb-3" dir="ltr text-left">
                      <h3 className="text-xl font-serif font-black text-black">{item.word}</h3>
                      <p className="text-xs text-stone-400 font-mono italic">{item.phonetic}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-stone-400 font-bold block">معنی و معادل فارسی</span>
                      <p className="text-base font-serif font-black text-black">{item.meaning}</p>
                    </div>

                    {(item.example && item.example !== 'No custom sentence added.') && (
                      <div className="mt-3 bg-white/50 p-3 rounded-none border border-black/10 text-xs text-stone-600 space-y-1.5">
                        <div dir="ltr" className="text-left font-sans font-medium">{item.example}</div>
                        <div className="border-t border-dashed border-stone-200 pt-1.5 mt-1.5 text-stone-500 font-medium">{item.exampleTranslation}</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
