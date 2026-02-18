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
  conditions: string[];
  currentMedications: Medicine[];
  newMedications: Medicine[];
}

// NEW SCHEMA - Cleaner and more clinical

export interface InteractionDetail {
  drugs: string[];
  severity: 'High' | 'Medium' | 'Low';
  mechanism: string;
}

export interface AlternativeRecommendation {
  original_drug: string;
  suggested_alternative: string;
  reason: string;
}

export interface MonitoringPlan {
  test: string;
  frequency: string;
  reason: string;
}

export interface DosageWarning {
  drug: string;
  adjustment: string;
  reason: string;
}

export interface SpecialPopulationAlert {
  pregnancy_category?: 'A' | 'B' | 'C' | 'D' | 'X';
  warning_text?: string;
}

export interface PatientSafetyNotes {
  normal_side_effects?: string;
  red_flags?: string;
}

export interface AnalysisResponse {
  results_found: boolean;
  last_updated?: string;
  clinical_summary: string;

  interaction_details?: InteractionDetail[];
  alternatives?: AlternativeRecommendation[];
  monitoring_plan?: MonitoringPlan[];
  dosage_warnings?: DosageWarning[];
  special_population_alerts?: SpecialPopulationAlert;
  patient_safety_notes?: PatientSafetyNotes;
  extracted_patient_info?: any;
}
