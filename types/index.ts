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
  age: number;
  gender: 'male' | 'female' | 'other';
  conditions: string[];            // Hastalıklar
  currentMedications: Medicine[];  // Kullanılan ilaçlar
  newMedications: Medicine[];      // Yazılacak ilaçlar
}

export interface AnalysisResponse {
  risk_score: number; // 1-10 arası
  alternative_suggestion: string;
  description: string;
  has_alternative: boolean;
  results_found: boolean;
}
