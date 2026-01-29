'use client';

import { useState, useRef, useEffect } from 'react';
import { Medicine, AnalysisResponse, Patient } from '@/types';
import MedicineSearch from './MedicineSearch';
import AnalysisResult from './AnalysisResult';

interface AnamnesisPanelProps {
    availableMedicines: Medicine[];
    onAnalyze: (file: File, selectedMedicines: Medicine[]) => void;
    isAnalyzing: boolean;
    result: AnalysisResponse | null;
    patient: Patient | null;
    onReplaceWithAlternative: (originalDrugName: string, alternativeDrug: Medicine) => void;
    onSavePrescription: () => void;
}

export default function AnamnesisPanel({
    availableMedicines,
    onAnalyze,
    isAnalyzing,
    result,
    patient,
    onReplaceWithAlternative,
    onSavePrescription,
}: AnamnesisPanelProps) {
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [selectedMedicines, setSelectedMedicines] = useState<Medicine[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Cleanup preview URL on unmount or file change
        return () => {
            if (filePreview) {
                URL.revokeObjectURL(filePreview);
            }
        };
    }, [filePreview]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            // Create preview URL
            if (filePreview) URL.revokeObjectURL(filePreview);
            const objectUrl = URL.createObjectURL(selectedFile);
            setFilePreview(objectUrl);
        }
    };

    const handleAddMedicine = (medicine: Medicine) => {
        setSelectedMedicines([...selectedMedicines, medicine]);
    };

    const handleRemoveMedicine = (medicineId: string) => {
        setSelectedMedicines(selectedMedicines.filter((m) => m.id !== medicineId));
    };

    const handleSubmit = () => {
        if (!file) {
            alert('Lütfen bir anamez dosyası yükleyin.');
            return;
        }
        onAnalyze(file, selectedMedicines);
    };

    const isImage = file?.type.startsWith('image/');
    const isPdf = file?.type === 'application/pdf';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-3">
                    <div className="bg-purple-600/10 p-2 rounded-lg text-purple-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    Anemnez ile Analiz
                </h2>
            </div>

            <div className="flex flex-col gap-8">
                {/* Top Section: File Upload and Preview */}
                <div className="flex flex-col gap-4">
                    <label className="block text-sm font-semibold text-[var(--foreground)]">
                        Anemnez Belgesi Yükle
                    </label>

                    {(!file && !result) && (
                        <div
                            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 ${!file ? 'h-32 flex flex-col items-center justify-center border-[var(--card-border)]' : 'border-green-500 bg-green-500/5'
                                }`}
                            onClick={() => !file && fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt,image/*"
                                className="hidden"
                            />
                            <div className="flex flex-col items-center gap-2 text-[var(--text-muted)]">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <p className="font-medium">Dosya seçmek için tıklayın</p>
                                <p className="text-xs">PDF, Resim, Word veya Metin</p>
                            </div>
                        </div>
                    )}

                    {file && !result && (
                        <div
                            className="border-2 border-dashed border-green-500 bg-green-500/5 rounded-xl p-4 text-center transition-all cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.txt,image/*"
                                className="hidden"
                            />
                            <div className="flex items-center justify-between w-full px-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-green-700 dark:text-green-400 text-sm truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                        setFilePreview(null);
                                    }}
                                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preview Area */}
                    {filePreview && (
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden shadow-sm relative h-[600px]">
                            <div className="absolute top-0 left-0 w-full bg-[var(--card-bg)]/90 backdrop-blur border-b border-[var(--card-border)] p-2 z-10 flex justify-between items-center">
                                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pl-2">Belge Önizleme</span>
                            </div>
                            <div className="h-full w-full pt-10 overflow-auto bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
                                {isImage ? (
                                    <img src={filePreview} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg" />
                                ) : isPdf ? (
                                    <iframe src={filePreview} className="w-full h-full shadow-lg" title="PDF Preview" />
                                ) : (
                                    <div className="text-center text-[var(--text-muted)]">
                                        <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p>Bu dosya formatı için önizleme kullanılamıyor.</p>
                                        <p className="text-sm mt-2">Analiz için gönderilebilir.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Section: Analysis Results AND Medicine Management */}
                <div className="flex flex-col gap-6">
                    {/* Medicine Search Section - Always Visible */}
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">
                            {result ? "Analiz Sonrası İlaç Ekle / Çıkar" : "Ek İlaçlar"}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mb-4">
                            {result
                                ? "Analize yeni bir ilaç ekleyip tekrar değerlendirmek için aşağıdan ilaç seçebilirsiniz."
                                : "Anemnez belgesindeki ilaçlara ek olarak kontrol etmek istediğiniz başka ilaçlar varsa buradan ekleyebilirsiniz."}
                        </p>

                        <MedicineSearch
                            availableMedicines={availableMedicines}
                            selectedMedicines={selectedMedicines}
                            onAddMedicine={handleAddMedicine}
                            onRemoveMedicine={handleRemoveMedicine}
                        />

                        {result && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isAnalyzing}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                                >
                                    {isAnalyzing ? "Yeniden Analiz Ediliyor..." : "Değişikliklerle Yeniden Analiz Et"}
                                </button>
                            </div>
                        )}
                    </div>

                    {result ? (
                        <div className="pb-20">
                            <AnalysisResult
                                result={result}
                                loading={false}
                                onReplaceWithAlternative={onReplaceWithAlternative}
                                patient={patient}
                                selectedMedicines={selectedMedicines}
                            />

                            <div className="mt-6 mb-10">
                                <button
                                    onClick={onSavePrescription}
                                    className="w-full bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 font-bold text-lg transition-colors shadow-lg shadow-green-600/20"
                                >
                                    Reçeteyi Hastaya Kaydet
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mt-auto pt-4 border-t border-[var(--card-border)]">
                                <button
                                    onClick={handleSubmit}
                                    disabled={!file || isAnalyzing}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Yapay Zeka ile Analiz Ediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                            </svg>
                                            Analizi Başlat
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
