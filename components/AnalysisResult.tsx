'use client';

import { AnalysisResponse, Medicine } from '@/types';
import { useEffect, useState } from 'react';

interface AnalysisResultProps {
  result: AnalysisResponse | null;
  loading: boolean;
  onReplaceWithAlternative?: (originalDrugName: string, alternativeDrug: Medicine) => void;
}

export default function AnalysisResult({ result, loading, onReplaceWithAlternative }: AnalysisResultProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // Animate score counter
  useEffect(() => {
    if (result && !loading) {
      setShowContent(false);
      setAnimatedScore(0);
      
      // Start animations after mount
      setTimeout(() => setShowContent(true), 100);
      
      // Animate score from 0 to final value
      const duration = 1000;
      const steps = 30;
      const increment = result.risk_score / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= result.risk_score) {
          setAnimatedScore(result.risk_score);
          clearInterval(interval);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }
  }, [result, loading]);

  // Loading state with skeleton animation
  if (loading) {
    return (
      <div className="mt-6 space-y-4 animate-fade-in">
        {/* Skeleton loader */}
        <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl shadow-xl border border-white/10 p-8 backdrop-blur-sm">
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              {/* Animated spinner */}
              <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin-reverse"></div>
              </div>
            </div>
          </div>
          <p className="text-center text-lg font-medium text-white/80 animate-pulse">
            🔬 AI ile ilaç etkileşimleri analiz ediliyor...
          </p>
          
          {/* Skeleton cards */}
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" 
                   style={{ animationDelay: `${i * 0.15}s` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const getRiskLevel = (score: number) => {
    if (score >= 7) return { 
      level: 'Yüksek', 
      color: '#ef4444',
      gradient: 'from-red-500/20 via-red-500/10 to-transparent',
      glow: 'shadow-red-500/20',
      textColor: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500'
    };
    if (score >= 4) return { 
      level: 'Orta', 
      color: '#f59e0b',
      gradient: 'from-yellow-500/20 via-yellow-500/10 to-transparent',
      glow: 'shadow-yellow-500/20',
      textColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500'
    };
    return { 
      level: 'Düşük', 
      color: '#10b981',
      gradient: 'from-green-500/20 via-green-500/10 to-transparent',
      glow: 'shadow-green-500/20',
      textColor: 'text-green-500',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500'
    };
  };

  const getBarColor = (score: number) => {
    if (score >= 7) return 'from-red-500 to-red-600';
    if (score >= 4) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const risk = getRiskLevel(result.risk_score);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (animatedScore / 10) * circumference;

  return (
    <div className={`mt-6 space-y-6 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <style jsx>{`
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-reverse {
          animation: spin-reverse 1.5s linear infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>

      {/* Main Container */}
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl border border-white/10 p-8 backdrop-blur-md">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            📊 Analiz Sonuçları
          </h3>
          {result.results_found && (
            <span className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-sm font-medium flex items-center gap-2 animate-scale-in">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              FDA Verisi Bulundu
            </span>
          )}
        </div>

        {/* Risk Score - Circular Progress */}
        <div className={`relative bg-gradient-to-br ${risk.gradient} rounded-2xl p-8 mb-8 border border-white/10 ${risk.glow} shadow-xl animate-scale-in`}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* Animated Circular Progress */}
            <div className="relative">
              <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Animated progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={risk.color}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 8px ${risk.color})`,
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold text-white" style={{ textShadow: `0 0 20px ${risk.color}` }}>
                  {animatedScore}
                </span>
                <span className="text-white/60 text-sm">/10</span>
              </div>
            </div>

            {/* Risk Info */}
            <div className="text-center md:text-left">
              <div className="mb-4">
                <span className={`inline-block px-6 py-3 rounded-full font-bold text-lg ${risk.bgColor} ${risk.textColor} border ${risk.borderColor} shadow-lg`}>
                  {risk.level} Risk
                </span>
              </div>
              <p className="text-white/80 text-lg max-w-md">
                {result.description}
              </p>
            </div>
          </div>
        </div>

        {/* Risk Breakdown */}
        {result.risk_breakdown && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🔍</span>
              Risk Kırılımı (xAI)
            </h4>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="space-y-4">
                {[
                  { label: '💊 İlaç-İlaç Etkileşimi', value: result.risk_breakdown.drug_interaction },
                  { label: '🫀 Organ Fonksiyonu', value: result.risk_breakdown.organ_function },
                  { label: '👤 Hasta Faktörleri', value: result.risk_breakdown.patient_factors },
                  { label: '⚖️ Doz Riski', value: result.risk_breakdown.dosage_risk },
                  { label: '🔄 Tekrarlayan Tedavi', value: result.risk_breakdown.duplicative_therapy },
                ].map((item, index) => (
                  <div key={index} className="group" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/90 font-medium">{item.label}</span>
                      <span className={`font-bold ${item.value >= 7 ? 'text-red-400' : item.value >= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {item.value}/10
                      </span>
                    </div>
                    <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getBarColor(item.value)} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                        style={{
                          width: `${item.value * 10}%`,
                          animationDelay: `${0.3 + index * 0.1}s`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {result.risk_breakdown.triggered_rules && result.risk_breakdown.triggered_rules.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <span className="text-white/60 text-sm font-medium block mb-3">Tetiklenen Kurallar:</span>
                  <div className="flex flex-wrap gap-2">
                    {result.risk_breakdown.triggered_rules.map((rule, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 text-sm font-medium animate-scale-in"
                        style={{ animationDelay: `${0.6 + index * 0.05}s`, opacity: 0 }}
                      >
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alternative Medications - NEW INTERACTIVE FEATURE */}
        {result.alternatives && result.alternatives.length > 0 && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Alternatif İlaç Önerileri
            </h4>
            <div className="grid gap-4">
              {result.alternatives.map((alt, index) => (
                <div
                  key={index}
                  className={`group relative bg-gradient-to-br ${
                    alt.risk_level === 'high' 
                      ? 'from-red-500/10 to-red-500/5' 
                      : alt.risk_level === 'medium' 
                      ? 'from-yellow-500/10 to-yellow-500/5' 
                      : 'from-green-500/10 to-green-500/5'
                  } backdrop-blur-sm rounded-xl p-6 border ${
                    alt.risk_level === 'high' 
                      ? 'border-red-500/30' 
                      : alt.risk_level === 'medium' 
                      ? 'border-yellow-500/30' 
                      : 'border-green-500/30'
                  } hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl ${
                    alt.risk_level === 'high' ? 'hover:shadow-red-500/20' : alt.risk_level === 'medium' ? 'hover:shadow-yellow-500/20' : 'hover:shadow-green-500/20'
                  } animate-slide-up`}
                  style={{ animationDelay: `${0.4 + index * 0.1}s`, opacity: 0 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-lg font-bold text-white">{alt.drug_name}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          alt.risk_level === 'high' 
                            ? 'bg-red-500/30 text-red-300 border border-red-500/50' 
                            : alt.risk_level === 'medium' 
                            ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' 
                            : 'bg-green-500/30 text-green-300 border border-green-500/50'
                        }`}>
                          {alt.risk_level === 'high' ? '⚠️ Yüksek Risk' : alt.risk_level === 'medium' ? '⚡ Orta Risk' : '✅ Düşük Risk'}
                        </span>
                      </div>
                      <p className="text-white/80 mb-3">{alt.action}</p>
                      
                      {/* Alternative Drug Card */}
                      {alt.alternative_drug && (
                        <div className="mt-4 bg-white/5 border border-purple-500/30 rounded-lg p-4 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-300 text-sm font-medium mb-1">💊 Önerilen Alternatif:</p>
                              <p className="text-white font-bold text-lg">{alt.alternative_drug}</p>
                              {alt.dosage_adjustment && (
                                <p className="text-blue-300 text-sm mt-2">📏 {alt.dosage_adjustment}</p>
                              )}
                            </div>
                            
                            {/* EKLE Button - Interactive! */}
                            {onReplaceWithAlternative && (
                              <button
                                onClick={() => {
                                  const alternativeMedicine: Medicine = {
                                    id: `alt-${Date.now()}`,
                                    name: alt.alternative_drug!,
                                    dosage: alt.dosage_adjustment || 'Doktor önerisine göre',
                                    frequency: 'Günde 1x'
                                  };
                                  onReplaceWithAlternative(alt.drug_name, alternativeMedicine);
                                }}
                                className="group/btn relative px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                              >
                                <span className="flex items-center gap-2">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Ekle
                                </span>
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monitoring Recommendations */}
        {result.monitoring && result.monitoring.length > 0 && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.4s', opacity: 0 }}>
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🔬</span>
              İzlem Önerileri
            </h4>
            <div className="bg-cyan-500/10 backdrop-blur-sm rounded-xl overflow-hidden border border-cyan-500/20">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-cyan-500/20 border-b border-cyan-500/30">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-bold text-cyan-300">Test</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-cyan-300">Sıklık</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-cyan-300">Neden</th>
                      <th className="text-left px-6 py-4 text-sm font-bold text-cyan-300">İlgili İlaçlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.monitoring.map((mon, index) => (
                      <tr key={index} className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors">
                        <td className="px-6 py-4 text-white font-semibold">{mon.test_name}</td>
                        <td className="px-6 py-4 text-cyan-300">{mon.frequency}</td>
                        <td className="px-6 py-4 text-white/70 text-sm">{mon.reason}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {mon.related_drugs.map((drug, i) => (
                              <span key={i} className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-md text-xs font-medium">
                                {drug}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Dosage Adjustments */}
        {result.dosage_adjustments && result.dosage_adjustments.length > 0 && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.5s', opacity: 0 }}>
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">⚖️</span>
              Doz Ayarlamaları
            </h4>
            <div className="space-y-4">
              {result.dosage_adjustments.map((adj, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${
                    adj.contraindicated ? 'from-red-500/20 to-red-500/5' : 'from-amber-500/20 to-amber-500/5'
                  } backdrop-blur-sm rounded-xl p-6 border ${
                    adj.contraindicated ? 'border-red-500/30' : 'border-amber-500/30'
                  } hover:scale-[1.01] transition-all duration-300`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-lg font-bold text-white">{adj.drug_name}</span>
                    {adj.contraindicated && (
                      <span className="px-3 py-1 bg-red-500/30 text-red-300 border border-red-500/50 rounded-full text-xs font-bold">
                        ⛔ KONTRENDİKE
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {adj.current_dose && (
                      <div className="text-sm">
                        <span className="text-white/60">Mevcut Doz:</span>
                        <span className="ml-2 text-white font-medium">{adj.current_dose}</span>
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="text-white/60">Önerilen:</span>
                      <span className={`ml-2 font-bold ${adj.contraindicated ? 'text-red-400' : 'text-amber-400'}`}>
                        {adj.recommended_dose}
                      </span>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm">{adj.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pregnancy Warnings */}
        {result.pregnancy_warnings && result.pregnancy_warnings.length > 0 && (
          <div className="animate-slide-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🤰</span>
              Gebelik / Emzirme Uyarıları
            </h4>
            <div className="space-y-4">
              {result.pregnancy_warnings.map((warn, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${
                    warn.category === 'X' || warn.category === 'D' 
                      ? 'from-red-500/20 to-red-500/5' 
                      : warn.category === 'C' 
                      ? 'from-yellow-500/20 to-yellow-500/5' 
                      : 'from-pink-500/20 to-pink-500/5'
                  } backdrop-blur-sm rounded-xl p-6 border ${
                    warn.category === 'X' || warn.category === 'D' 
                      ? 'border-red-500/30' 
                      : warn.category === 'C' 
                      ? 'border-yellow-500/30' 
                      : 'border-pink-500/30'
                  } hover:scale-[1.01] transition-all duration-300`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-white">{warn.drug_name}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      warn.category === 'X' 
                        ? 'bg-red-500 text-white' 
                        : warn.category === 'D' 
                        ? 'bg-red-500/50 text-red-100' 
                        : warn.category === 'C' 
                        ? 'bg-yellow-500/50 text-yellow-100' 
                        : 'bg-green-500/50 text-green-100'
                    }`}>
                      FDA Kategori {warn.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      warn.breastfeeding_safe 
                        ? 'bg-green-500/30 text-green-300 border border-green-500/50' 
                        : 'bg-red-500/30 text-red-300 border border-red-500/50'
                    }`}>
                      {warn.breastfeeding_safe ? '✅ Emzirme Güvenli' : '⚠️ Emzirme Uygun Değil'}
                    </span>
                  </div>
                  <p className="text-white/80 mb-2">{warn.warning}</p>
                  {warn.alternative && (
                    <p className="text-purple-300 text-sm">💊 Alternatif: {warn.alternative}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
