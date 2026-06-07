/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Percent, 
  Calendar, 
  History as HistoryIcon, 
  LayoutDashboard, 
  Calculator, 
  Download, 
  Trash2, 
  Plus, 
  Moon, 
  Sun, 
  ArrowRight, 
  Sparkles, 
  Info, 
  Search, 
  Share2, 
  Smartphone, 
  TrendingUp, 
  CheckCircle,
  FileText,
  Clock,
  RefreshCw,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CalculationResult, HistoryItem, DashboardStats } from './types';
import { calculateSimpleInterest, calculateDetailedDateDifference } from './utils/interest';
import { exportResultToPDF } from './utils/pdfExport';

export default function App() {
  // -------------------------------------------------------------
  // Theme State
  // -------------------------------------------------------------
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // -------------------------------------------------------------
  // Navigation State
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'history'>('calculator');

  // -------------------------------------------------------------
  // Calculator Form State
  // -------------------------------------------------------------
  const [principalText, setPrincipalText] = useState<string>('50000');
  const [rateText, setRateText] = useState<string>('2'); // e.g. 2 rupees per 100 per month
  
  // Date initialization: Start exactly 1 year ago, End is today
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [calcTitle, setCalcTitle] = useState<string>('');
  const [calcNotes, setCalcNotes] = useState<string>('');
  
  // Custom manual duration in months parameter (if users prefer manual overrides over start-end dates)
  const [isManualDuration, setIsManualDuration] = useState<boolean>(false);
  const [manualMonths, setManualMonths] = useState<string>('12');

  // -------------------------------------------------------------
  // Offline History State
  // -------------------------------------------------------------
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('interest_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse history', e);
        return [];
      }
    }
    // Seed with two demo records if history is completely empty so the dashboard has high visual fidelity out of the box
    return [
      {
        id: '1',
        title: 'Agricultural Hand-Loan (Demo)',
        dateCreated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        result: {
          principal: 100000,
          rate: 2,
          startDate: '2025-01-01',
          endDate: '2026-01-01',
          durationYears: 1,
          durationMonths: 0,
          durationDays: 0,
          totalMonths: 12,
          totalDays: 365,
          monthlyInterest: 2000,
          totalInterest: 24000,
          totalAmount: 124000,
          equivalentAnnualRate: 24,
        },
        notes: 'Lent to S. Kumar at ₹2 interest per month.'
      },
      {
        id: '2',
        title: 'Small Business Working Capital (Demo)',
        dateCreated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        result: {
          principal: 250000,
          rate: 1.5,
          startDate: '2025-06-15',
          endDate: '2026-03-15',
          durationYears: 0,
          durationMonths: 9,
          durationDays: 0,
          totalMonths: 9,
          totalDays: 273,
          monthlyInterest: 3750,
          totalInterest: 33750,
          totalAmount: 283750,
          equivalentAnnualRate: 18,
        },
        notes: 'Secured business setup invoice backup.'
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Effects & Persistent Updates
  // -------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('interest_history', JSON.stringify(history));
  }, [history]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Convert string rates safely
  const principal = parseFloat(principalText) || 0;
  const rate = parseFloat(rateText) || 0;

  // -------------------------------------------------------------
  // Calculate Live Result Dynamically
  // -------------------------------------------------------------
  const liveResult = useMemo<CalculationResult>(() => {
    if (isManualDuration) {
      const monthsCount = parseFloat(manualMonths) || 0;
      const monthlyRate = rate / 100;
      const monthlyInterest = principal * monthlyRate;
      const totalInterest = monthlyInterest * monthsCount;
      const totalAmount = principal + totalInterest;
      
      const yearsVal = Math.floor(monthsCount / 12);
      const remainingMonths = Math.floor(monthsCount % 12);
      const remainingDays = Math.round((monthsCount % 1) * 30);

      return {
        principal,
        rate,
        startDate: 'Manual Input',
        endDate: 'Manual Input',
        durationYears: yearsVal,
        durationMonths: remainingMonths,
        durationDays: remainingDays,
        totalMonths: monthsCount,
        totalDays: Math.round(monthsCount * 30.417),
        monthlyInterest: Number(monthlyInterest.toFixed(2)),
        totalInterest: Number(totalInterest.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        equivalentAnnualRate: rate * 12
      };
    } else {
      // Calculate based on Start Date and End Date
      return calculateSimpleInterest(principal, rate, startDate, endDate);
    }
  }, [principal, rate, startDate, endDate, isManualDuration, manualMonths]);

  // -------------------------------------------------------------
  // Dashboard Aggregated Analytics
  // -------------------------------------------------------------
  const stats = useMemo<DashboardStats>(() => {
    if (history.length === 0) {
      return { totalCalculations: 0, totalPrincipal: 0, totalInterestAccumulated: 0, averageRate: 0 };
    }
    const totalPrincipal = history.reduce((sum, item) => sum + item.result.principal, 0);
    const totalInterestAccumulated = history.reduce((sum, item) => sum + item.result.totalInterest, 0);
    const averageRate = history.reduce((sum, item) => sum + item.result.rate, 0) / history.length;

    return {
      totalCalculations: history.length,
      totalPrincipal,
      totalInterestAccumulated,
      averageRate: Number(averageRate.toFixed(2))
    };
  }, [history]);

  // -------------------------------------------------------------
  // History Handlers
  // -------------------------------------------------------------
  const handleSaveToHistory = () => {
    if (principal <= 0) {
      triggerToast('⚠️ Please enter a valid principal amount.');
      return;
    }
    if (rate <= 0) {
      triggerToast('⚠️ Please specify an interest rate.');
      return;
    }

    const newRecord: HistoryItem = {
      id: Date.now().toString(),
      title: calcTitle.trim() || `Calculation for ₹${principal.toLocaleString()}`,
      dateCreated: new Date().toISOString(),
      result: { ...liveResult },
      notes: calcNotes.trim() || undefined
    };

    setHistory([newRecord, ...history]);
    triggerToast('✅ Saved successfully to history!');
    
    // Clear meta inputs but keep values
    setCalcTitle('');
    setCalcNotes('');
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(history.filter(item => item.id !== id));
    triggerToast('🗑️ Calculation record deleted.');
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all calculation history records? This cannot be undone.')) {
      setHistory([]);
      triggerToast('🗑️ Cleared all history records.');
    }
  };

  const handleApplyHistoryItem = (item: HistoryItem) => {
    setPrincipalText(item.result.principal.toString());
    setRateText(item.result.rate.toString());
    
    if (item.result.startDate === 'Manual Input') {
      setIsManualDuration(true);
      setManualMonths(item.result.totalMonths.toString());
    } else {
      setIsManualDuration(false);
      setStartDate(item.result.startDate);
      setEndDate(item.result.endDate);
    }
    
    setCalcTitle(item.title);
    if (item.notes) setCalcNotes(item.notes);
    
    // Transition back to calculator view
    setActiveTab('calculator');
    triggerToast(`⚡ Loaded "${item.title}"`);
  };

  const handleExportPDF = (item: HistoryItem) => {
    exportResultToPDF(item.result, item.title, item.dateCreated, item.notes);
    triggerToast('📄 PDF exported and requested download!');
  };

  // Filter history based on search bar queries
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history;
    return history.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.result.principal.toString().includes(searchQuery)
    );
  }, [history, searchQuery]);

  // Quick helper for preset principal options
  const handlePrincipalPreset = (p: number) => {
    setPrincipalText(p.toString());
  };

  // Quick helper for preset rate options
  const handleRatePreset = (r: number) => {
    setRateText(r.toString());
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Toast Notification HUD */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full border text-center font-medium text-xs tracking-wide shadow-xl flex items-center gap-2 whitespace-nowrap ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-200' 
                : 'bg-white border-slate-200 text-slate-805'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE/DESKTOP HEADER CAP */}
      <header className={`sticky top-0 z-40 border-b px-6 py-4 xl:px-12 flex items-center justify-between transition-colors ${
        isDarkMode ? 'bg-slate-950/80 border-slate-900 backdrop-blur-md' : 'bg-white/95 border-slate-100 backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 shadow-md">
            <Calculator className="w-5 h-5 text-emerald-405" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white dark:text-slate-150">Simple Interest Pro</h1>
            <p className="text-[9px] font-mono text-emerald-500 font-semibold uppercase tracking-wider">
              Offline calculation dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Switcher Button */}
          <button 
            id="theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode 
                ? 'bg-slate-900/60 border-slate-850 text-amber-405 hover:bg-slate-800' 
                : 'bg-slate-50 border-slate-200 text-emerald-800 hover:bg-slate-150'
            }`}
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* PRIMARY CONTROLLER CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pb-28">

        {/* TOP MOBILE BANNER OUTLINE */}
        <div className="mb-6 block lg:hidden">
          <div className={`p-4 rounded-2xl border text-center ${
            isDarkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-white border-slate-200'
          }`}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-450 mb-2 font-mono">
              <CheckCircle className="w-3.5 h-3.5" /> OFFLINE READY DATABASE
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Calculate interest instantly. Your data is kept private in local persistence.
            </p>
          </div>
        </div>

        {/* RESPONSIVE SEGMENT TRIGGER GRID (DESKTOP RAIL + MOBILE BUTTONS) */}
        <div className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl mb-8 max-w-md mx-auto border ${
          isDarkMode ? 'bg-slate-900/40 border-slate-900' : 'bg-slate-100 border-slate-205'
        }`}>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all uppercase ${
              activeTab === 'calculator'
                ? (isDarkMode ? 'bg-slate-950 border border-slate-850 text-emerald-400 shadow-md' : 'bg-white border border-slate-200 text-slate-900 shadow-sm')
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Calculator</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all uppercase relative ${
              activeTab === 'history'
                ? (isDarkMode ? 'bg-slate-950 border border-slate-850 text-emerald-400 shadow-md' : 'bg-white border border-slate-200 text-slate-900 shadow-sm')
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Records</span>
            {history.length > 0 && (
              <span className="ml-1 text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded-full font-extrabold font-mono">
                {history.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all uppercase ${
              activeTab === 'dashboard'
                ? (isDarkMode ? 'bg-slate-950 border border-slate-850 text-emerald-400 shadow-md' : 'bg-white border border-slate-200 text-slate-900 shadow-sm')
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-transparent'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
        </div>

        {/* -------------------------------------------------------------
            TAB CONTENT: CALCULATOR MODE
           ------------------------------------------------------------- */}
        <AnimatePresence mode="wait">
          {activeTab === 'calculator' && (
            <motion.div
              key="calculator-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Form Inputs (Col Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Math Entry Details Card */}
                <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className={`flex items-center justify-between mb-6 pb-4 border-b ${
                    isDarkMode ? 'border-slate-900' : 'border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-sm font-semibold tracking-tight text-white dark:text-slate-200">Principal &amp; Interest Terms</h2>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Live Local Solver</span>
                  </div>

                  {/* Principal Amount Input */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <label id="lbl-principal" className="text-xs font-medium text-slate-400">
                        Principal Amount (₹)
                      </label>
                      <span className="text-xs font-mono font-bold text-emerald-400 text-right">
                        ₹{principal.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono font-bold text-sm">
                        ₹
                      </div>
                      <input
                        id="input-principal"
                        type="number"
                        placeholder="e.g. 50000"
                        value={principalText === '0' ? '' : principalText}
                        onChange={(e) => setPrincipalText(e.target.value)}
                        className={`w-full py-3 pl-9 pr-4 rounded-xl font-mono text-base font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                          isDarkMode ? 'bg-slate-950 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                    {/* Principal Presets Row */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[10000, 25000, 50000, 100000, 500000].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handlePrincipalPreset(preset)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium tracking-tight font-mono transition-all border ${
                            principal === preset
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/10'
                              : (isDarkMode ? 'bg-slate-900/60 border-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-650 hover:bg-slate-150')
                          }`}
                        >
                          ₹{(preset / 1000).toFixed(0)}k
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interest Rate Option */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex flex-col">
                        <label id="lbl-rate" className="font-medium text-slate-400">
                          Interest Rate (Monthly)
                        </label>
                        <span className="text-[10px] text-slate-500">
                          ₹ per ₹100 count per month
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">
                          Equiv. Annual Rate:
                        </span>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          {(rate * 12).toFixed(1)}% / Annum
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        id="input-rate"
                        type="number"
                        step="0.05"
                        placeholder="e.g. 2"
                        value={rateText === '0' ? '' : rateText}
                        onChange={(e) => setRateText(e.target.value)}
                        className={`w-full py-3 pl-4 pr-18 rounded-xl font-mono text-base font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                          isDarkMode ? 'bg-slate-950 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500 text-xs font-semibold text-right">
                        % / month
                      </div>
                    </div>
                    {/* Rate Presets Row */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[1, 1.5, 2, 2.5, 3].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handleRatePreset(preset)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium font-mono tracking-tight transition-all border ${
                            rate === preset
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/10'
                              : (isDarkMode ? 'bg-slate-900/60 border-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-650 hover:bg-slate-150')
                          }`}
                        >
                          ₹{preset}
                        </button>
                      ))}
                    </div>
                    {/* Help/Notice banner */}
                    <div className={`p-3.5 rounded-xl text-[11px] leading-relaxed flex items-start gap-2.5 border ${
                      isDarkMode 
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-400' 
                        : 'bg-emerald-50/50 border-emerald-100 text-slate-700'
                    }`}>
                      <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>What is ₹{rate} rate?</strong> This translates to <strong>₹{rate}</strong> simple interest on each ₹100 bundle, equivalent to a flat <strong>{rate}%</strong> monthly rate on your principal.
                      </div>
                    </div>
                  </div>

                </div>

                {/* Duration Picker Block */}
                <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className={`flex items-center justify-between mb-4 pb-3 border-b ${
                    isDarkMode ? 'border-slate-900' : 'border-slate-100'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <h2 className="text-sm font-semibold tracking-tight text-white dark:text-slate-200">Interest Duration</h2>
                    </div>
                    <div className="flex items-center overflow-hidden rounded-xl bg-slate-205 dark:bg-slate-950 p-0.5 border border-slate-200/25 dark:border-slate-900">
                      <button
                        onClick={() => setIsManualDuration(false)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight transition-all border ${
                          !isManualDuration 
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md' 
                            : 'text-slate-400 hover:text-slate-200 border-transparent'
                        }`}
                      >
                        Calendar Dates
                      </button>
                      <button
                        onClick={() => setIsManualDuration(true)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight transition-all border ${
                          isManualDuration 
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-md' 
                            : 'text-slate-400 hover:text-slate-200 border-transparent'
                        }`}
                      >
                        Months Count
                      </button>
                    </div>
                  </div>

                  {!isManualDuration ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Start Date */}
                      <div className="space-y-2">
                        <label id="lbl-start-date" className="text-xs font-medium text-slate-400">
                          Starting Date (Loan Taken)
                        </label>
                        <div className="relative">
                          <input
                            id="input-start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={`w-full p-2.5 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                              isDarkMode ? 'bg-slate-950 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>

                      {/* End Date */}
                      <div className="space-y-2">
                        <label id="lbl-end-date" className="text-xs font-medium text-slate-400 flex items-center justify-between">
                          <span>Ending Date (Settlement)</span>
                          <button 
                            onClick={() => setEndDate(new Date().toISOString().split('T')[0])}
                            className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                          >
                            <Clock className="w-3 h-3" /> Use Today
                          </button>
                        </label>
                        <div className="relative">
                          <input
                            id="input-end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={`w-full p-2.5 rounded-xl font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                              isDarkMode ? 'bg-slate-950 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label id="lbl-manual-months" className="text-xs font-medium text-slate-405">
                          Manual Duration (Months)
                        </label>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {manualMonths} Months ({parseFloat(manualMonths) ? (parseFloat(manualMonths) * 30).toFixed(0) : 0} days)
                        </span>
                      </div>
                      <input
                        id="input-manual-months"
                        type="number"
                        step="0.5"
                        placeholder="e.g. 18"
                        value={manualMonths}
                        onChange={(e) => setManualMonths(e.target.value)}
                        className={`w-full p-3 rounded-xl font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                          isDarkMode ? 'bg-slate-950 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  )}

                  {/* Calculated Duration Period Output Overlay */}
                  {!isManualDuration && (
                    <div className="mt-5 p-4 rounded-xl bg-slate-950/40 border border-slate-900">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block">Calculated Period Duration:</span>
                      <div className="flex flex-col sm:flex-row items-baseline gap-2 mt-1">
                        <span className="text-sm font-bold font-mono text-emerald-400">
                          {liveResult.durationYears}y {liveResult.durationMonths}m {liveResult.durationDays}d
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          (Total {liveResult.totalMonths.toFixed(2)} Months / {liveResult.totalDays} Days)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Optional metadata (To Save Record Context in History Offline) */}
                <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${
                    isDarkMode ? 'border-slate-900' : 'border-slate-100'
                  }`}>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h2 className="text-sm font-semibold tracking-tight text-white dark:text-slate-200">Save Record Context (Optional)</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label id="lbl-title" className="text-xs text-slate-400">
                        Party Name / Invoice Title
                      </label>
                      <input
                        id="input-title"
                        type="text"
                        placeholder="e.g. Ramesh Kumar (Self Loan)"
                        value={calcTitle}
                        onChange={(e) => setCalcTitle(e.target.value)}
                        className={`w-full p-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                          isDarkMode ? 'bg-slate-950 border-slate-900 text-white' : 'bg-slate-50 border-slate-205 text-slate-900'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label id="lbl-notes" className="text-xs text-slate-400">
                        Remarks / Hand-loan terms summary
                      </label>
                      <textarea
                        id="input-notes"
                        placeholder="e.g. Promissory note witness S. Rajendra included."
                        rows={2}
                        value={calcNotes}
                        onChange={(e) => setCalcNotes(e.target.value)}
                        className={`w-full p-2.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none ${
                          isDarkMode ? 'bg-slate-950 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Calculations Breakdown Box & Instant Outputs (Col Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Visual Report Card Output */}
                <div className={`p-6 sm:p-8 rounded-2xl border transition-all sticky top-28 ${
                  isDarkMode 
                    ? 'bg-slate-900/40 border-slate-900 shadow-2xl relative overflow-hidden' 
                    : 'bg-white border-slate-100 shadow-sm relative overflow-hidden'
                }`}>
                  
                  {/* Visual Background Accent Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-400">
                      Calculated Statement
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">Traditional Customary Rate</span>
                  </div>

                  {/* Primary Output Display HUD */}
                  <div className="space-y-6">
                    <div>
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Total Interest Accrued</span>
                      <div className="text-4xl font-extrabold font-mono text-emerald-400 tracking-tight mt-1">
                        ₹{liveResult.totalInterest.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 py-4 border-y ${
                      isDarkMode ? 'border-slate-850' : 'border-slate-100'
                    }`}>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-mono">Interest / Month</span>
                        <span className="text-base font-bold font-mono text-slate-300 dark:text-slate-100">
                          ₹{liveResult.monthlyInterest.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-mono font-medium">Exact Duration</span>
                        <span className="text-base font-bold font-mono text-slate-305 dark:text-slate-100">
                          {liveResult.totalMonths.toFixed(2)} Mo
                        </span>
                      </div>
                    </div>

                    {/* Grand Total Payback/Settlement Amount */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-semibold text-slate-405 uppercase tracking-tight">Total Settlement Amount</span>
                        <span className="text-[10px] text-slate-500 font-mono">(P + I)</span>
                      </div>
                      <div className="text-2xl font-black font-mono text-emerald-400">
                        ₹{liveResult.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Custom Simple SVG Ratio Visualization Circle bar */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-450 mb-2">
                        <span>Ratio: Principal vs Interest</span>
                        <span className="text-emerald-400 font-bold">
                          {principal > 0 ? ((liveResult.totalInterest / principal) * 100).toFixed(0) : 0}% Accrued
                        </span>
                      </div>
                      <div className={`h-2.5 w-full rounded-full overflow-hidden flex ${
                        isDarkMode ? 'bg-slate-950' : 'bg-slate-100'
                      }`}>
                        <div 
                          className="bg-slate-700 h-full transition-all duration-300" 
                          style={{ width: `${principal > 0 ? (principal / liveResult.totalAmount) * 100 : 100}%` }}
                          title={`Principal: ${((principal / liveResult.totalAmount) * 100 || 0).toFixed(0)}%`}
                        />
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-300" 
                          style={{ width: `${principal > 0 ? (liveResult.totalInterest / liveResult.totalAmount) * 100 : 0}%` }}
                          title={`Interest: ${((liveResult.totalInterest / liveResult.totalAmount) * 100 || 0).toFixed(0)}%`}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-2 uppercase tracking-wide">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-700 inline-block"></span> Principal ({principal > 0 ? ((principal / liveResult.totalAmount) * 100).toFixed(0) : 100}%)</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Interest ({principal > 0 ? ((liveResult.totalInterest / liveResult.totalAmount) * 100).toFixed(0) : 0}%)</span>
                      </div>
                    </div>

                    {/* Instant Actions Row */}
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      {/* Save locally to history */}
                      <button
                        onClick={handleSaveToHistory}
                        className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/10 hover:bg-emerald-400 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 shrink-0 stroke-[3]" /> Save Record
                      </button>

                      {/* Export active result immediately to PDF */}
                      <button
                        onClick={() => exportResultToPDF(liveResult, calcTitle || 'Live Calculation', new Date().toISOString(), calcNotes)}
                        className={`flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                          isDarkMode 
                            ? 'bg-slate-900 hover:bg-slate-805 border-slate-800 text-slate-200' 
                            : 'bg-slate-100 hover:bg-slate-150 border-slate-200 text-slate-900'
                        }`}
                      >
                        <Download className="w-4 h-4 shrink-0 text-emerald-400" /> Export PDF
                      </button>
                    </div>

                  </div>

                </div>

                {/* Computational Formula Breakdown Card */}
                <div className={`p-5 rounded-2xl border transition-all text-xs ${
                  isDarkMode ? 'bg-slate-900/20 border-slate-900 text-slate-450' : 'bg-slate-50 border-slate-100 text-slate-500'
                }`}>
                  <h3 className="font-semibold text-slate-300 dark:text-slate-300 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider font-mono text-[10px]">
                    <Info className="w-3.5 h-3.5 text-emerald-400 inline" /> Solver formula model:
                  </h3>
                  <ul className="space-y-1.5 font-mono text-[11px] leading-relaxed">
                    <li className="flex justify-between border-b pb-1.5 border-slate-900/40"><span>Monthly Rate Factor (R):</span> <span className="text-slate-205">{rate / 100} ({rate}%)</span></li>
                    <li className="flex justify-between border-b pb-1.5 border-slate-900/40"><span>Exact Duration Time:</span> <span className="text-slate-205">{liveResult.totalMonths.toFixed(2)} months</span></li>
                    <li className="flex justify-between border-b pb-1.5 border-slate-900/40"><span>Monthly Accumulation:</span> <span className="text-slate-205">₹{(principal * (rate / 100)).toLocaleString()}</span></li>
                    <li className="flex justify-between border-b pb-1.5 border-slate-900/40"><span>Interest Accrued:</span> <span className="text-emerald-400 font-bold">₹{liveResult.totalInterest.toLocaleString()}</span></li>
                    <li className="flex justify-between pt-1"><span>Total Owed Balance:</span> <span className="text-emerald-400 font-bold">₹{liveResult.totalAmount.toLocaleString()}</span></li>
                  </ul>
                </div>

              </div>
            </motion.div>
          )}

          {/* -------------------------------------------------------------
              TAB CONTENT: HISTORIC ENTRIES MODE
             ------------------------------------------------------------- */}
          {activeTab === 'history' && (
            <motion.div
              key="history-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              
              {/* Search & Bulk Control Header */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
                isDarkMode ? 'bg-slate-900/40 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
              }`}>
                
                {/* Search Inputs */}
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search history by party name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full py-2 pl-9 pr-4 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                      isDarkMode ? 'bg-slate-950 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  {history.length > 0 && (
                    <button
                      onClick={handleClearAllHistory}
                      className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-tight text-rose-550 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear All Accounts
                    </button>
                  )}
                </div>

              </div>

              {/* Grid List of Cards */}
              {filteredHistory.length === 0 ? (
                <div className={`p-12 text-center rounded-2xl border border-dashed ${
                  isDarkMode ? 'border-slate-900' : 'border-slate-200'
                }`}>
                  <HistoryIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">No Calculation Records Found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {searchQuery 
                      ? "None of your stored cash logs match the queried criteria. Try typing a different search key term." 
                      : "Type in principal amounts, dates, and click 'Save Record' on the calculation pane to store persistent entries."}
                  </p>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer"
                    >
                      Reset Filter Criteria
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHistory.map((item) => (
                    <motion.div
                      key={item.id}
                      layoutId={`item-${item.id}`}
                      onClick={() => handleApplyHistoryItem(item)}
                      className={`p-5 rounded-2xl border cursor-pointer hover:shadow-xl transition-all relative overflow-hidden group ${
                        isDarkMode 
                          ? 'bg-slate-900/40 border-slate-900 hover:border-emerald-500/20 shadow-2xl text-slate-200' 
                          : 'bg-white border-slate-100 hover:border-emerald-500/30'
                      }`}
                    >
                      
                      {/* Top Action Tags */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="overflow-hidden">
                          <h4 className="text-sm font-bold text-slate-300 dark:text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {new Date(item.dateCreated).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {/* Instant buttons layout */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            title="Export to PDF"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportPDF(item);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-500 hover:text-emerald-400 dark:hover:text-emerald-455 transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete transaction"
                            onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-450 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Primary financial numbers in table style */}
                      <div className="space-y-2 pt-2 border-t border-slate-900">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-550 font-medium font-sans">Principal:</span>
                          <span className="font-mono font-bold text-slate-300">
                            ₹{item.result.principal.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-550 font-medium font-sans">Rate:</span>
                          <span className="font-mono text-slate-400">
                            ₹{item.result.rate} per 100/mo ({item.result.rate}%)
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-550 font-medium font-sans">Period duration:</span>
                          <span className="font-mono text-slate-400">
                            {item.result.startDate === 'Manual Input' 
                              ? `${item.result.totalMonths.toFixed(1)} mo (Manual)`
                              : `${item.result.durationYears}y ${item.result.durationMonths}m ${item.result.durationDays}d`}
                          </span>
                        </div>

                        {/* Accumulated total results */}
                        <div className="h-px bg-slate-900 my-2" />

                        <div className="flex justify-between items-baseline pt-1">
                          <div>
                            <span className="text-[9px] text-slate-500 block uppercase font-mono">Interest Accrued</span>
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              +₹{item.result.totalInterest.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 block uppercase font-mono">Settlement</span>
                            <span className="font-mono text-sm font-black text-emerald-400">
                              ₹{item.result.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Notes snippet if exists */}
                      {item.notes && (
                        <div className="mt-3 p-2 rounded-lg bg-slate-950/60 text-[10px] text-slate-450 line-clamp-2 italic font-mono border-l-2 border-emerald-500/40">
                          &ldquo;{item.notes}&rdquo;
                        </div>
                      )}

                      {/* Interactive hover overlay helper text */}
                      <div className="text-[9px] text-right mt-3 font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Click card to load values &rarr;</span>
                      </div>

                    </motion.div>
                  ))}
                </div>
              )}

            </motion.div>
          )}

          {/* -------------------------------------------------------------
              TAB CONTENT: DASHBOARD KPI ANALYTICS
             ------------------------------------------------------------- */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              
              {/* Dashboard KPIs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total calculations KPI */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-tight">Saved Calculations</span>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-404">
                      <HistoryIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-black font-mono">
                    {stats.totalCalculations} Record{stats.totalCalculations !== 1 ? 's' : ''}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Available off-grid databases</p>
                </div>

                {/* Cumulative Principal KPI */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-tight">Active Principal Cap</span>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    ₹{stats.totalPrincipal.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Sum of register lent capital</p>
                </div>

                {/* Combined Accumulated Interest KPI */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-tight">Total Interest Accrued</span>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-450 text-emerald-400">
                    ₹{stats.totalInterestAccumulated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Historic simple interest income yard</p>
                </div>

                {/* Average Monthly Interest Rate */}
                <div className={`p-5 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-mono text-slate-400 font-bold tracking-tight">Average Rate Index</span>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Percent className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl font-black font-mono">
                    {stats.averageRate}% <span className="text-xs font-normal text-slate-500 font-sans">/ month</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Average ₹ monthly rate (per ₹100)</p>
                </div>

              </div>

              {/* Graphical Visualizations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* SVG Comparative Chart Widget */}
                <div className={`p-6 rounded-2xl border transition-all ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-tight text-slate-300">
                      Transaction Volume Comparison
                    </h3>
                    <span className="text-[10px] font-mono text-slate-500">Principal vs Interest</span>
                  </div>

                  {history.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-slate-500 text-xs italic">
                      Save calculations to render history bar chart dynamics
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.slice(0, 5).map((item, idx) => {
                        const total = item.result.totalAmount;
                        const pPercent = total > 0 ? (item.result.principal / total) * 100 : 100;
                        const iPercent = total > 0 ? (item.result.totalInterest / total) * 100 : 0;
                        
                        return (
                          <div key={item.id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="truncate max-w-[200px] text-slate-300 font-semibold">
                                {idx + 1}. {item.title}
                              </span>
                              <span className="text-slate-450 font-bold">
                                ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                            <div className="h-4 w-full bg-slate-900 rounded-lg overflow-hidden flex">
                              <div 
                                className="bg-slate-705 bg-slate-700 h-full cursor-help" 
                                style={{ width: `${pPercent}%` }}
                                title={`Principal: ₹${item.result.principal.toLocaleString()} (${pPercent.toFixed(0)}%)`}
                              />
                              <div 
                                className="bg-emerald-500 h-full cursor-help" 
                                style={{ width: `${iPercent}%` }}
                                title={`Interest: ₹${item.result.totalInterest.toLocaleString()} (${iPercent.toFixed(0)}%)`}
                              />
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-2 border-t border-slate-900">
                        <span>Showing top 5 saved records</span>
                        <div className="flex gap-2">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-slate-700 block" /> Principal</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 block" /> Interest</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* App Help and General Indian Regional Finance Guidelines */}
                <div className={`p-6 rounded-2xl border transition-all space-y-4 ${
                  isDarkMode ? 'bg-slate-900/40 border-slate-900 shadow-2xl' : 'bg-white border-slate-100 shadow-sm'
                }`}>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-slate-300">
                    Traditional Interest Standard Rules
                  </h3>
                  
                  <div className="space-y-3 text-xs text-slate-450 leading-relaxed font-sans">
                    <p>
                      In customary non-banking finance markets across East and South Asia (particularly in India), interest rates are expressively stated on a monthly format as of <strong>"₹X Rupees per ₹100 bundle per Month."</strong>
                    </p>
                    <p>
                      A monthly rate of <strong>₹2 per ₹100 per Month</strong> corresponds to <strong>2%</strong> on active capital per month, resulting in an annualized nominal commercial percentage rate of <strong>24% per Annum</strong>.
                    </p>
                    
                    <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-900 font-mono text-[11px] text-emerald-400 space-y-1">
                      <div>₹1.00 interest rate / mo = 12% Annualized</div>
                      <div>₹1.50 interest rate / mo = 18% Annualized</div>
                      <div>₹2.00 interest rate / mo = 24% Annualized</div>
                      <div>₹3.00 interest rate / mo = 36% Annualized</div>
                    </div>

                    <p>
                      Calculations compute exact fractions of a month transparently by translating day components symmetrically such that <strong>1 day = 1/30 of a Month</strong>, preventing standard financial disputes.
                    </p>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* MOBILE PERSISTENT BOTTOM NAVIGATION BAR BAR */}
      <nav className={`fixed bottom-0 inset-x-0 z-40 border-t flex items-center justify-around py-2.5 transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-lg' : 'bg-white/95 border-slate-200 backdrop-blur-lg'
      }`}>
        <button
          onClick={() => { setActiveTab('calculator') }}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'calculator' 
              ? 'text-cyan-600 dark:text-cyan-400 scale-105' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Calculator</span>
        </button>

        <button
          onClick={() => { setActiveTab('history') }}
          className={`flex flex-col items-center gap-1 transition-all relative ${
            activeTab === 'history' 
              ? 'text-cyan-600 dark:text-cyan-400 scale-105' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <HistoryIcon className="w-5 h-5" />
          {history.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white font-mono font-black text-[9px] px-1 rounded-full">{history.length}</span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-tight">History</span>
        </button>

        <button
          onClick={() => { setActiveTab('dashboard') }}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'dashboard' 
              ? 'text-cyan-600 dark:text-cyan-400 scale-105' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Dashboard</span>
        </button>
      </nav>

    </div>
  );
}
