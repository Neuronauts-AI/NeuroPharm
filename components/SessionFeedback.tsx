'use client';

import { useState } from 'react';
import {
    SessionFeedbackData,
    ChangeType,
    ChangeTrigger,
    NoChangeReason,
    InformationCompleteness,
} from '@/types';

interface SessionFeedbackProps {
    analysisId: string;
    onComplete: (data: SessionFeedbackData) => void;
    onDismiss: () => void;
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="space-y-1">
            <label className="text-xs text-white/50 uppercase tracking-wider font-medium">{label}</label>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => onChange(star)}
                        className="transition-transform hover:scale-110 active:scale-95"
                    >
                        <svg
                            className={`w-7 h-7 transition-colors ${(hover || value) >= star ? 'text-yellow-400' : 'text-white/15'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </button>
                ))}
                <span className="ml-2 text-sm text-white/40 self-center">
                    {value > 0 ? `${value}/5` : ''}
                </span>
            </div>
        </div>
    );
}

function NPSScale({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="space-y-2">
            <label className="text-xs text-white/50 uppercase tracking-wider font-medium">
                Bu sistemi meslektaşlarınıza tavsiye eder misiniz? (0-10)
            </label>
            <div className="flex gap-1">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <button
                        key={n}
                        onClick={() => onChange(n)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all border ${value === n
                            ? n >= 9 ? 'bg-green-500/30 border-green-500/50 text-green-200'
                                : n >= 7 ? 'bg-yellow-500/30 border-yellow-500/50 text-yellow-200'
                                    : 'bg-red-500/30 border-red-500/50 text-red-200'
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                    >
                        {n}
                    </button>
                ))}
            </div>
            <div className="flex justify-between text-[10px] text-white/25">
                <span>Kesinlikle hayır</span>
                <span>Kesinlikle evet</span>
            </div>
        </div>
    );
}

const CHANGE_TYPE_OPTIONS: { value: ChangeType; label: string; icon: string }[] = [
    { value: 'drug_switched', label: 'İlaç değişikliği', icon: '🔄' },
    { value: 'dose_adjusted', label: 'Doz ayarı', icon: '💊' },
    { value: 'drug_removed', label: 'İlaç çıkarma', icon: '🗑' },
    { value: 'monitoring_added', label: 'İzlem eklendi', icon: '📋' },
    { value: 'multiple_changes', label: 'Birden fazla değişiklik', icon: '📝' },
];

const TRIGGER_OPTIONS: { value: ChangeTrigger; label: string; icon: string }[] = [
    { value: 'system_warning', label: 'Sistem uyarısı', icon: '⚠️' },
    { value: 'own_knowledge', label: 'Kendi bilgim', icon: '🩺' },
    { value: 'colleague_advice', label: 'Meslektaş tavsiyesi', icon: '👨‍⚕️' },
    { value: 'guidelines', label: 'Kılavuz/protokol', icon: '📖' },
    { value: 'other', label: 'Diğer', icon: '📋' },
];

const NO_CHANGE_OPTIONS: { value: NoChangeReason; label: string; icon: string }[] = [
    { value: 'already_managed', label: 'Zaten yönetiliyordu', icon: '✅' },
    { value: 'not_clinically_relevant', label: 'Klinik olarak önemsiz', icon: '📉' },
    { value: 'patient_specific', label: 'Hastaya özel durum', icon: '👤' },
    { value: 'benefit_outweighs_risk', label: 'Fayda > Risk', icon: '⚖️' },
    { value: 'distrust_system', label: 'Sisteme güvenmedim', icon: '🔒' },
    { value: 'other', label: 'Diğer', icon: '📋' },
];

const COMPLETENESS_OPTIONS: { value: InformationCompleteness; label: string }[] = [
    { value: 'complete', label: 'Tam' },
    { value: 'mostly_complete', label: 'Çoğunlukla tam' },
    { value: 'incomplete', label: 'Eksik' },
];

export default function SessionFeedback({ analysisId, onComplete, onDismiss }: SessionFeedbackProps) {
    // Decision
    const [prescriptionChanged, setPrescriptionChanged] = useState<boolean | null>(null);
    const [changeType, setChangeType] = useState<ChangeType | null>(null);
    const [changeDetails, setChangeDetails] = useState('');
    const [changeTrigger, setChangeTrigger] = useState<ChangeTrigger | null>(null);
    const [noChangeReason, setNoChangeReason] = useState<NoChangeReason | null>(null);

    // Scores
    const [benefitScore, setBenefitScore] = useState(0);
    const [trustScore, setTrustScore] = useState(0);
    const [explanationQuality, setExplanationQuality] = useState(0);
    const [recommendationScore, setRecommendationScore] = useState(-1);

    // Usability
    const [rtAcceptable, setRtAcceptable] = useState<boolean | null>(null);
    const [completeness, setCompleteness] = useState<InformationCompleteness | null>(null);

    // Qualitative
    const [mostUseful, setMostUseful] = useState('');
    const [improvementSuggestion, setImprovementSuggestion] = useState('');
    const [freeComment, setFreeComment] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const isValid =
        prescriptionChanged !== null &&
        benefitScore > 0 &&
        trustScore > 0 &&
        explanationQuality > 0 &&
        recommendationScore >= 0 &&
        rtAcceptable !== null &&
        completeness !== null;

    const handleSubmit = async () => {
        if (!isValid) return;
        setSubmitting(true);

        const data: SessionFeedbackData = {
            session_id: `session-${Date.now()}`,
            analysis_id: analysisId,
            timestamp: new Date().toISOString(),
            prescription_changed: prescriptionChanged!,
            change_type: prescriptionChanged ? (changeType || undefined) : undefined,
            change_details: prescriptionChanged && changeDetails.trim() ? changeDetails.trim() : undefined,
            change_trigger: prescriptionChanged ? (changeTrigger || undefined) : undefined,
            no_change_reason: !prescriptionChanged ? (noChangeReason || undefined) : undefined,
            benefit_score: benefitScore,
            trust_score: trustScore,
            explanation_quality: explanationQuality,
            recommendation_score: recommendationScore,
            response_time_acceptable: rtAcceptable!,
            information_completeness: completeness!,
            most_useful_feature: mostUseful.trim() || undefined,
            improvement_suggestion: improvementSuggestion.trim() || undefined,
            free_comment: freeComment.trim() || undefined,
        };

        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedbackType: 'session', ...data }),
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
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6 text-center space-y-2">
                <div className="text-3xl">🎉</div>
                <div className="text-green-400 font-semibold">Detaylı değerlendirmeniz kaydedildi!</div>
                <p className="text-white/50 text-sm">Katkılarınız sistemin klinik değerlendirmesinde büyük değer taşıyor.</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 border border-indigo-500/20 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xl">📊</span>
                    <div>
                        <h3 className="font-bold text-white text-base">Oturum Değerlendirmesi</h3>
                        <p className="text-white/40 text-xs">Klinik karar sürecinizi değerlendirin (~2 dk)</p>
                    </div>
                </div>
                <button
                    onClick={onDismiss}
                    className="text-white/30 hover:text-white/60 transition-colors p-1"
                    title="Kapat"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* ── Section 1: Decision Change ── */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">📝</span>
                        <h4 className="text-sm font-semibold text-white">Karar Değişikliği</h4>
                    </div>

                    <p className="text-white/70 text-sm">Sistem analizi sonrası reçetede değişiklik yaptınız mı?</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setPrescriptionChanged(true); setNoChangeReason(null); }}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all border ${prescriptionChanged === true
                                ? 'bg-blue-500/25 border-blue-400/50 text-blue-200'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                }`}
                        >
                            Evet, değiştirdim
                        </button>
                        <button
                            onClick={() => { setPrescriptionChanged(false); setChangeType(null); setChangeTrigger(null); }}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all border ${prescriptionChanged === false
                                ? 'bg-blue-500/25 border-blue-400/50 text-blue-200'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                }`}
                        >
                            Hayır, değiştirmedim
                        </button>
                    </div>

                    {/* Changed: What changed + trigger */}
                    {prescriptionChanged === true && (
                        <div className="pl-3 border-l-2 border-blue-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                                <p className="text-white/50 text-xs mb-2">Ne tür bir değişiklik?</p>
                                <div className="flex flex-wrap gap-2">
                                    {CHANGE_TYPE_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setChangeType(opt.value)}
                                            className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all border ${changeType === opt.value
                                                ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200'
                                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                                }`}
                                        >
                                            {opt.icon} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                value={changeDetails}
                                onChange={e => setChangeDetails(e.target.value)}
                                placeholder="Değişikliği kısaca açıklayın... (opsiyonel)"
                                maxLength={2000}
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-indigo-500/50"
                            />

                            <div>
                                <p className="text-white/50 text-xs mb-2">Değişikliğin tetikleyicisi?</p>
                                <div className="flex flex-wrap gap-2">
                                    {TRIGGER_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setChangeTrigger(opt.value)}
                                            className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all border ${changeTrigger === opt.value
                                                ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200'
                                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                                }`}
                                        >
                                            {opt.icon} {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Not changed: reason */}
                    {prescriptionChanged === false && (
                        <div className="pl-3 border-l-2 border-blue-500/30 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-white/50 text-xs">Değiştirmeme nedeniniz?</p>
                            <div className="flex flex-wrap gap-2">
                                {NO_CHANGE_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setNoChangeReason(opt.value)}
                                        className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all border ${noChangeReason === opt.value
                                            ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200'
                                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                                            }`}
                                    >
                                        {opt.icon} {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <hr className="border-white/5" />

                {/* ── Section 2: Scores ── */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">⭐</span>
                        <h4 className="text-sm font-semibold text-white">Genel Değerlendirme</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StarRating label="Klinik Fayda" value={benefitScore} onChange={setBenefitScore} />
                        <StarRating label="Sisteme Güven" value={trustScore} onChange={setTrustScore} />
                        <StarRating label="Açıklama Kalitesi" value={explanationQuality} onChange={setExplanationQuality} />
                    </div>
                </div>

                <hr className="border-white/5" />

                {/* ── Section 3: NPS ── */}
                <NPSScale value={recommendationScore} onChange={setRecommendationScore} />

                <hr className="border-white/5" />

                {/* ── Section 4: Usability ── */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">⚡</span>
                        <h4 className="text-sm font-semibold text-white">Kullanılabilirlik</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <p className="text-white/60 text-xs">Yanıt süresi kabul edilebilir miydi?</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setRtAcceptable(true)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${rtAcceptable === true
                                        ? 'bg-green-500/25 border-green-500/50 text-green-300'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    Evet
                                </button>
                                <button
                                    onClick={() => setRtAcceptable(false)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${rtAcceptable === false
                                        ? 'bg-red-500/25 border-red-500/50 text-red-300'
                                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                        }`}
                                >
                                    Hayır, yavaştı
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-white/60 text-xs">Bilgi yeterliliği?</p>
                            <div className="flex gap-2">
                                {COMPLETENESS_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setCompleteness(opt.value)}
                                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${completeness === opt.value
                                            ? 'bg-indigo-500/25 border-indigo-400/50 text-indigo-200'
                                            : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-white/5" />

                {/* ── Section 5: Qualitative ── */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">💬</span>
                        <h4 className="text-sm font-semibold text-white">Görüşleriniz <span className="text-white/30 font-normal">(opsiyonel)</span></h4>
                    </div>

                    <div className="space-y-2">
                        <input
                            type="text"
                            value={mostUseful}
                            onChange={e => setMostUseful(e.target.value)}
                            placeholder="En faydalı özellik hangisiydi?"
                            maxLength={500}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
                        />
                        <textarea
                            value={improvementSuggestion}
                            onChange={e => setImprovementSuggestion(e.target.value)}
                            placeholder="İyileştirme öneriniz var mı?"
                            maxLength={2000}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-indigo-500/50"
                        />
                        <textarea
                            value={freeComment}
                            onChange={e => setFreeComment(e.target.value)}
                            placeholder="Serbest yorum..."
                            maxLength={2000}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
                <p className="text-white/30 text-xs">
                    {isValid ? '✓ Gönderilebilir' : 'Zorunlu alanları doldurun (⭐ puanlar, NPS, karar, kullanılabilirlik)'}
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={onDismiss}
                        className="py-2 px-4 rounded-lg text-sm font-medium text-white/40 hover:text-white/60 transition-colors"
                    >
                        Şimdi Değil
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || submitting}
                        className="py-2 px-5 rounded-lg text-sm font-semibold transition-all
                            bg-gradient-to-r from-indigo-500 to-purple-500 text-white
                            hover:from-indigo-600 hover:to-purple-600
                            disabled:opacity-30 disabled:cursor-not-allowed
                            hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {submitting ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
                    </button>
                </div>
            </div>
        </div>
    );
}
