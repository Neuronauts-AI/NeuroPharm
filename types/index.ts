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

// Risk alt skorları (xAI - Açıklanabilir AI)
export interface RiskBreakdown {
  drug_interaction: number;        // İlaç-ilaç etkileşimi (1-10)
  organ_function: number;          // Böbrek/karaciğer uyumsuzluğu (1-10)
  patient_factors: number;         // Gebelik/yaş/alerji (1-10)
  dosage_risk: number;             // Doz aşımı riski (1-10)
  duplicative_therapy: number;     // Tekrarlayan tedavi (1-10)
  triggered_rules: string[];       // Tetiklenen kurallar listesi
}

// Alternatif ve önlem önerileri
export interface AlternativeRecommendation {
  drug_name: string;               // İlgili ilaç
  risk_level: 'high' | 'medium' | 'low';
  action: string;                  // Yapılması gereken aksiyon
  alternative_drug?: string;       // Alternatif ilaç önerisi
  dosage_adjustment?: string;      // Doz ayarlaması
}

// İzlem ve laboratuvar önerileri
export interface MonitoringRecommendation {
  test_name: string;               // Test adı (INR, serum K, creatinin vb.)
  frequency: string;               // Sıklık (haftalık, aylık vb.)
  reason: string;                  // Neden gerekli
  related_drugs: string[];         // İlgili ilaçlar
}

// Doz ayarlama önerileri
export interface DosageAdjustment {
  drug_name: string;
  current_dose?: string;
  recommended_dose: string;
  reason: string;                  // Böbrek/karaciğer fonksiyonu vb.
  contraindicated: boolean;        // Kullanılmamalı mı?
}

// Gebelik/Emzirme uyarıları
export interface PregnancyWarning {
  drug_name: string;
  category: string;                // FDA kategorisi (A, B, C, D, X)
  warning: string;
  alternative?: string;
  breastfeeding_safe: boolean;
}

export interface AnalysisResponse {
  // Temel bilgiler
  risk_score: number;              // 1-10 arası toplam risk
  description: string;             // Genel açıklama
  results_found: boolean;

  // Detaylı risk kırılımı (xAI)
  risk_breakdown: RiskBreakdown;

  // Alternatif ve önlem önerileri
  alternatives: AlternativeRecommendation[];

  // İzlem ve laboratuvar önerileri
  monitoring: MonitoringRecommendation[];

  // Doz ayarlamaları
  dosage_adjustments: DosageAdjustment[];

  // Gebelik/Emzirme uyarıları
  pregnancy_warnings: PregnancyWarning[];

  // Eski alanlar (geriye uyumluluk)
  alternative_suggestion: string;
  has_alternative: boolean;
}
