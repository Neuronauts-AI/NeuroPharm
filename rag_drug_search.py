"""
RAG Drug Search API
Provides drug search functionality with metadata for prescription form autocomplete
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ==================== RAG DATABASE LOADER ====================

class RAGDrugDatabase:
    """Lazy-loading RAG database with indexing"""
    
    def __init__(self, rag_dir: str = "rag"):
        self.rag_dir = Path(rag_dir)
        self.index = {}  # {drug_name_lower: (file_number, drug_index)}
        self.loaded_files = {}  # Cache for loaded files
        self._build_index()
    
    def _build_index(self):
        """Build index of all drugs for fast lookup"""
        print("🔍 Building RAG drug index...")
        
        # Find all RAG files
        rag_files = sorted(self.rag_dir.glob("rag-optimized-*.json"))
        
        for file_num, rag_file in enumerate(rag_files, 1):
            print(f"  Indexing {rag_file.name}...")
            
            with open(rag_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                for drug_idx, drug in enumerate(data.get('drugs', [])):
                    # Index by generic names
                    for name in drug.get('drug_identity', {}).get('generic_names', []):
                        key = name.lower().strip()
                        if key:
                            self.index[key] = (file_num, drug_idx)
                    
                    # Index by brand names
                    for name in drug.get('drug_identity', {}).get('brand_names', []):
                        key = name.lower().strip()
                        if key:
                            self.index[key] = (file_num, drug_idx)
        
        print(f"✅ Indexed {len(self.index)} drug names")
    
    def _load_file(self, file_num: int) -> dict:
        """Load RAG file with caching"""
        if file_num in self.loaded_files:
            return self.loaded_files[file_num]
        
        rag_file = self.rag_dir / f"rag-optimized-{file_num:04d}-of-0013.json"
        
        with open(rag_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            self.loaded_files[file_num] = data
            return data
    
    def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search drugs by name (fuzzy matching)
        Returns: List of drugs with metadata
        """
        query_lower = query.lower().strip()
        results = []
        seen_drugs = set()
        
        # Exact matches first
        for drug_name, (file_num, drug_idx) in self.index.items():
            if query_lower == drug_name:
                data = self._load_file(file_num)
                drug = data['drugs'][drug_idx]
                
                # Create unique key to avoid duplicates
                drug_key = tuple(sorted(drug['drug_identity']['generic_names']))
                if drug_key not in seen_drugs:
                    seen_drugs.add(drug_key)
                    results.append(self._format_drug(drug))
                
                if len(results) >= limit:
                    return results
        
        # Partial matches
        for drug_name, (file_num, drug_idx) in self.index.items():
            if query_lower in drug_name:
                data = self._load_file(file_num)
                drug = data['drugs'][drug_idx]
                
                drug_key = tuple(sorted(drug['drug_identity']['generic_names']))
                if drug_key not in seen_drugs:
                    seen_drugs.add(drug_key)
                    results.append(self._format_drug(drug))
                
                if len(results) >= limit:
                    return results
        
        return results
    
    def _format_drug(self, drug: dict) -> dict:
        """Format drug data for API response"""
        identity = drug.get('drug_identity', {})
        
        return {
            'generic_names': identity.get('generic_names', []),
            'brand_names': identity.get('brand_names', []),
            'pharm_class': identity.get('pharm_class', []),
            'route': identity.get('route', []),
            'dosage_form': identity.get('dosage_form', []),
            'substance_names': identity.get('substance_names', []),
            'metadata': {
                'has_boxed_warning': bool(drug.get('contraindications', {}).get('boxed_warning')),
                'has_drug_interactions': bool(drug.get('drug_interactions', {}).get('text')),
                'has_pregnancy_warning': 'pregnancy' in drug.get('special_populations', {}),
                'has_renal_dosing': 'renal' in drug.get('dosing', {}).get('dosage_and_administration', '').lower()
            }
        }


# ==================== FASTAPI APP ====================

# Initialize database
rag_db = RAGDrugDatabase()

app = FastAPI(title="RAG Drug Search API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DrugSearchResponse(BaseModel):
    query: str
    results: List[Dict[str, Any]]
    count: int


@app.get("/")
async def root():
    return {
        "service": "RAG Drug Search API",
        "version": "1.0",
        "total_drugs_indexed": len(rag_db.index),
        "status": "running"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "indexed_drugs": len(rag_db.index),
        "loaded_files": len(rag_db.loaded_files)
    }


@app.get("/search", response_model=DrugSearchResponse)
async def search_drugs(
    q: str = Query(..., min_length=2, description="Search query (drug name)"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results")
):
    """
    Search for drugs by name
    
    Example: /search?q=aspirin&limit=5
    """
    results = rag_db.search(q, limit=limit)
    
    return {
        "query": q,
        "results": results,
        "count": len(results)
    }


# ==================== MAIN ====================

if __name__ == "__main__":
    import sys
    
    if "server" in sys.argv:
        import uvicorn
        print("\n🚀 Starting RAG Drug Search API...")
        print("📍 Endpoint: http://localhost:8082/search")
        print("📊 Indexed drugs:", len(rag_db.index))
        print()
        uvicorn.run(app, host="0.0.0.0", port=8082)
    else:
        # Test
        print("🧪 Testing RAG Drug Search\n")
        print("="*60)
        
        test_queries = ["aspirin", "atorvastatin", "warfarin"]
        
        for query in test_queries:
            print(f"\n🔍 Searching: {query}")
            results = rag_db.search(query, limit=3)
            print(f"Found {len(results)} results:")
            for i, drug in enumerate(results, 1):
                print(f"  {i}. {drug['generic_names'][0]}")
                print(f"     Brands: {', '.join(drug['brand_names'][:3])}")
                print(f"     Class: {', '.join(drug['pharm_class'][:2])}")
                print(f"     Route: {', '.join(drug['route'])}")
