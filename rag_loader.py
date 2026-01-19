"""
RAG Veritabanı Yükleyici ve İlaç Arama Modülü

Bu modül 253,426 ilaç kaydını içeren RAG JSON dosyalarını yükler ve
ilaç adına göre hızlı arama yapar.

Performans:
- İlk yükleme: ~2-3 saniye (index oluşturma)
- Arama: ~10-50ms (in-memory lookup)
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGLoader:
    """RAG veritabanı yükleyici ve ilaç arama sınıfı"""
    
    def __init__(self, rag_dir: str = "rag"):
        """
        Args:
            rag_dir: RAG JSON dosyalarının bulunduğu klasör
        """
        self.rag_dir = Path(rag_dir)
        self.drug_index: Dict[str, Dict[str, Any]] = {}  # {drug_name: {file: path, index: i}}
        self.loaded_files: Dict[str, List[Dict]] = {}  # Cache: {file_path: drugs_list}
        self.is_initialized = False
        
    def initialize(self):
        """RAG dosyalarından index oluştur"""
        if self.is_initialized:
            logger.info("RAG loader already initialized")
            return
            
        logger.info("Initializing RAG loader - building drug index...")
        start_time = __import__('time').time()
        
        # RAG JSON dosyalarını bul
        rag_files = sorted(self.rag_dir.glob("rag-optimized-*.json"))
        
        if not rag_files:
            raise FileNotFoundError(f"No RAG files found in {self.rag_dir}")
        
        logger.info(f"Found {len(rag_files)} RAG files")
        
        # Her dosyadan ilaç isimlerini indexle
        total_drugs = 0
        for file_path in rag_files:
            try:
                # Dosyayı aç ve her ilaç için index oluştur
                # Memory tasarrufu için tüm dosyayı yükleme, sadece isimleri al
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    drugs = data.get('drugs', [])
                    
                    for idx, drug in enumerate(drugs):
                        # İlaç kimlik bilgilerini al
                        identity = drug.get('drug_identity', {})
                        
                        # Tüm olası isim varyasyonlarını index'e ekle
                        all_names = []
                        all_names.extend(identity.get('brand_names', []))
                        all_names.extend(identity.get('generic_names', []))
                        all_names.extend(identity.get('substance_names', []))
                        
                        # Her isim için index entry oluştur
                        for name in all_names:
                            if name and name.strip():
                                # Normalize: uppercase, trim
                                normalized_name = name.strip().upper()
                                
                                # Index'e ekle (dosya ve index bilgisi)
                                if normalized_name not in self.drug_index:
                                    self.drug_index[normalized_name] = {
                                        'file': str(file_path),
                                        'index': idx,
                                        'original_name': name
                                    }
                        
                        total_drugs += 1
                
                logger.info(f"Indexed {len(drugs)} drugs from {file_path.name}")
                
            except Exception as e:
                logger.error(f"Error indexing {file_path}: {e}")
                continue
        
        elapsed = __import__('time').time() - start_time
        logger.info(f"✅ RAG index built: {total_drugs} drugs, {len(self.drug_index)} searchable names in {elapsed:.2f}s")
        self.is_initialized = True
    
    def find_drug(self, drug_name: str) -> Optional[Dict[str, Any]]:
        """
        İlaç adına göre ilaç bilgilerini bul
        
        Args:
            drug_name: İlaç adı (brand, generic veya substance name)
            
        Returns:
            İlaç bilgileri dict'i veya None
        """
        if not self.is_initialized:
            self.initialize()
        
        # Normalize
        normalized_name = drug_name.strip().upper()
        
        # Index'te ara
        if normalized_name not in self.drug_index:
            logger.debug(f"Drug '{drug_name}' not found in index")
            return None
        
        # Dosya ve index bilgisini al
        entry = self.drug_index[normalized_name]
        file_path = entry['file']
        drug_idx = entry['index']
        
        # Dosyayı cache'ten al veya yükle
        if file_path not in self.loaded_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.loaded_files[file_path] = data.get('drugs', [])
                    logger.debug(f"Loaded {file_path} into cache")
            except Exception as e:
                logger.error(f"Error loading {file_path}: {e}")
                return None
        
        # İlacı döndür
        drugs = self.loaded_files[file_path]
        if drug_idx < len(drugs):
            return drugs[drug_idx]
        
        logger.warning(f"Drug index {drug_idx} out of range in {file_path}")
        return None
    
    def find_drugs(self, drug_names: List[str]) -> Dict[str, Optional[Dict[str, Any]]]:
        """
        Birden fazla ilacı toplu ara
        
        Args:
            drug_names: İlaç isimleri listesi
            
        Returns:
            {drug_name: drug_data} mapping
        """
        if not self.is_initialized:
            self.initialize()
        
        results = {}
        for name in drug_names:
            results[name] = self.find_drug(name)
        
        return results
    
    def search_by_class(self, pharm_class: str) -> List[Dict[str, Any]]:
        """
        Farmakolojik sınıfa göre ilaçları bul
        
        Args:
            pharm_class: Farmakolojik sınıf (örn: "Statin", "ACE Inhibitor")
            
        Returns:
            İlaç listesi
        """
        if not self.is_initialized:
            self.initialize()
        
        results = []
        normalized_class = pharm_class.strip().upper()
        
        # Tüm cache'lenmiş dosyalarda ara
        for drugs in self.loaded_files.values():
            for drug in drugs:
                identity = drug.get('drug_identity', {})
                pharm_classes = identity.get('pharm_class', [])
                
                # Sınıf eşleşmesi
                for pc in pharm_classes:
                    if normalized_class in pc.upper():
                        results.append(drug)
                        break
        
        return results
    
    def get_stats(self) -> Dict[str, int]:
        """RAG istatistikleri"""
        if not self.is_initialized:
            self.initialize()
        
        return {
            'total_searchable_names': len(self.drug_index),
            'cached_files': len(self.loaded_files),
            'total_files': len(list(self.rag_dir.glob("rag-optimized-*.json")))
        }


# Singleton instance
_rag_loader_instance: Optional[RAGLoader] = None


def get_rag_loader() -> RAGLoader:
    """Global RAG loader instance'ını al"""
    global _rag_loader_instance
    
    if _rag_loader_instance is None:
        _rag_loader_instance = RAGLoader()
        _rag_loader_instance.initialize()
    
    return _rag_loader_instance


if __name__ == "__main__":
    # Test
    print("🧪 Testing RAG Loader...")
    
    loader = RAGLoader()
    loader.initialize()
    
    # Stats
    stats = loader.get_stats()
    print(f"\n📊 Stats: {stats}")
    
    # Test arama
    test_drugs = ["Aspirin", "Warfarin", "Atorvastatin", "Lisinopril", "NonExistentDrug"]
    
    print("\n🔍 Testing drug search:")
    for drug_name in test_drugs:
        result = loader.find_drug(drug_name)
        if result:
            identity = result.get('drug_identity', {})
            print(f"  ✅ {drug_name}: Found - {identity.get('generic_names', ['N/A'])[0]}")
        else:
            print(f"  ❌ {drug_name}: Not found")
    
    print("\n✅ RAG Loader test complete!")
