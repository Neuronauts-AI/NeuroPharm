'use client';

import { Patient } from '@/types';

interface PatientDetailsProps {
  patient: Patient;
}

export default function PatientDetails({ patient }: PatientDetailsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Hasta Detayları</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500 block mb-1">
              Ad Soyad
            </label>
            <p className="text-lg font-semibold text-gray-800">{patient.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 block mb-1">
              Yaş
            </label>
            <p className="text-lg font-semibold text-gray-800">{patient.age}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 block mb-1">
              Cinsiyet
            </label>
            <p className="text-lg font-semibold text-gray-800">
              {patient.gender === 'male' ? 'Erkek' : patient.gender === 'female' ? 'Kadın' : 'Diğer'}
            </p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500 block mb-2">
            Hastalıklar
          </label>
          {patient.conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.conditions.map((condition, index) => (
                <span
                  key={index}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {condition}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Kayıtlı hastalık yok</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-500 block mb-3">
            Kullandığı İlaçlar
          </label>
          {patient.currentMedications.length > 0 ? (
            <div className="space-y-3">
              {patient.currentMedications.map((medication, index) => (
                <div
                  key={index}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                >
                  <h4 className="font-semibold text-gray-800 mb-1">
                    {medication.name}
                  </h4>
                  <div className="flex gap-4 text-sm text-gray-600">
                    {medication.dosage && (
                      <span>
                        <span className="font-medium">Doz:</span> {medication.dosage}
                      </span>
                    )}
                    {medication.frequency && (
                      <span>
                        <span className="font-medium">Sıklık:</span> {medication.frequency}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Kayıtlı ilaç kullanımı yok</p>
          )}
        </div>
      </div>
    </div>
  );
}
