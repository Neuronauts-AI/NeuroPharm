'use client';

import { useState } from 'react';
import PatientList from '@/components/PatientList';
import PatientForm from '@/components/PatientForm';
import PatientDetails from '@/components/PatientDetails';
import MedicineSearch from '@/components/MedicineSearch';
import AnalysisResult from '@/components/AnalysisResult';
import { Patient, Medicine, AnalysisResponse } from '@/types';
import { mockPatients, mockMedicines } from '@/lib/mockData';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedMedicines, setSelectedMedicines] = useState<Medicine[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedBackend, setSelectedBackend] = useState<'n8n' | 'python'>('python');

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSelectedMedicines([]);
    setAnalysisResult(null);
  };

  const handleAddPatient = () => {
    setEditingPatient(null);
    setShowPatientForm(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowPatientForm(true);
  };

  const handleSavePatient = (patientData: Omit<Patient, 'id' | 'prescriptions'>) => {
    if (editingPatient) {
      const updatedPatients = patients.map((p) =>
        p.id === editingPatient.id
          ? { ...p, ...patientData }
          : p
      );
      setPatients(updatedPatients);
      if (selectedPatient?.id === editingPatient.id) {
        setSelectedPatient({ ...editingPatient, ...patientData });
      }
    } else {
      const newPatient: Patient = {
        id: Date.now().toString(),
        ...patientData,
        prescriptions: [],
      };
      setPatients([...patients, newPatient]);
    }
    setShowPatientForm(false);
    setEditingPatient(null);
  };

  const handleAddMedicine = (medicine: Medicine) => {
    setSelectedMedicines([...selectedMedicines, medicine]);
  };

  const handleRemoveMedicine = (medicineId: string) => {
    setSelectedMedicines(selectedMedicines.filter((m) => m.id !== medicineId));
  };

  const handleAnalyze = async () => {
    if (!selectedPatient || selectedMedicines.length === 0) {
      alert('Lütfen hasta seçin ve en az bir ilaç ekleyin.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backend: selectedBackend,
          age: selectedPatient.age,
          gender: selectedPatient.gender,
          conditions: selectedPatient.conditions,
          currentMedications: selectedPatient.currentMedications,
          newMedications: selectedMedicines,
        }),
      });

      if (!response.ok) {
        throw new Error('Analiz başarısız oldu');
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('İlaç analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReplaceWithAlternative = (originalDrugName: string, alternativeDrug: Medicine) => {
    // Remove the original medication from selected medicines
    const filteredMedicines = selectedMedicines.filter(
      (med) => med.name.toLowerCase() !== originalDrugName.toLowerCase()
    );

    // Add the alternative medication
    const updatedMedicines = [...filteredMedicines, alternativeDrug];
    setSelectedMedicines(updatedMedicines);

    // Clear analysis result to allow re-analysis with new medication
    setAnalysisResult(null);

    // Show success feedback
    alert(`✅ ${originalDrugName} yerine ${alternativeDrug.name} eklendi!\n\nYeni listeyi tekrar analiz edebilirsiniz.`);
  };

  const handleSavePrescription = () => {
    if (!selectedPatient || selectedMedicines.length === 0) {
      alert('Kaydetmek için hasta ve ilaç seçmelisiniz.');
      return;
    }

    const newPrescription = {
      id: Date.now().toString(),
      patientId: selectedPatient.id,
      medicines: selectedMedicines,
      date: new Date().toISOString(),
    };

    const updatedPatients = patients.map((p) =>
      p.id === selectedPatient.id
        ? {
          ...p,
          prescriptions: [...p.prescriptions, newPrescription],
          currentMedications: [
            ...p.currentMedications,
            ...selectedMedicines.filter(
              (newMed) => !p.currentMedications.some((curr) => curr.id === newMed.id)
            ),
          ],
        }
        : p
    );

    setPatients(updatedPatients);
    setSelectedPatient(updatedPatients.find((p) => p.id === selectedPatient.id) || null);
    setSelectedMedicines([]);
    setAnalysisResult(null);
    alert('Reçete başarıyla kaydedildi!');
  };

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <PatientList
        patients={patients}
        selectedPatient={selectedPatient}
        onSelectPatient={handleSelectPatient}
        onAddPatient={handleAddPatient}
        onEditPatient={handleEditPatient}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Doktor Reçete Paneli</h1>
            <ThemeToggle />
          </div>

          {selectedPatient ? (
            <>
              <PatientDetails patient={selectedPatient} />

              <MedicineSearch
                availableMedicines={mockMedicines}
                selectedMedicines={selectedMedicines}
                onAddMedicine={handleAddMedicine}
                onRemoveMedicine={handleRemoveMedicine}
              />

              {selectedMedicines.length > 0 && (
                <div className="mt-6 space-y-4">
                  {/* Backend Seçici */}
                  <div className="bg-[var(--card-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-4">
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-3">
                      Analiz Backend Seçimi
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedBackend('python')}
                        className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${selectedBackend === 'python'
                          ? 'bg-green-600 text-white'
                          : 'bg-[var(--hover-bg)] text-[var(--foreground)] hover:opacity-80'
                          }`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z" />
                        </svg>
                        Local Python
                      </button>
                      <button
                        onClick={() => setSelectedBackend('n8n')}
                        className={`flex-1 px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${selectedBackend === 'n8n'
                          ? 'bg-orange-500 text-white'
                          : 'bg-[var(--hover-bg)] text-[var(--foreground)] hover:opacity-80'
                          }`}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        n8n Webhook
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {selectedBackend === 'python'
                        ? 'Lokal Python FastAPI sunucusu kullanılacak (localhost:8080)'
                        : 'n8n webhook servisi kullanılacak (uzak sunucu)'}
                    </p>
                  </div>

                  {/* Analiz Butonu */}
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
                  >
                    {isAnalyzing ? 'Analiz Ediliyor...' : 'İlaç Etkileşimini Analiz Et'}
                  </button>
                </div>
              )}

              <AnalysisResult
                result={analysisResult}
                loading={isAnalyzing}
                onReplaceWithAlternative={handleReplaceWithAlternative}
              />

              {analysisResult && selectedMedicines.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={handleSavePrescription}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-semibold transition-colors"
                  >
                    Reçeteyi Hastaya Kaydet
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-[var(--card-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-[var(--text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-[var(--foreground)]">Hasta Seçilmedi</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Sol taraftaki listeden bir hasta seçin veya yeni hasta ekleyin.
              </p>
            </div>
          )}
        </div>
      </div>

      {showPatientForm && (
        <PatientForm
          patient={editingPatient || undefined}
          onSave={handleSavePatient}
          onCancel={() => {
            setShowPatientForm(false);
            setEditingPatient(null);
          }}
        />
      )}
    </div>
  );
}
