import { Patient, Medicine } from '@/types';

export const mockMedicines: Medicine[] = [
  { id: '1', name: 'Aspirin', dosage: '100mg', frequency: 'Günde 1 kez' },
  { id: '2', name: 'Paracetamol', dosage: '500mg', frequency: 'Günde 3 kez' },
  { id: '3', name: 'Ibuprofen', dosage: '400mg', frequency: 'Günde 2 kez' },
  { id: '4', name: 'Amoxicillin', dosage: '500mg', frequency: 'Günde 3 kez' },
  { id: '5', name: 'Omeprazole', dosage: '20mg', frequency: 'Günde 1 kez' },
  { id: '6', name: 'Metformin', dosage: '850mg', frequency: 'Günde 2 kez' },
  { id: '7', name: 'Atorvastatin', dosage: '10mg', frequency: 'Günde 1 kez' },
  { id: '8', name: 'Lisinopril', dosage: '10mg', frequency: 'Günde 1 kez' },
  { id: '9', name: 'Levothyroxine', dosage: '50mcg', frequency: 'Günde 1 kez' },
  { id: '10', name: 'Amlodipine', dosage: '5mg', frequency: 'Günde 1 kez' },
];

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Ahmet Yılmaz',
    age: 45,
    gender: 'male',
    conditions: ['Hipertansiyon', 'Diyabet'],
    currentMedications: [
      { id: '6', name: 'Metformin', dosage: '850mg', frequency: 'Günde 2 kez' },
      { id: '8', name: 'Lisinopril', dosage: '10mg', frequency: 'Günde 1 kez' },
    ],
    prescriptions: [],
  },
  {
    id: '2',
    name: 'Ayşe Kaya',
    age: 32,
    gender: 'female',
    conditions: ['Migren'],
    currentMedications: [
      { id: '2', name: 'Paracetamol', dosage: '500mg', frequency: 'Günde 3 kez' },
    ],
    prescriptions: [],
  },
  {
    id: '3',
    name: 'Mehmet Demir',
    age: 58,
    gender: 'male',
    conditions: ['Kalp Hastalığı', 'Yüksek Kolesterol'],
    currentMedications: [
      { id: '1', name: 'Aspirin', dosage: '100mg', frequency: 'Günde 1 kez' },
      { id: '7', name: 'Atorvastatin', dosage: '10mg', frequency: 'Günde 1 kez' },
    ],
    prescriptions: [],
  },
  {
    id: '4',
    name: 'Fatma Öztürk',
    age: 67,
    gender: 'female',
    conditions: ['Hipotiroidi', 'Hipertansiyon'],
    currentMedications: [
      { id: '9', name: 'Levothyroxine', dosage: '50mcg', frequency: 'Günde 1 kez' },
      { id: '10', name: 'Amlodipine', dosage: '5mg', frequency: 'Günde 1 kez' },
    ],
    prescriptions: [],
  },
];
