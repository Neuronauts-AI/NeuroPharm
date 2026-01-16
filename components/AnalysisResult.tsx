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

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { level: 'Yüksek', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' };
    if (score >= 40) return { level: 'Orta', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    return { level: 'Düşük', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' };
  };

  const risk = getRiskLevel(result.riskScore);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Analiz Sonuçları</h3>

      <div className="space-y-6">
        <div className="border-l-4 border-blue-500 pl-4">
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
                  strokeDasharray={`${(result.riskScore / 100) * 251.2} 251.2`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{result.riskScore}</span>
              </div>
            </div>
            <div>
              <span className={`inline-block px-4 py-2 rounded-full font-semibold ${risk.bgColor} ${risk.textColor}`}>
                {risk.level} Risk
              </span>
            </div>
          </div>
        </div>

        {result.alternativeMedicines && result.alternativeMedicines.trim() !== '' && (
          <div className="border-l-4 border-purple-500 pl-4">
            <label className="text-sm font-medium text-gray-500 block mb-2">
              Alternatif İlaç Önerileri
            </label>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-gray-800 whitespace-pre-line">{result.alternativeMedicines}</p>
            </div>
          </div>
        )}

        <div className="border-l-4 border-orange-500 pl-4">
          <label className="text-sm font-medium text-gray-500 block mb-2">
            Açıklama
          </label>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-gray-800 whitespace-pre-line">{result.explanation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
