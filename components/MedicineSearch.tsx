'use client';

import { Medicine } from '@/types';
import { useState } from 'react';

interface MedicineSearchProps {
  availableMedicines: Medicine[];
  selectedMedicines: Medicine[];
  onAddMedicine: (medicine: Medicine) => void;
  onRemoveMedicine: (medicineId: string) => void;
}

export default function MedicineSearch({
  availableMedicines,
  selectedMedicines,
  onAddMedicine,
  onRemoveMedicine,
}: MedicineSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredMedicines = availableMedicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedMedicines.some((selected) => selected.id === medicine.id)
  );

  const handleSelectMedicine = (medicine: Medicine) => {
    onAddMedicine(medicine);
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Yeni Reçete</h3>

      <div className="space-y-4">
        <div className="relative">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            İlaç Ara ve Ekle
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder="İlaç adı yazın..."
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {showResults && searchTerm && filteredMedicines.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredMedicines.map((medicine) => (
                <button
                  key={medicine.id}
                  onClick={() => handleSelectMedicine(medicine)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <p className="font-medium text-gray-800">{medicine.name}</p>
                  <p className="text-sm text-gray-600">
                    {medicine.dosage} - {medicine.frequency}
                  </p>
                </button>
              ))}
            </div>
          )}

          {showResults && searchTerm && filteredMedicines.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-gray-500 text-sm">
              İlaç bulunamadı
            </div>
          )}
        </div>

        {selectedMedicines.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-3">
              Seçilen İlaçlar ({selectedMedicines.length})
            </label>
            <div className="space-y-3">
              {selectedMedicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-semibold text-gray-800">{medicine.name}</h4>
                    <p className="text-sm text-gray-600">
                      {medicine.dosage} - {medicine.frequency}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveMedicine(medicine.id)}
                    className="text-red-600 hover:text-red-800 font-bold text-xl px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
