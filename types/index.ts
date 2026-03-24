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
  llm_provider?: LLMProvider;
  llm_model?: LLMModel;
}

export type LLMProvider = 'openrouter';

export type LLMModel = string;

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

// ── Feedback Types ──────────────────────────────────────
// Clinical validation data schema — measures accuracy, relevance,
// novelty, decision impact, trust, usability, and NPS.

// ── Auto-captured analysis context (for segmentation) ──

export interface FeedbackAnalysisContext {
  patient_age: number;
  patient_gender: string;
  conditions: string[];
  current_medication_count: number;
  new_medication_count: number;
  current_medications: string[];
  new_medications: string[];
  interactions_found: number;
  severity_distribution: { high: number; medium: number; low: number };
  has_alternatives: boolean;
  has_monitoring_plan: boolean;
  has_dosage_warnings: boolean;
  analysis_timestamp: string;
}

// ── Per-interaction clinical evaluation ──

export type InteractionReality = 'true_positive' | 'false_positive' | 'uncertain';
export type ClinicianSeverity = 'none' | 'low' | 'moderate' | 'high' | 'critical';
export type ClinicalRelevance = 'highly_relevant' | 'somewhat_relevant' | 'not_relevant';
export type InteractionAction = 'none' | 'dose_adjusted' | 'drug_switched' | 'drug_removed' | 'monitoring_added' | 'consulted';

export interface InteractionEvaluation {
  drugs: string[];
  system_severity: string;
  is_real_interaction: InteractionReality;
  clinician_severity: ClinicianSeverity;
  clinical_relevance: ClinicalRelevance;
  was_already_known: boolean;
  action_taken: InteractionAction;
}

// ── Layer 1: Quick Feedback (post-analysis, <1 min) ──

export type OverallAlignment = 'aligned' | 'partially_aligned' | 'not_aligned';
export type QualityRating = 'yes' | 'partial' | 'no' | 'na';

export interface QuickFeedbackData {
  analysis_id: string;
  timestamp: string;
  context: FeedbackAnalysisContext;
  // Overall
  overall_alignment: OverallAlignment;
  new_information_gained: boolean;
  // Per-interaction
  interaction_evaluations: InteractionEvaluation[];
  // False negatives
  has_missed_interactions: boolean;
  missed_interaction_details?: string;
  missed_interaction_drugs?: string[];
  missed_interaction_severity?: ClinicianSeverity;
  // Recommendation quality
  alternatives_appropriate?: QualityRating;
  monitoring_appropriate?: QualityRating;
  // Auto-tracked
  time_spent_seconds?: number;
}

// ── Layer 2: Session Feedback (end-of-session, ~2 min) ──

export type ChangeType = 'drug_switched' | 'dose_adjusted' | 'drug_removed' | 'monitoring_added' | 'multiple_changes';
export type ChangeTrigger = 'system_warning' | 'own_knowledge' | 'colleague_advice' | 'guidelines' | 'other';
export type NoChangeReason = 'already_managed' | 'not_clinically_relevant' | 'patient_specific' | 'benefit_outweighs_risk' | 'distrust_system' | 'other';
export type InformationCompleteness = 'complete' | 'mostly_complete' | 'incomplete';

export interface SessionFeedbackData {
  session_id: string;
  analysis_id: string;
  timestamp: string;
  // Decision tracking
  prescription_changed: boolean;
  change_type?: ChangeType;
  change_details?: string;
  change_trigger?: ChangeTrigger;
  no_change_reason?: NoChangeReason;
  // Scores
  benefit_score: number;         // 1-5
  trust_score: number;           // 1-5
  explanation_quality: number;   // 1-5
  recommendation_score: number;  // 1-10 (NPS)
  // Usability
  response_time_acceptable: boolean;
  information_completeness: InformationCompleteness;
  // Qualitative
  most_useful_feature?: string;
  improvement_suggestion?: string;
  free_comment?: string;
}
