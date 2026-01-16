'use client';

import { Patient, Medicine } from '@/types';
import { useState, useEffect } from 'react';

interface PatientFormProps {
  patient?: Patient;
  onSave: (patient: Omit<Patient, 'id' | 'prescriptions'>) => void;
  onCancel: () => void;
}

export default function PatientForm({ patient, onSave, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    age: 0,
    gender: 'male' as 'male' | 'female' | 'other',
    conditions: [] as string[],
    currentMedications: [] as Medicine[],
  });
  const [conditionInput, setConditionInput] = useState('');
  const [medicationInput, setMedicationInput] = useState({ name: '', dosage: '', frequency: '' });

  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        conditions: patient.conditions,
        currentMedications: patient.currentMedications,
      });
    }
  }, [patient]);

  const handleAddCondition = () => {
    if (conditionInput.trim()) {
      setFormData({
        ...formData,
        conditions: [...formData.conditions, conditionInput.trim()],
      });
      setConditionInput('');
    }
  };

  const handleRemoveCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const handleAddMedication = () => {
    if (medicationInput.name.trim()) {
      setFormData({
        ...formData,
        currentMedications: [
          ...formData.currentMedications,
          {
            id: Date.now().toString(),
            name: medicationInput.name.trim(),
            dosage: medicationInput.dosage.trim(),
            frequency: medicationInput.frequency.trim(),
          },
        ],
      });
      setMedicationInput({ name: '', dosage: '', frequency: '' });
    }
  };

  const handleRemoveMedication = (index: number) => {
    setFormData({
      ...formData,
      currentMedications: formData.currentMedications.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {patient ? 'Hasta Düzenle' : 'Yeni Hasta Ekle'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ad Soyad *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Yaş *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.age || ''}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cinsiyet *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="male">Erkek</option>
                <option value="female">Kadın</option>
                <option value="other">Diğer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hastalıklar
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={conditionInput}
                onChange={(e) => setConditionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
                placeholder="Hastalık ekle..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCondition}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Ekle
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.conditions.map((condition, index) => (
                <span
                  key={index}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {condition}
                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(index)}
                    className="hover:text-red-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kullandığı İlaçlar
            </label>
            <div className="space-y-2 mb-2">
              <input
                type="text"
                value={medicationInput.name}
                onChange={(e) => setMedicationInput({ ...medicationInput, name: e.target.value })}
                placeholder="İlaç adı..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={medicationInput.dosage}
                  onChange={(e) => setMedicationInput({ ...medicationInput, dosage: e.target.value })}
                  placeholder="Doz (örn: 100mg)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={medicationInput.frequency}
                  onChange={(e) => setMedicationInput({ ...medicationInput, frequency: e.target.value })}
                  placeholder="Sıklık (örn: Günde 2 kez)"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddMedication}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                İlaç Ekle
              </button>
            </div>
            <div className="space-y-2">
              {formData.currentMedications.map((med, index) => (
                <div
                  key={index}
                  className="bg-blue-50 p-3 rounded-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-gray-600">
                      {med.dosage} - {med.frequency}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Kaydet
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
