"""
RAG-based İlaç Etkileşim Analiz Motoru

RISK_SCORING_GUIDE.json kurallarını kullanarak ilaç etkileşimlerini analiz eder
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

from rag_loader import get_rag_loader

logger = logging.getLogger(__name__)


class DrugInteractionAnalyzer:
    """RAG veritabanı kullanarak ilaç etkileşimlerini analiz eder"""
    
    def __init__(self, risk_guide_path: str = "rag/RISK_SCORING_GUIDE.json"):
        self.rag_loader = get_rag_loader()
        
        # Risk scoring guide'ı yükle
        with open(risk_guide_path, 'r', encoding='utf-8') as f:
            self.risk_guide = json.load(f)
        
        logger.info("Drug Interaction Analyzer initialized")
    
    def analyze(
        self,
        age: int,
        gender: str,
        conditions: List[str],
        current_medications: List[Dict],
        new_medications: List[Dict]
    ) -> Dict[str, Any]:
        """
        İlaç etkileşimlerini analiz eder
        
        Returns:
            Analysis result dict matching frontend expected format
        """
        # İlaç isimlerini çıkar
        current_med_names = [med.get("name", "") for med in current_medications]
        new_med_names = [med.get("name", "") for med in new_medications]
        
        # RAG'dan ilaç bilgilerini al
        all_drug_names = current_med_names + new_med_names
        drug_data = {name: self.rag_loader.find_drug(name) for name in all_drug_names}
        
        # Bulunan/bulunamayan ilaçları logla
        found_drugs = [name for name, data in drug_data.items() if data is not None]
        not_found_drugs = [name for name, data in drug_data.items() if data is None]
        
        logger.info(f"Found {len(found_drugs)} drugs in RAG: {', '.join(found_drugs)}")
        if not_found_drugs:
            logger.warning(f"Not found in RAG: {', '.join(not_found_drugs)}")
        
        # Risk skorlarını hesapla
        risk_breakdown = self._calculate_risk_breakdown(
            age, gender, conditions, drug_data, current_med_names, new_med_names
        )
        
        # Toplam risk skoru
        total_risk = min(100, sum([
            risk_breakdown['drug_interaction'],
            risk_breakdown['organ_function'],
            risk_breakdown['patient_factors'],
            risk_breakdown['dosage_risk'],
            risk_breakdown['duplicative_therapy']
        ]))
        
        # 1-10 skalasına dönüştür (frontend için)
        risk_score = min(10, round(total_risk / 10))
        
        # Risk seviyesi
        risk_level = self._get_risk_level(total_risk)
        
        # Alternatif önerileri
        alternatives = self._get_alternatives(drug_data, new_med_names, total_risk)
        
        # İzlem önerileri
        monitoring = self._get_monitoring_recommendations(drug_data, current_med_names, new_med_names)
        
        # Description oluştur
        clinical_summary = self._generate_description(found_drugs, not_found_drugs, risk_level, total_risk)
        
        # Etkileşim detayları
        interaction_details = self._get_interaction_details(drug_data, current_med_names, new_med_names, total_risk) if total_risk >= 30 else None
        
        return {
            "risk_score": risk_score,
            "results_found": len(found_drugs) > 0,
            "clinical_summary": clinical_summary,
            
            # Optional fields - only include if have data
            "interaction_details": interaction_details,
            "alternatives": alternatives if alternatives else None,
            "monitoring_plan": monitoring if monitoring else None,
            "dosage_warnings": None,  # TODO: Implement
            "special_population_alerts": None,  # TODO: Implement  
            "patient_safety_notes": None,  # TODO: Implement
        }
    
    def _calculate_risk_breakdown(
        self,
        age: int,
        gender: str,
        conditions: List[str],
        drug_data: Dict[str, Optional[Dict]],
        current_meds: List[str],
        new_meds: List[str]
    ) -> Dict[str, Any]:
        """Risk kırılımını hesapla"""
        
        # 1. İlaç-ilaç etkileşimi (0-40)
        drug_interaction_score = self._check_drug_interactions(drug_data, current_meds,new_meds)
        
        # 2. Organ fonksiyonu (0-25)
        organ_function_score = 2  # Default low
        
        # 3. Hasta faktörleri (0-20)
        patient_factors_score = 3 if age >= 65 else 2
        
        # 4. Doz riski (0-10)
        dosage_risk_score = 2
        
        # 5. Duplike terapi (0-15)
        duplicative_score = self._check_duplicative_therapy(drug_data, current_meds, new_meds)
        
        # Tetiklenen kurallar
        triggered_rules = []
        if drug_interaction_score >= 30:
            triggered_rules.append("Majör ilaç etkileşimi tespit edildi")
        if age >= 65:
            triggered_rules.append("Geriatrik hasta - özel dikkat gerekli")
        if duplicative_score > 0:
            triggered_rules.append("Duplike terapi kontrolü yapıldı")
        
        return {
            "drug_interaction": min(10, round(drug_interaction_score / 4)),
            "organ_function": min(10, round(organ_function_score / 2.5)),
            "patient_factors": min(10, round(patient_factors_score / 2)),
            "dosage_risk": min(10, dosage_risk_score),
            "duplicative_therapy": min(10, round(duplicative_score / 1.5)),
            "triggered_rules": triggered_rules
        }
    
    def _check_drug_interactions(
        self,
        drug_data: Dict[str, Optional[Dict]],
        current_meds: List[str],
        new_meds: List[str]
    ) -> int:
        """İlaç-ilaç etkileşimlerini kontrol et (0-40 skor)"""
        max_score = 0
        
        for new_med in new_meds:
            new_drug = drug_data.get(new_med)
            if not new_drug:
                continue
            
            # Drug interactions alanını al
            interactions = new_drug.get('drug_interactions', {})
            interaction_text = interactions.get('text', '') if isinstance(interactions, dict) else str(interactions)
            
            # Contraindications kontrol et
            contraindications = new_drug.get('contraindications', {})
            contra_text = contraindications.get('text', '') if isinstance(contraindications, dict) else str(contraindications)
            boxed_warning = contraindications.get('boxed_warning', '') if isinstance(contraindications, dict) else ''
            
            # Mevcut ilaçlarla etkileşim var mı?
            for current_med in current_meds:
                current_upper = current_med.upper()
                
                # Boxed warning veya contraindication check
                if boxed_warning and current_upper in boxed_warning.upper():
                    max_score = max(max_score, 40)  # CRITICAL
                elif contra_text and current_upper in contra_text.upper():
                    max_score = max(max_score, 40)  # CRITICAL
                # Major interaction keywords
                elif any(kw in interaction_text.lower() for kw in ['serious', 'major', 'avoid', 'increased risk']) and current_upper in interaction_text.upper():
                    max_score = max(max_score, 30)  # HIGH
                # Moderate interaction
                elif any(kw in interaction_text.lower() for kw in ['moderate', 'caution', 'monitor']) and current_upper in interaction_text.upper():
                    max_score = max(max_score, 15)  # MODERATE
                # Herhangi bir mention
                elif current_upper in interaction_text.upper():
                    max_score = max(max_score, 5)  # LOW
        
        return max_score
    
    def _check_duplicative_therapy(
        self,
        drug_data: Dict[str, Optional[Dict]],
        current_meds: List[str],
        new_meds: List[str]
    ) -> int:
        """Duplike terapi kontrolü (0-15 skor)"""
        # Basit kontrol: aynı isim veya sınıf
        all_meds = current_meds + new_meds
        
        # Duplicate name check
        if len(all_meds) != len(set([m.upper() for m in all_meds])):
            return 15  # CRITICAL - same drug
        
        # TODO: Pharm class duplicate check
        
        return 0
    
    def _get_risk_level(self, total_risk: int) -> str:
        """Risk seviyesini belirle"""
        if total_risk >= 86:
            return "CRITICAL"
        elif total_risk >= 61:
            return "HIGH"
        elif total_risk >= 31:
            return "MODERATE"
        else:
            return "LOW"
    
    def _get_interaction_details(
        self,
        drug_data: Dict[str, Optional[Dict]],
        current_meds: List[str],
        new_meds: List[str],
        total_risk: int
    ) -> List[Dict]:
        """Etkileşim detaylarını oluştur - YENİ FORMAT"""
        interactions = []
        
        # Yüksek riskli etkileşimleri tespit et
        for new_med in new_meds:
            for current_med in current_meds:
                # Basit etkileşim kontrolü - gerçek implementasyon RAG data kullanmalı
                severity = "High" if total_risk >= 70 else "Medium" if total_risk >= 40 else "Low"
                
                # Warfarin + NSAİD gibi bilinen yüksek riskli kombinasyonlar
                if ('WARFARIN' in current_med.upper() or 'WARFARIN' in new_med.upper()) and \
                   ('ASPIRIN' in current_med.upper() or 'ASPIRIN' in new_med.upper() or \
                    'IBUPROFEN' in current_med.upper() or 'IBUPROFEN' in new_med.upper()):
                    interactions.append({
                        "drugs": [current_med, new_med],
                        "severity": "High",
                        "mechanism": "Warfarin ile NSAİD kombinasyonu kanama riskini önemli ölçüde artırır"
                    })
                elif total_risk >= 40:  # Orta-yüksek risk varsa generic ekle
                    interactions.append({
                        "drugs": [current_med, new_med],
                        "severity": severity,
                        "mechanism": f"{current_med} ve {new_med} arasında potansiyel etkileşim tespit edildi"
                    })
        
        return interactions[:5]  # Max 5 etkileşim
    
    def _get_alternatives(
        self,
        drug_data: Dict[str, Optional[Dict]],
        new_meds: List[str],
        total_risk: int
    ) -> List[Dict]:
        """Alternatif ilaç önerileri oluştur - YENİ FORMAT"""
        alternatives = []
        
        if total_risk < 61:  # Sadece yüksek risk durumunda alternatif öner
            return alternatives
        
        # RISK_SCORING_GUIDE'dan alternatif önerileri
        alt_recommendations = self.risk_guide.get('alternative_recommendations', {}).get('substitution_examples', {})
        
        for new_med in new_meds:
            drug = drug_data.get(new_med)
            if not drug:
                continue
            
            # Her ilaç için uygun alternatif bul
            if 'ASPIRIN' in new_med.upper():
                alt_info = alt_recommendations.get('aspirin_gi_bleeding', {})
                if alt_info:
                    alternatives.append({
                        "original_drug": new_med,
                        "suggested_alternative": "Clopidogrel",
                        "reason": "Gastro-intestinal kanama riski azalır"
                    })
            elif 'WARFARIN' in new_med.upper():
                alternatives.append({
                    "original_drug": new_med,
                    "suggested_alternative": "Apiksaban veya Rivaroksaban",
                    "reason": "INR takibi gerektirmez, güvenlik profili daha iyi"
                })
            
            # Generic fallback alternative
            if not alternatives:
                alternatives.append({
                    "original_drug": new_med,
                    "suggested_alternative": "Doktor önerisi gereklidir",
                    "reason": f"{new_med} için daha güvenli alternatif değerlendirilmelidir"
                })
        
        return alternatives[:3]  # Max 3 alternatif
    
    def _get_monitoring_recommendations(
        self,
        drug_data: Dict[str, Optional[Dict]],
        current_meds: List[str],
        new_meds: List[str]
    ) -> List[Dict]:
        """İzlem önerileri oluştur - YENİ FORMAT"""
        monitoring = []
        all_meds = current_meds + new_meds
        
        # Antikoagülan kontrol için INR takibi
        anticoagulants = ['WARFARIN', 'COUMADIN']
        if any(ac in ' '.join(all_meds).upper() for ac in anticoagulants):
            monitoring.append({
                "test": "INR (International Normalized Ratio)",
                "frequency": "İlk 2 hafta günlük, sonra haftada 1-2 kez",
                "reason": "Antikoagül an dozunu ayarlamak ve kanama riskini önlemek için"
            })
        
        # Böbrek fonksiyonu takibi
        nephrotoxic = ['METFORMIN', 'NSAID', 'ACE INHIBITOR']
        if any(med in ' '.join(all_meds).upper() for med in nephrotoxic):
            monitoring.append({
                "test": "Kreatinin ve eGFR",
                "frequency": "3 ayda bir",
                "reason": "Böbrek fonksiyonunu takip etmek için"
            })
        
        # Karaciğer fonksiyonu
        hepatotoxic = ['STATIN', 'PARACETAMOL']
        if any(med in ' '.join(all_meds).upper() for med in hepatotoxic):
            monitoring.append({
                "test": "Karaciğer Fonksiyon Testleri (ALT, AST)",
                "frequency": "6 ayda bir",
                "reason": "Karaciğer hasarını erken tespit etmek için"
            })
        
        return monitoring
    
    def _generate_description(
        self,
        found_drugs: List[str],
        not_found_drugs: List[str],
        risk_level: str,
        total_risk: int
    ) -> str:
        """Analiz açıklaması oluştur"""
        if not found_drugs:
            return "RAG veritabanında belirtilen ilaçlar bulunamadı."
        
        desc = f"{len(found_drugs)} ilaç RAG veritabanında analiz edildi. "
        
        if risk_level == "CRITICAL":
            desc += f"⚠️ KRİTİK RİSK (Skor: {total_risk}/100): Bu kombinasyon ciddi sağlık riski taşıyor. İlaçları birlikte KULLANMAYIN!"
        elif risk_level == "HIGH":
            desc += f"⚠️ YÜKSEK RİSK (Skor: {total_risk}/100): Bu kombinasyon dikkatli izlem gerektirir. Doz ayarlaması veya alternatif düşünülmelidir."
        elif risk_level == "MODERATE":
            desc += f"⚡ ORTA RİSK (Skor: {total_risk}/100): Dikkatli kullanım ve düzenli izlem gereklidir."
        else:
            desc += f"✅ DÜŞÜK RİSK (Skor: {total_risk}/100): Güvenli kullanım."
        
        if not_found_drugs:
            desc += f" Not: {', '.join(not_found_drugs)} ilaçları veritabanında bulunamadı."
        
        return desc


# Singleton instance
_analyzer_instance: Optional[DrugInteractionAnalyzer] = None


def get_analyzer() -> DrugInteractionAnalyzer:
    """Global analyzer instance"""
    global _analyzer_instance
    
    if _analyzer_instance is None:
        _analyzer_instance = DrugInteractionAnalyzer()
    
    return _analyzer_instance
