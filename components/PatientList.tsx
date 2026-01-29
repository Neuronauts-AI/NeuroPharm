'use client';

import { Patient } from '@/types';
import { useState } from 'react';

interface PatientListProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onAddPatient: () => void;
  onEditPatient: (patient: Patient) => void;
  onAnamnesisClick: () => void;
}

export default function PatientList({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  onEditPatient,
  onAnamnesisClick,
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
        <div className="flex gap-2 mt-3">
          <button
            onClick={onAddPatient}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Hasta
          </button>

          <button
            onClick={onAnamnesisClick}
            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
            title="Anemnez belgesi ile analiz"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Anemnez
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            onClick={() => onSelectPatient(patient)}
            className={`p-4 border-b border-[var(--card-border)] cursor-pointer transition-colors ${selectedPatient?.id === patient.id
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
