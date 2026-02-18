
import { AnalysisResponse, Medicine, Patient } from '@/types';
import { useEffect, useState, ReactNode } from 'react';
import AnalysisChat from './AnalysisChat';

interface AnalysisResultProps {
  result: AnalysisResponse | null;
  loading: boolean;
  onReplaceWithAlternative?: (originalDrugName: string, alternativeDrug: Medicine) => void;
  patient: Patient | null;
  selectedMedicines: Medicine[];
}

interface AccordionItemProps {
  title: string;
  icon: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({ title, icon, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <h4 className="text-xl font-bold text-white">{title}</h4>
        </div>
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out border-t border-white/5 ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
      >
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AnalysisResult({ result, loading, onReplaceWithAlternative, patient, selectedMedicines }: AnalysisResultProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (result && !loading) {
      setShowContent(false);
      setTimeout(() => setShowContent(true), 100);
    }
  }, [result, loading]);

  // Loading state
  if (loading) {
    return (
      <div className="mt-6 space-y-4 animate-fade-in">
        <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl shadow-xl border border-white/10 p-8 backdrop-blur-sm">
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin-reverse"></div>
              </div>
            </div>
          </div>
          <p className="text-center text-lg font-medium text-white/80 animate-pulse">
            🔬 AI ile ilaç etkileşimleri analiz ediliyor...
          </p>

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
      `}</style>

      {/* Main Container */}
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl border border-white/10 p-8 backdrop-blur-md">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            📊 Analiz Sonuçları
          </h3>
          {result.results_found && (
            <div className="flex flex-col md:flex-row items-end md:items-center gap-3">
              {result.last_updated && (
                <span className="text-white/50 text-xs md:text-sm">
                  Son Güncelleme: <span className="text-blue-300 font-mono">{result.last_updated}</span>
                </span>
              )}
              <span className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-sm font-medium flex items-center gap-2 transition-transform hover:scale-105 cursor-help" title="Analiz sonuçları güncel FDA veritabanından alınmıştır">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                FDA Verisi Bulundu
              </span>
            </div>
          )}
        </div>



        <div className="space-y-4">
          {/* Clinical Summary */}
          {result.clinical_summary && (
            <AccordionItem title="Klinik Özet" icon="📑" defaultOpen={true}>
              <p className="text-white/90 text-lg leading-relaxed whitespace-pre-line">
                {result.clinical_summary}
              </p>
            </AccordionItem>
          )}

          {/* Interaction Details - Sadece High/Medium severity göster */}
          {result.interaction_details && result.interaction_details.length > 0 && (() => {
            // LOW severity olanları filtrele
            const significantInteractions = result.interaction_details.filter(
              interaction => interaction.severity === 'High' || interaction.severity === 'Medium'
            );

            // Önemli etkileşim varsa göster
            return significantInteractions.length > 0 ? (
              <AccordionItem title="Tespit Edilen Etkileşimler" icon="⚠️" defaultOpen>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {significantInteractions.map((interaction, index) => (
                    <div
                      key={index}
                      className={`bg-gradient-to-br ${interaction.severity === 'High'
                        ? 'from-red-500/20 to-red-500/5 border-red-500/30'
                        : 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30'
                        } backdrop-blur-sm rounded-xl p-4 border hover:scale-[1.02] transition-all duration-300 flex flex-col h-full`}
                    >
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex flex-wrap gap-1">
                          {interaction.drugs.map((drug, i) => (
                            <span key={i} className="px-2 py-0.5 bg-white/10 text-white font-semibold rounded text-xs truncate max-w-[100px]" title={drug}>
                              {drug}
                            </span>
                          ))}
                        </div>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${interaction.severity === 'High'
                          ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                          : 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50'
                          }`}>
                          {interaction.severity === 'High' ? 'Yüksek' : 'Orta'}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm line-clamp-4 hover:line-clamp-none transition-all cursor-default" title={interaction.mechanism}>
                        {interaction.mechanism}
                      </p>
                    </div>
                  ))}
                </div>
              </AccordionItem>
            ) : null; // Sadece LOW varsa hiç gösterme
          })()}

          {/* Alternative Medications */}
          {result.alternatives && result.alternatives.length > 0 && (
            <AccordionItem title="Alternatif İlaç Önerileri" icon="💡">
              <div className="space-y-4">
                {result.alternatives.map((alt, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm rounded-xl p-6 border border-purple-500/30 hover:scale-[1.01] transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg font-bold text-white">{alt.original_drug}</span>
                          <span className="text-white/60">→</span>
                          <span className="text-lg font-bold text-purple-300">{alt.suggested_alternative}</span>
                        </div>
                        <p className="text-white/80 mb-3">{alt.reason}</p>

                        {onReplaceWithAlternative && (
                          <button
                            onClick={() => {
                              const alternativeMedicine: Medicine = {
                                id: `alt-${Date.now()}`,
                                name: alt.suggested_alternative,
                                dosage: 'Doktor önerisine göre',
                                frequency: 'Günde 1x'
                              };
                              onReplaceWithAlternative(alt.original_drug, alternativeMedicine);
                            }}
                            className="mt-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              {alt.suggested_alternative} İlacını Ekle
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionItem>
          )}

          {/* Monitoring Plan */}
          {result.monitoring_plan && result.monitoring_plan.length > 0 && (
            <AccordionItem title="İzlem Önerileri" icon="🔬">
              <div className="bg-cyan-500/10 backdrop-blur-sm rounded-xl overflow-hidden border border-cyan-500/20">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-cyan-500/20 border-b border-cyan-500/30">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-bold text-cyan-300">Test</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-cyan-300">Sıklık</th>
                        <th className="text-left px-6 py-4 text-sm font-bold text-cyan-300">Neden</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.monitoring_plan.map((mon, index) => (
                        <tr key={index} className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors">
                          <td className="px-6 py-4 text-white font-semibold">{mon.test}</td>
                          <td className="px-6 py-4 text-cyan-300">{mon.frequency}</td>
                          <td className="px-6 py-4 text-white/70 text-sm">{mon.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </AccordionItem>
          )}

          {/* Dosage Warnings */}
          {result.dosage_warnings && result.dosage_warnings.length > 0 && (
            <AccordionItem title="Doz Ayarlamaları" icon="⚖️">
              <div className="space-y-4">
                {result.dosage_warnings.map((warning: any, index: number) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 backdrop-blur-sm rounded-xl p-6 border border-amber-500/30"
                  >
                    {/* Handle both string and object formats for backward compatibility */}
                    {typeof warning === 'string' ? (
                      <p className="text-white/80">{warning}</p>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-lg font-bold text-white">{warning.drug}</span>
                        </div>
                        <div className="mb-3">
                          <span className="text-white/60 text-sm">Önerilen Doz: </span>
                          <span className="text-amber-400 font-bold">{warning.adjustment}</span>
                        </div>
                        <p className="text-white/70 text-sm">{warning.reason}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </AccordionItem>
          )}

          {/* Special Population Alerts */}
          {result.special_population_alerts && (result.special_population_alerts.pregnancy_category || result.special_population_alerts.warning_text) && (
            <AccordionItem title="Özel Popülasyon Uyarıları" icon="🤰">
              <div className="bg-gradient-to-br from-pink-500/20 to-pink-500/5 backdrop-blur-sm rounded-xl p-6 border border-pink-500/30">
                {result.special_population_alerts.pregnancy_category && (
                  <div className="mb-3">
                    <span className="text-white/60">Gebelik Kategorisi: </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ml-2 ${result.special_population_alerts.pregnancy_category === 'X' || result.special_population_alerts.pregnancy_category === 'D'
                      ? 'bg-red-500 text-white'
                      : result.special_population_alerts.pregnancy_category === 'C'
                        ? 'bg-yellow-500/50 text-yellow-100'
                        : 'bg-green-500/50 text-green-100'
                      }`}>
                      FDA Kategori {result.special_population_alerts.pregnancy_category}
                    </span>
                  </div>
                )}
                {result.special_population_alerts.warning_text && (
                  <p className="text-white/80">{result.special_population_alerts.warning_text}</p>
                )}
                {/* Fallback for array format if needed */}
                {Array.isArray(result.special_population_alerts) && result.special_population_alerts.map((alert: string, i: number) => (
                  <p key={i} className="text-white/80 mt-2">• {alert}</p>
                ))}
              </div>
            </AccordionItem>
          )}

          {/* Patient Safety Notes */}
          {result.patient_safety_notes && (
            <AccordionItem title="Hasta Güvenlik Bilgileri" icon="📋">
              <div className="space-y-4">
                {/* Handle object format */}
                {typeof result.patient_safety_notes === 'object' && result.patient_safety_notes !== null ? (
                  <>
                    {result.patient_safety_notes.normal_side_effects && (
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 text-3xl">ℹ️</div>
                          <div>
                            <h5 className="text-white font-bold mb-2">Normal Yan Etkiler</h5>
                            <p className="text-white/80">
                              {result.patient_safety_notes.normal_side_effects}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.patient_safety_notes.red_flags && (
                      <div className="bg-gradient-to-br from-red-500/20 to-red-500/5 backdrop-blur-sm rounded-xl p-6 border border-red-500/40">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 text-3xl">🚨</div>
                          <div>
                            <h5 className="text-red-300 font-bold mb-2">Dikkat! Doktora Danışın</h5>
                            <p className="text-red-200">
                              {result.patient_safety_notes.red_flags}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Handle string format
                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
                    <p className="text-white/80">{String(result.patient_safety_notes)}</p>
                  </div>
                )}
              </div>
            </AccordionItem>
          )}
        </div>
      </div>

      {/* Analysis Chat Integration */}
      <AccordionItem title="Analiz Asistanı" icon="💬">
        <AnalysisChat
          analysisResult={result}
          patient={patient}
          medicines={selectedMedicines}
        />
      </AccordionItem>
    </div>
  );
}

