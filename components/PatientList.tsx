'use client';

import { Patient } from '@/types';
import { useState } from 'react';

interface PatientListProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onAddPatient: () => void;
  onEditPatient: (patient: Patient) => void;
}

export default function PatientList({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  onEditPatient,
}: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-[var(--sidebar-bg)] border-r border-[var(--card-border)] flex flex-col h-screen">
      <div className="p-4 border-b border-[var(--card-border)]">
        <h2 className="text-xl font-bold text-[var(--foreground)] mb-3">Hastalar</h2>
        <input
          type="text"
          placeholder="Hasta ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--input-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--input-bg)] text-[var(--foreground)]"
        />
        <button
          onClick={onAddPatient}
          className="w-full mt-3 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Yeni Hasta Ekle
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => onSelectPatient(patient)}
            className={`p-4 border-b border-[var(--card-border)] cursor-pointer transition-colors ${
              selectedPatient?.id === patient.id
                ? 'bg-blue-600/10 border-l-4 border-l-blue-600'
                : 'hover:bg-[var(--hover-bg)]'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--foreground)]">{patient.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {patient.age} yaş, {patient.gender === 'male' ? 'Erkek' : patient.gender === 'female' ? 'Kadın' : 'Diğer'}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {patient.conditions.slice(0, 2).map((condition, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-red-500/20 text-red-400 dark:text-red-300 px-2 py-0.5 rounded"
                    >
                      {condition}
                    </span>
                  ))}
                  {patient.conditions.length > 2 && (
                    <span className="text-xs text-[var(--text-muted)]">
                      +{patient.conditions.length - 2}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditPatient(patient);
                }}
                className="text-[var(--text-muted)] hover:text-blue-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
