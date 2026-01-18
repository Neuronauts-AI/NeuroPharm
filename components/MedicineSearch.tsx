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
    <div className="bg-[var(--card-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-6 mt-6">
      <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">Yeni Reçete</h3>

      <div className="space-y-4">
        <div className="relative">
          <label className="text-sm font-medium text-[var(--text-muted)] block mb-2">
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
            className="w-full px-4 py-3 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--input-bg)] text-[var(--foreground)]"
          />

          {showResults && searchTerm && filteredMedicines.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md shadow-lg max-h-60 overflow-y-auto">
              {filteredMedicines.map((medicine) => (
                <button
                  key={medicine.id}
                  onClick={() => handleSelectMedicine(medicine)}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors border-b border-[var(--card-border)] last:border-b-0"
                >
                  <p className="font-medium text-[var(--foreground)]">{medicine.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {medicine.dosage} - {medicine.frequency}
                  </p>
                </button>
              ))}
            </div>
          )}

          {showResults && searchTerm && filteredMedicines.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md shadow-lg p-4 text-[var(--text-muted)] text-sm">
              İlaç bulunamadı
            </div>
          )}
        </div>

        {selectedMedicines.length > 0 && (
          <div>
            <label className="text-sm font-medium text-[var(--text-muted)] block mb-3">
              Seçilen İlaçlar ({selectedMedicines.length})
            </label>
            <div className="space-y-3">
              {selectedMedicines.map((medicine) => (
                <div
                  key={medicine.id}
                  className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-semibold text-[var(--foreground)]">{medicine.name}</h4>
                    <p className="text-sm text-[var(--text-muted)]">
                      {medicine.dosage} - {medicine.frequency}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemoveMedicine(medicine.id)}
                    className="text-red-500 hover:text-red-400 font-bold text-xl px-2"
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
