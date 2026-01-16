export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  conditions: string[];
  currentMedications: Medicine[];
  prescriptions: Prescription[];
}

export interface Medicine {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  medicines: Medicine[];
  date: string;
  doctorNotes?: string;
}

export interface AnalysisRequest {
  patientId: string;
  currentMedications: Medicine[];
  newMedications: Medicine[];
  conditions: string[];
}

export interface AnalysisResponse {
  riskScore: number;
  alternativeMedicines: string;
  explanation: string;
}
