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
          backend: 'python',
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
                patient={selectedPatient}
                selectedMedicines={selectedMedicines}
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
