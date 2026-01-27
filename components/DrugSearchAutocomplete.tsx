/**
 * Drug Search Autocomplete Component
 * Uses RAG database for drug search with metadata display
 */

'use client';

import { useState, useEffect } from 'react';
import { useRAGDrugSearch } from '@/hooks/useRAGDrugSearch';

interface DrugSearchAutocompleteProps {
    onSelect: (drug: {
        name: string;
        brand_names: string[];
        pharm_class: string[];
        route: string[];
        metadata: any;
    }) => void;
    placeholder?: string;
}

export default function DrugSearchAutocomplete({
    onSelect,
    placeholder = 'İlaç adı girin...',
}: DrugSearchAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const { results, loading, error, searchDrugs } = useRAGDrugSearch();

    useEffect(() => {
        searchDrugs(query);
    }, [query, searchDrugs]);

    const handleSelect = (drug: any) => {
        onSelect({
            name: drug.generic_names[0],
            brand_names: drug.brand_names,
            pharm_class: drug.pharm_class,
            route: drug.route,
            metadata: drug.metadata,
        });
        setQuery('');
        setShowResults(false);
    };

    return (
        <div className="relative">
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                placeholder={placeholder}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {showResults && query.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {loading && (
                        <div className="px-4 py-3 text-gray-500">
                            🔍 Aranıyor...
                        </div>
                    )}

                    {error && (
                        <div className="px-4 py-3 text-red-500">
                            ❌ Hata: {error}
                        </div>
                    )}

                    {!loading && !error && results.length === 0 && (
                        <div className="px-4 py-3 text-gray-500">
                            Sonuç bulunamadı
                        </div>
                    )}

                    {!loading && !error && results.length > 0 && (
                        <div className="divide-y divide-gray-100">
                            {results.map((drug, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(drug)}
                                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900">
                                                {drug.generic_names[0]}
                                            </div>
                                            {drug.brand_names.length > 0 && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    Marka: {drug.brand_names.slice(0, 2).join(', ')}
                                                    {drug.brand_names.length > 2 && ` +${drug.brand_names.length - 2}`}
                                                </div>
                                            )}
                                            {drug.pharm_class.length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {drug.pharm_class.slice(0, 2).join(', ')}
                                                </div>
                                            )}
                                            <div className="flex gap-2 mt-2">
                                                {drug.route.map((r) => (
                                                    <span
                                                        key={r}
                                                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                                                    >
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 ml-3">
                                            {drug.metadata.has_boxed_warning && (
                                                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded" title="Boxed Warning">
                                                    ⚠️ Kara Kutu
                                                </span>
                                            )}
                                            {drug.metadata.has_drug_interactions && (
                                                <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded" title="Drug Interactions">
                                                    🔄 Etkileşim
                                                </span>
                                            )}
                                            {drug.metadata.has_pregnancy_warning && (
                                                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded" title="Pregnancy Warning">
                                                    🤰 Gebelik
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
