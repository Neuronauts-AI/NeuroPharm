'use client';

import { AnalysisResponse } from '@/types';

interface AnalysisResultProps {
  result: AnalysisResponse | null;
  loading: boolean;
}

export default function AnalysisResult({ result, loading }: AnalysisResultProps) {
  if (loading) {
    return (
      <div className="bg-[var(--card-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-6 mt-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-[var(--text-muted)]">Analiz ediliyor...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // Risk skoru 1-10 arası
  const getRiskLevel = (score: number) => {
    if (score >= 7) return { level: 'Yüksek', color: 'red', bgColor: 'bg-red-500/20', textColor: 'text-red-400', borderColor: 'border-red-500' };
    if (score >= 4) return { level: 'Orta', color: 'yellow', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-500', borderColor: 'border-yellow-500' };
    return { level: 'Düşük', color: 'green', bgColor: 'bg-green-500/20', textColor: 'text-green-500', borderColor: 'border-green-500' };
  };

  const getRiskLevelForScore = (score: number) => {
    if (score >= 7) return 'text-red-400';
    if (score >= 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const risk = getRiskLevel(result.risk_score);

  return (
    <div className="bg-[var(--card-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-6 mt-6">
      <h3 className="text-xl font-bold text-[var(--foreground)] mb-6">Analiz Sonuçları</h3>

      <div className="space-y-6">
        {/* Risk Skoru */}
        <div className={`border-l-4 ${risk.borderColor} pl-4`}>
          <label className="text-sm font-medium text-[var(--text-muted)] block mb-2">
            Toplam Risk Skoru
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="var(--card-border)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke={risk.color === 'red' ? '#dc2626' : risk.color === 'yellow' ? '#ca8a04' : '#16a34a'}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(result.risk_score / 10) * 251.2} 251.2`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-[var(--foreground)]">{result.risk_score}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`inline-block px-4 py-2 rounded-full font-semibold ${risk.bgColor} ${risk.textColor}`}>
                {risk.level} Risk
              </span>
              {result.results_found ? (
                <span className="text-sm text-blue-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Etkileşim verisi bulundu
                </span>
              ) : (
                <span className="text-sm text-[var(--text-muted)] flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Kayıtlı etkileşim bulunamadı
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Risk Kırılımı (xAI) */}
        {result.risk_breakdown && (
          <div className="border-l-4 border-blue-500 pl-4">
            <label className="text-sm font-medium text-[var(--text-muted)] block mb-3">
              Risk Kırılımı (xAI - Açıklanabilir AI)
            </label>
            <div className="bg-blue-500/10 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground)]">İlaç-İlaç Etkileşimi</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-[var(--card-border)] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${result.risk_breakdown.drug_interaction >= 7 ? 'bg-red-500' : result.risk_breakdown.drug_interaction >= 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${result.risk_breakdown.drug_interaction * 10}%` }}
                      />
                    </div>
                    <span className={`font-bold ${getRiskLevelForScore(result.risk_breakdown.drug_interaction)}`}>
                      {result.risk_breakdown.drug_interaction}/10
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground)]">Organ Fonksiyonu</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-[var(--card-border)] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${result.risk_breakdown.organ_function >= 7 ? 'bg-red-500' : result.risk_breakdown.organ_function >= 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${result.risk_breakdown.organ_function * 10}%` }}
                      />
                    </div>
                    <span className={`font-bold ${getRiskLevelForScore(result.risk_breakdown.organ_function)}`}>
                      {result.risk_breakdown.organ_function}/10
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground)]">Hasta Faktörleri</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-[var(--card-border)] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${result.risk_breakdown.patient_factors >= 7 ? 'bg-red-500' : result.risk_breakdown.patient_factors >= 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${result.risk_breakdown.patient_factors * 10}%` }}
                      />
                    </div>
                    <span className={`font-bold ${getRiskLevelForScore(result.risk_breakdown.patient_factors)}`}>
                      {result.risk_breakdown.patient_factors}/10
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--foreground)]">Doz Riski</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-[var(--card-border)] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${result.risk_breakdown.dosage_risk >= 7 ? 'bg-red-500' : result.risk_breakdown.dosage_risk >= 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${result.risk_breakdown.dosage_risk * 10}%` }}
                      />
                    </div>
                    <span className={`font-bold ${getRiskLevelForScore(result.risk_breakdown.dosage_risk)}`}>
                      {result.risk_breakdown.dosage_risk}/10
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center md:col-span-2">
                  <span className="text-[var(--foreground)]">Tekrarlayan Tedavi</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-[var(--card-border)] rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${result.risk_breakdown.duplicative_therapy >= 7 ? 'bg-red-500' : result.risk_breakdown.duplicative_therapy >= 4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${result.risk_breakdown.duplicative_therapy * 10}%` }}
                      />
                    </div>
                    <span className={`font-bold ${getRiskLevelForScore(result.risk_breakdown.duplicative_therapy)}`}>
                      {result.risk_breakdown.duplicative_therapy}/10
                    </span>
                  </div>
                </div>
              </div>
              {result.risk_breakdown.triggered_rules && result.risk_breakdown.triggered_rules.length > 0 && (
                <div className="border-t border-[var(--card-border)] pt-3 mt-3">
                  <span className="text-sm font-medium text-[var(--text-muted)] block mb-2">Tetiklenen Kurallar:</span>
                  <div className="flex flex-wrap gap-2">
                    {result.risk_breakdown.triggered_rules.map((rule, index) => (
                      <span key={index} className="px-3 py-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-sm text-[var(--foreground)]">
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alternatif ve Önlem Önerileri */}
        {result.alternatives && result.alternatives.length > 0 && (
          <div className="border-l-4 border-purple-500 pl-4">
            <label className="text-sm font-medium text-[var(--text-muted)] block mb-3">
              Alternatif ve Önlem Önerileri
            </label>
            <div className="space-y-3">
              {result.alternatives.map((alt, index) => (
                <div key={index} className={`rounded-lg p-4 ${alt.risk_level === 'high' ? 'bg-red-500/10 border border-red-500/30' : alt.risk_level === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-[var(--foreground)]">{alt.drug_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alt.risk_level === 'high' ? 'bg-red-500/20 text-red-400' : alt.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                          {alt.risk_level === 'high' ? 'Yüksek Risk' : alt.risk_level === 'medium' ? 'Orta Risk' : 'Düşük Risk'}
                        </span>
                      </div>
                      <p className="text-[var(--foreground)] text-sm mb-2">{alt.action}</p>
                      {alt.alternative_drug && (
                        <p className="text-purple-400 text-sm">Alternatif: {alt.alternative_drug}</p>
                      )}
                      {alt.dosage_adjustment && (
                        <p className="text-blue-400 text-sm">Doz Ayarlaması: {alt.dosage_adjustment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* İzlem ve Laboratuvar Önerileri */}
        {result.monitoring && result.monitoring.length > 0 && (
          <div className="border-l-4 border-cyan-500 pl-4">
            <label className="text-sm font-medium text-[var(--text-muted)] block mb-3">
              İzlem ve Laboratuvar Önerileri
            </label>
            <div className="bg-cyan-500/10 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-cyan-500/20">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-medium text-[var(--foreground)]">Test</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-[var(--foreground)]">Sıklık</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-[var(--foreground)]">Neden</th>
                    <th className="text-left px-4 py-2 text-sm font-medium text-[var(--foreground)]">İlgili İlaçlar</th>
                  </tr>
                </thead>
                <tbody>
                  {result.monitoring.map((mon, index) => (
                    <tr key={index} className="border-t border-cyan-500/20">
                      <td className="px-4 py-3 text-[var(--foreground)] font-medium">{mon.test_name}</td>
                      <td className="px-4 py-3 text-[var(--foreground)]">{mon.frequency}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-sm">{mon.reason}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {mon.related_drugs.map((drug, i) => (
                            <span key={i} className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">{drug}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Doz Ayarlamaları */}
        {result.dosage_adjustments && result.dosage_adjustments.length > 0 && (
          <div className="border-l-4 border-amber-500 pl-4">
            <label className="text-sm font-medium text-[var(--text-muted)] block mb-3">
              Doz Ayarlamaları
            </label>
            <div className="space-y-3">
              {result.dosage_adjustments.map((adj, index) => (
                <div key={index} className={`rounded-lg p-4 ${adj.contraindicated ? 'bg-red-500/10 border border-red-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-[var(--foreground)]">{adj.drug_name}</span>
                        {adj.contraindicated && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/20 text-red-400">
                            KONTRENDİKE
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {adj.current_dose && (
                          <p className="text-[var(--text-muted)]">Mevcut Doz: <span className="text-[var(--foreground)]">{adj.current_dose}</span></p>
                        )}
                        <p className={adj.contraindicated ? 'text-red-400' : 'text-amber-400'}>
                          Önerilen: <span className="font-medium">{adj.recommended_dose}</span>
                        </p>
                      </div>
                      <p className="text-[var(--text-muted)] text-sm mt-2">{adj.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gebelik/Emzirme Uyarıları */}
        {result.pregnancy_warnings && result.pregnancy_warnings.length > 0 && (
          <div className="border-l-4 border-pink-500 pl-4">
            <label className="text-sm font-medium text-[var(--text-muted)] block mb-3">
              Gebelik / Emzirme Uyarıları
            </label>
            <div className="space-y-3">
              {result.pregnancy_warnings.map((warn, index) => (
                <div key={index} className={`rounded-lg p-4 ${warn.category === 'X' || warn.category === 'D' ? 'bg-red-500/10 border border-red-500/30' : warn.category === 'C' ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-pink-500/10 border border-pink-500/30'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-[var(--foreground)]">{warn.drug_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${warn.category === 'X' ? 'bg-red-500 text-white' : warn.category === 'D' ? 'bg-red-500/50 text-red-100' : warn.category === 'C' ? 'bg-yellow-500/50 text-yellow-100' : 'bg-green-500/50 text-green-100'}`}>
                          FDA Kategori {warn.category}
                        </span>
                        {warn.breastfeeding_safe ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/20 text-green-400">
                            Emzirme Güvenli
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-500/20 text-red-400">
                            Emzirme Uygun Değil
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--foreground)] text-sm mb-2">{warn.warning}</p>
                      {warn.alternative && (
                        <p className="text-purple-400 text-sm">Alternatif: {warn.alternative}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Genel Alternatif Öneri */}
        {result.alternative_suggestion && (
          <div className="border-l-4 border-purple-500 pl-4">
            <label className="text-sm font-medium text-[var(--text-muted)] block mb-2">
              Genel Alternatif Öneri
            </label>
            <div className={`rounded-lg p-4 ${result.has_alternative ? 'bg-purple-500/10' : 'bg-[var(--hover-bg)]'}`}>
              <div className="flex items-start gap-3">
                {result.has_alternative ? (
                  <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                <p className={`${result.has_alternative ? 'text-purple-400' : 'text-[var(--foreground)]'} whitespace-pre-line`}>
                  {result.alternative_suggestion}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Açıklama */}
        <div className="border-l-4 border-orange-500 pl-4">
          <label className="text-sm font-medium text-[var(--text-muted)] block mb-2">
            Genel Değerlendirme
          </label>
          <div className="bg-orange-500/10 rounded-lg p-4">
            <p className="text-[var(--foreground)] whitespace-pre-line">{result.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
