'use client';

import { AnalysisResponse } from '@/types';

interface AnalysisResultProps {
  result: AnalysisResponse | null;
  loading: boolean;
}

export default function AnalysisResult({ result, loading }: AnalysisResultProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Analiz ediliyor...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // Risk skoru 1-10 arası
  const getRiskLevel = (score: number) => {
    if (score >= 7) return { level: 'Yüksek', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-500' };
    if (score >= 4) return { level: 'Orta', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-500' };
    return { level: 'Düşük', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-500' };
  };

  const risk = getRiskLevel(result.risk_score);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Analiz Sonuçları</h3>

      <div className="space-y-6">
        {/* Risk Skoru */}
        <div className={`border-l-4 ${risk.borderColor} pl-4`}>
          <label className="text-sm font-medium text-gray-500 block mb-2">
            Risk Skoru
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#e5e7eb"
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
                <span className="text-2xl font-bold">{result.risk_score}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={`inline-block px-4 py-2 rounded-full font-semibold ${risk.bgColor} ${risk.textColor}`}>
                {risk.level} Risk
              </span>
              {result.results_found ? (
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Etkileşim verisi bulundu
                </span>
              ) : (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Kayıtlı etkileşim bulunamadı
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alternatif Öneri */}
        <div className="border-l-4 border-purple-500 pl-4">
          <label className="text-sm font-medium text-gray-500 block mb-2">
            Alternatif Öneri
          </label>
          <div className={`rounded-lg p-4 ${result.has_alternative ? 'bg-purple-50' : 'bg-gray-50'}`}>
            <div className="flex items-start gap-3">
              {result.has_alternative ? (
                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              <p className={`${result.has_alternative ? 'text-purple-800' : 'text-gray-700'} whitespace-pre-line`}>
                {result.alternative_suggestion}
              </p>
            </div>
          </div>
        </div>

        {/* Açıklama */}
        <div className="border-l-4 border-orange-500 pl-4">
          <label className="text-sm font-medium text-gray-500 block mb-2">
            Açıklama
          </label>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-gray-800 whitespace-pre-line">{result.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
