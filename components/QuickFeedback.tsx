'use client';

import { useState, useRef } from 'react';
import {
    AnalysisResponse,
    Patient,
    Medicine,
    QuickFeedbackData,
    FeedbackAnalysisContext,
    InteractionEvaluation,
    InteractionReality,
    ClinicianSeverity,
    ClinicalRelevance,
    InteractionAction,
    OverallAlignment,
    QualityRating,
} from '@/types';

interface QuickFeedbackProps {
    analysisId: string;
    analysisResult: AnalysisResponse;
    patient: Patient | null;
    selectedMedicines: Medicine[];
    onComplete: (data: QuickFeedbackData) => void;
}

// ── Labels ──

const REALITY_OPTIONS: { value: InteractionReality; label: string; icon: string; color: string }[] = [
    { value: 'true_positive', label: 'Gerçek', icon: '✓', color: 'green' },
    { value: 'false_positive', label: 'Yanlış Alarm', icon: '✗', color: 'red' },
    { value: 'uncertain', label: 'Belirsiz', icon: '?', color: 'gray' },
];

const SEVERITY_OPTIONS: { value: ClinicianSeverity; label: string; color: string }[] = [
    { value: 'critical', label: 'Kritik', color: 'red' },
    { value: 'high', label: 'Yüksek', color: 'orange' },
    { value: 'moderate', label: 'Orta', color: 'yellow' },
    { value: 'low', label: 'Düşük', color: 'blue' },
    { value: 'none', label: 'Yok', color: 'gray' },
];

const RELEVANCE_OPTIONS: { value: ClinicalRelevance; label: string }[] = [
    { value: 'highly_relevant', label: 'Yüksek' },
    { value: 'somewhat_relevant', label: 'Orta' },
    { value: 'not_relevant', label: 'Düşük' },
];

const ACTION_OPTIONS: { value: InteractionAction; label: string; icon: string }[] = [
    { value: 'none', label: 'Değişiklik yok', icon: '—' },
    { value: 'dose_adjusted', label: 'Doz ayarı', icon: '💊' },
    { value: 'drug_switched', label: 'İlaç değişimi', icon: '🔄' },
    { value: 'drug_removed', label: 'İlaç çıkarma', icon: '🗑' },
    { value: 'monitoring_added', label: 'İzlem eklendi', icon: '📋' },
    { value: 'consulted', label: 'Konsültasyon', icon: '👨‍⚕️' },
];

const QUALITY_OPTIONS: { value: QualityRating; label: string }[] = [
    { value: 'yes', label: 'Uygun' },
    { value: 'partial', label: 'Kısmen' },
    { value: 'no', label: 'Uygun Değil' },
    { value: 'na', label: 'Yok' },
];

// ── Helper: build context snapshot ──

function buildContext(
    result: AnalysisResponse,
    patient: Patient | null,
    selectedMedicines: Medicine[],
): FeedbackAnalysisContext {
    const interactions = result.interaction_details || [];
    const sevDist = { high: 0, medium: 0, low: 0 };
    interactions.forEach(i => {
        const s = i.severity?.toLowerCase() as 'high' | 'medium' | 'low';
        if (s in sevDist) sevDist[s]++;
    });

    return {
        patient_age: patient?.age ?? 0,
        patient_gender: patient?.gender ?? 'unknown',
        conditions: patient?.conditions ?? [],
        current_medication_count: patient?.currentMedications?.length ?? 0,
        new_medication_count: selectedMedicines.length,
        current_medications: (patient?.currentMedications ?? []).map(m => m.name),
        new_medications: selectedMedicines.map(m => m.name),
        interactions_found: interactions.length,
        severity_distribution: sevDist,
        has_alternatives: (result.alternatives?.length ?? 0) > 0,
        has_monitoring_plan: (result.monitoring_plan?.length ?? 0) > 0,
        has_dosage_warnings: (result.dosage_warnings?.length ?? 0) > 0,
        analysis_timestamp: new Date().toISOString(),
    };
}

// ── Component ──

