'use client';

import { Medicine } from '@/types';
import { useState } from 'react';

interface MedicineSearchProps {
  availableMedicines: Medicine[];
  selectedMedicines: Medicine[];
  onAddMedicine: (medicine: Medicine) => void;
  onRemoveMedicine: (medicineId: string) => void;
}

const EMPTY_MANUAL_FORM = { name: '', dosage: '', frequency: '', notes: '' };

export default function MedicineSearch({
  availableMedicines,
  selectedMedicines,
  onAddMedicine,
  onRemoveMedicine,
}: MedicineSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState(EMPTY_MANUAL_FORM);
  const [manualError, setManualError] = useState('');

  const isAlreadySelected = (name: string) =>
    selectedMedicines.some(
      (selected) => selected.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

  const filteredMedicines = availableMedicines.filter(
    (medicine) =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedMedicines.some((selected) => selected.id === medicine.id) &&
      !isAlreadySelected(medicine.name)
  );

  const handleSelectMedicine = (medicine: Medicine) => {
    onAddMedicine(medicine);
    setSearchTerm('');
    setShowResults(false);
  };

  const openManualForm = (prefillName = '') => {
    setManualForm({ ...EMPTY_MANUAL_FORM, name: prefillName });
    setManualError('');
    setShowManualForm(true);
    setShowResults(false);
  };

  const closeManualForm = () => {
    setShowManualForm(false);
    setManualForm(EMPTY_MANUAL_FORM);
    setManualError('');
  };

  const handleAddManualMedicine = () => {
    const name = manualForm.name.trim();

    if (!name) {
      setManualError('İlaç adı zorunludur.');
      return;
    }

    if (isAlreadySelected(name)) {
      setManualError('Bu ilaç zaten listede.');
      return;
    }

    const manualMedicine: Medicine = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      dosage: manualForm.dosage.trim() || undefined,
      frequency: manualForm.frequency.trim() || undefined,
      notes: manualForm.notes.trim() || undefined,
      isManual: true,
    };

    onAddMedicine(manualMedicine);
    setSearchTerm('');
    closeManualForm();
  };

  const inputClass =
    'w-full px-4 py-3 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--input-bg)] text-[var(--foreground)]';

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
            className={inputClass}
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
              <button
                onClick={() => openManualForm(searchTerm)}
                className="w-full text-left px-4 py-3 border-t border-[var(--card-border)] hover:bg-[var(--hover-bg)] transition-colors text-sm font-medium text-blue-600 dark:text-blue-400"
              >
                + Aradığınız ilaç yok mu? &quot;{searchTerm}&quot; ilacını elle ekleyin
              </button>
            </div>
          )}

          {showResults && searchTerm && filteredMedicines.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md shadow-lg p-4">
              <p className="text-[var(--text-muted)] text-sm mb-3">
                &quot;{searchTerm}&quot; sistemde bulunamadı.
              </p>
              <button
                onClick={() => openManualForm(searchTerm)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                + &quot;{searchTerm}&quot; ilacını elle ekle
              </button>
            </div>
          )}
        </div>

        {/* Manuel ilaç girişi — sistemde kayıtlı olmayan ilaçlar için */}
        {!showManualForm ? (
          <button
            type="button"
            onClick={() => openManualForm(searchTerm.trim())}
            className="w-full border border-dashed border-[var(--card-border)] text-[var(--text-muted)] px-4 py-3 rounded-md hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium"
          >
            + Manuel İlaç Ekle (sistemde olmayan ilaç)
          </button>
        ) : (
          <div className="border border-blue-500/40 bg-blue-500/5 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-[var(--foreground)]">Manuel İlaç Girişi</h4>
              <button
                type="button"
                onClick={closeManualForm}
                className="text-[var(--text-muted)] hover:text-red-500 text-xl leading-none px-1"
                aria-label="Manuel girişi kapat"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)]">
              Sistemde kayıtlı olmayan ilaçları (yerel marka, majistral, yurt dışı ilaçlar) buradan
              yazabilirsiniz. Etkileşim analizi bu ilaçları da kapsar.
            </p>

            <input
              type="text"
              value={manualForm.name}
              onChange={(e) => {
                setManualForm({ ...manualForm, name: e.target.value });
                setManualError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddManualMedicine();
                }
              }}
              placeholder="İlaç adı / etken madde (zorunlu)"
              autoFocus
              className={inputClass}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={manualForm.dosage}
                onChange={(e) => setManualForm({ ...manualForm, dosage: e.target.value })}
                placeholder="Doz (örn: 500mg)"
                className={inputClass}
              />
              <input
                type="text"
                value={manualForm.frequency}
                onChange={(e) => setManualForm({ ...manualForm, frequency: e.target.value })}
                placeholder="Sıklık (örn: Günde 2 kez)"
                className={inputClass}
              />
            </div>

            <textarea
              value={manualForm.notes}
              onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
              placeholder="Doktor notu (opsiyonel) — kullanım amacı, süre, özel durum..."
              rows={2}
              className={`${inputClass} resize-y`}
            />

            {manualError && <p className="text-sm text-red-500">{manualError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddManualMedicine}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
              >
                Reçeteye Ekle
              </button>
              <button
                type="button"
                onClick={closeManualForm}
                className="px-4 py-2 rounded-md border border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                Vazgeç
              </button>
            </div>
          </div>
        )}

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
                    <h4 className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                      {medicine.name}
                      {medicine.isManual && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                          Manuel
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-[var(--text-muted)]">
                      {[medicine.dosage, medicine.frequency].filter(Boolean).join(' - ') ||
                        'Doz belirtilmedi'}
                    </p>
                    {medicine.notes && (
                      <p className="text-sm text-[var(--text-muted)] italic mt-1">
                        Not: {medicine.notes}
                      </p>
                    )}
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