export default function QuickFeedback({ analysisId, analysisResult, patient, selectedMedicines, onComplete }: QuickFeedbackProps) {
    const startTime = useRef(Date.now());

    // Steps: 0=alignment, 1=per-interaction, 2=missed+quality, 3=submitted
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Step 0
    const [alignment, setAlignment] = useState<OverallAlignment | null>(null);
    const [infoGained, setInfoGained] = useState<boolean | null>(null);

    // Step 1 — per-interaction
    const interactions = analysisResult.interaction_details?.filter(
        i => i.severity === 'High' || i.severity === 'Medium'
    ) || [];

    const [evaluations, setEvaluations] = useState<InteractionEvaluation[]>(
        interactions.map(i => ({
            drugs: i.drugs,
            system_severity: i.severity,
            is_real_interaction: 'true_positive' as InteractionReality,
            clinician_severity: (i.severity === 'High' ? 'high' : 'moderate') as ClinicianSeverity,
            clinical_relevance: 'highly_relevant' as ClinicalRelevance,
            was_already_known: false,
            action_taken: 'none' as InteractionAction,
        }))
    );

    // Step 2 — missed + quality
    const [hasMissed, setHasMissed] = useState<boolean | null>(null);
    const [missedDetails, setMissedDetails] = useState('');
    const [missedDrugs, setMissedDrugs] = useState('');
    const [missedSeverity, setMissedSeverity] = useState<ClinicianSeverity>('moderate');
    const [altQuality, setAltQuality] = useState<QualityRating>('na');
    const [monQuality, setMonQuality] = useState<QualityRating>('na');

    const hasInteractions = interactions.length > 0;
    const hasAlternatives = (analysisResult.alternatives?.length ?? 0) > 0;
    const hasMonitoring = (analysisResult.monitoring_plan?.length ?? 0) > 0;

    const updateEval = (idx: number, field: keyof InteractionEvaluation, value: any) => {
        const updated = [...evaluations];
        updated[idx] = { ...updated[idx], [field]: value };
        setEvaluations(updated);
    };

    const handleStep0Next = () => {
        if (alignment && infoGained !== null) {
            setStep(hasInteractions ? 1 : 2);
        }
    };

    const handleStep1Next = () => setStep(2);

    const submitFeedback = async () => {
        if (!alignment || infoGained === null) return;
        setSubmitting(true);

        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
        const context = buildContext(analysisResult, patient, selectedMedicines);

        const data: QuickFeedbackData = {
            analysis_id: analysisId,
            timestamp: new Date().toISOString(),
            context,
            overall_alignment: alignment,
            new_information_gained: infoGained,
            interaction_evaluations: evaluations,
            has_missed_interactions: hasMissed === true,
            missed_interaction_details: hasMissed ? missedDetails.trim() || undefined : undefined,
            missed_interaction_drugs: hasMissed && missedDrugs.trim()
                ? missedDrugs.split(',').map(s => s.trim()).filter(Boolean)
                : undefined,
            missed_interaction_severity: hasMissed ? missedSeverity : undefined,
            alternatives_appropriate: hasAlternatives ? altQuality : undefined,
            monitoring_appropriate: hasMonitoring ? monQuality : undefined,
            time_spent_seconds: timeSpent,
        };

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedbackType: 'quick', ...data }),
            });
            setSubmitted(true);
            onComplete(data);
        } catch {
            // Non-critical
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-green-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Klinik değerlendirmeniz kaydedildi. Teşekkürler!</span>
                </div>
            </div>
        );
    }

    const totalSteps = hasInteractions ? 3 : 2;

    return (
        <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 border border-indigo-500/20 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <h4 className="font-semibold text-white text-sm">Klinik Değerlendirme</h4>
                    <span className="text-[10px] text-white/30 ml-1">Adım {step + 1}/{totalSteps}</span>
                </div>
                <div className="flex gap-1">
                    {Array.from({ length: totalSteps }).map((_, s) => (
                        <div
                            key={s}
                            className={`w-2 h-2 rounded-full transition-colors ${step > s ? 'bg-green-400' : step === s ? 'bg-indigo-400' : 'bg-white/20'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="p-5">
                {/* ── Step 0: Overall Alignment + Info Gained ── */}
                {step === 0 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="space-y-2">
                            <p className="text-white/90 text-sm font-medium">
                                Bu analiz klinik pratiğinizle örtüşüyor mu?
                            </p>
                            <div className="flex gap-2">
                                {([
                                    ['aligned', '✓ Örtüşüyor', 'green'],
                                    ['partially_aligned', '◐ Kısmen', 'yellow'],
                                    ['not_aligned', '✗ Örtüşmüyor', 'red'],
                                ] as [OverallAlignment, string, string][]).map(([val, label, clr]) => (
                                    <button
                                        key={val}
                                        onClick={() => setAlignment(val)}
                                        className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all border ${alignment === val
                                            ? `bg-${clr}-500/25 border-${clr}-500/50 text-${clr}-300`
                                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-white/90 text-sm font-medium">
                                Bu analiz yeni bilgi sağladı mı?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setInfoGained(true)}
                                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all border ${infoGained === true
                                        ? 'bg-blue-500/25 border-blue-500/50 text-blue-300'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    Evet, yeni bilgi edindim
                                </button>
                                <button
                                    onClick={() => setInfoGained(false)}
                                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all border ${infoGained === false
                                        ? 'bg-gray-500/25 border-gray-500/50 text-gray-300'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    Hayır, bildiğim şeylerdi
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleStep0Next}
                            disabled={!alignment || infoGained === null}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all
                                bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                                hover:from-indigo-600 hover:to-purple-600 disabled:opacity-30
                                hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Devam →
                        </button>
                    </div>
                )}

                {/* ── Step 1: Per-Interaction Evaluation ── */}
                {step === 1 && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                        <p className="text-white/90 text-sm font-medium">
                            Her etkileşimi değerlendirin
                            <span className="text-white/40 ml-1">({evaluations.length} etkileşim)</span>
                        </p>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {evaluations.map((ev, idx) => (
                                <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2.5">
                                    {/* Drug pair header */}
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ev.system_severity === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'
                                            }`}>
                                            {ev.system_severity}
                                        </span>
                                        {ev.drugs.map((d, i) => (
                                            <span key={i} className="font-semibold text-white/80">
                                                {d}{i < ev.drugs.length - 1 && <span className="text-white/30 mx-1">×</span>}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Row 1: Is Real? */}
                                    <div>
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider">Gerçek mi?</label>
                                        <div className="flex gap-1 mt-1">
                                            {REALITY_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => updateEval(idx, 'is_real_interaction', opt.value)}
                                                    className={`flex-1 py-1 px-1.5 rounded text-[10px] font-medium transition-all border ${ev.is_real_interaction === opt.value
                                                        ? `bg-${opt.color}-500/30 border-${opt.color}-500/50 text-${opt.color}-200`
                                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {opt.icon} {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Row 2: Clinician Severity + Relevance */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-white/40 uppercase tracking-wider">Gerçek Şiddet</label>
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {SEVERITY_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => updateEval(idx, 'clinician_severity', opt.value)}
                                                        className={`py-1 px-1.5 rounded text-[10px] font-medium transition-all border ${ev.clinician_severity === opt.value
                                                            ? 'bg-indigo-500/30 border-indigo-400/50 text-indigo-200'
                                                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-white/40 uppercase tracking-wider">Klinik Önem</label>
                                            <div className="flex gap-1 mt-1">
                                                {RELEVANCE_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => updateEval(idx, 'clinical_relevance', opt.value)}
                                                        className={`flex-1 py-1 px-1.5 rounded text-[10px] font-medium transition-all border ${ev.clinical_relevance === opt.value
                                                            ? 'bg-indigo-500/30 border-indigo-400/50 text-indigo-200'
                                                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row 3: Already Known + Action */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-white/40 uppercase tracking-wider">Bunu Biliyordunuz mu?</label>
                                            <div className="flex gap-1 mt-1">
                                                <button
                                                    onClick={() => updateEval(idx, 'was_already_known', true)}
                                                    className={`flex-1 py-1 px-2 rounded text-[10px] font-medium border transition-all ${ev.was_already_known
                                                        ? 'bg-blue-500/25 border-blue-500/50 text-blue-200'
                                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                                        }`}
                                                >
                                                    Evet
                                                </button>
                                                <button
                                                    onClick={() => updateEval(idx, 'was_already_known', false)}
                                                    className={`flex-1 py-1 px-2 rounded text-[10px] font-medium border transition-all ${!ev.was_already_known
                                                        ? 'bg-orange-500/25 border-orange-500/50 text-orange-200'
                                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                                        }`}
                                                >
                                                    Hayır
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-white/40 uppercase tracking-wider">Alınan Aksiyon</label>
                                            <select
                                                value={ev.action_taken}
                                                onChange={e => updateEval(idx, 'action_taken', e.target.value)}
                                                className="mt-1 w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white/70 focus:outline-none focus:border-indigo-500/50"
                                            >
                                                {ACTION_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.icon} {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => setStep(0)}
                                className="py-2.5 px-4 rounded-lg text-sm font-medium text-white/40 hover:text-white/60"
                            >
                                ← Geri
                            </button>
                            <button
                                onClick={handleStep1Next}
                                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                                    bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                                    hover:from-indigo-600 hover:to-purple-600
                                    hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Devam →
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Missed Interactions + Quality ── */}
                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Missed Interactions */}
                        <div className="space-y-2">
                            <p className="text-white/90 text-sm font-medium">
                                Sistemin kaçırdığı bir etkileşim var mıydı?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setHasMissed(true)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${hasMissed === true
                                        ? 'bg-red-500/25 border-red-500/50 text-red-300'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    Evet, kaçırdığı var
                                </button>
                                <button
                                    onClick={() => setHasMissed(false)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${hasMissed === false
                                        ? 'bg-green-500/25 border-green-500/50 text-green-300'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    Hayır, kaçırmadı
                                </button>
                            </div>

                            {hasMissed === true && (
                                <div className="pl-3 border-l-2 border-red-500/30 space-y-2 animate-in fade-in duration-200">
                                    <textarea
                                        value={missedDetails}
                                        onChange={e => setMissedDetails(e.target.value)}
                                        placeholder="Kaçırılan etkileşimi açıklayın..."
                                        maxLength={2000}
                                        rows={2}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-red-500/50"
                                    />
                                    <input
                                        type="text"
                                        value={missedDrugs}
                                        onChange={e => setMissedDrugs(e.target.value)}
                                        placeholder="İlaç isimleri (virgülle ayırın)"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-red-500/50"
                                    />
                                    <div>
                                        <label className="text-[10px] text-white/40 uppercase tracking-wider">Kaçırılanın Şiddeti</label>
                                        <div className="flex gap-1 mt-1">
                                            {SEVERITY_OPTIONS.filter(s => s.value !== 'none').map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setMissedSeverity(opt.value)}
                                                    className={`flex-1 py-1 px-2 rounded text-[10px] font-medium border transition-all ${missedSeverity === opt.value
                                                        ? 'bg-indigo-500/30 border-indigo-400/50 text-indigo-200'
                                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Alternatives Quality */}
                        {hasAlternatives && (
                            <div className="space-y-2">
                                <p className="text-white/90 text-sm font-medium">Önerilen alternatifler uygun muydu?</p>
                                <div className="flex gap-2">
                                    {QUALITY_OPTIONS.filter(o => o.value !== 'na').map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setAltQuality(opt.value)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${altQuality === opt.value
                                                ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200'
                                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Monitoring Quality */}
                        {hasMonitoring && (
                            <div className="space-y-2">
                                <p className="text-white/90 text-sm font-medium">İzlem planı uygun muydu?</p>
                                <div className="flex gap-2">
                                    {QUALITY_OPTIONS.filter(o => o.value !== 'na').map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setMonQuality(opt.value)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${monQuality === opt.value
                                                ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200'
                                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit row */}
                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => setStep(hasInteractions ? 1 : 0)}
                                className="py-2.5 px-4 rounded-lg text-sm font-medium text-white/40 hover:text-white/60"
                            >
                                ← Geri
                            </button>
                            <button
                                onClick={submitFeedback}
                                disabled={submitting || hasMissed === null}
                                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                                    bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                                    hover:from-indigo-600 hover:to-purple-600 disabled:opacity-30
                                    hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
