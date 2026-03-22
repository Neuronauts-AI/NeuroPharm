'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ── Types ──

interface Stats {
    total_quick: number;
    total_session: number;
    accuracy: {
        total_interactions_evaluated: number;
        true_positives: number;
        false_positives: number;
        uncertain: number;
        precision: number | null;
        severity_agreement_rate: number | null;
        clinician_severity_distribution: Record<string, number>;
    };
    clinical_relevance: Record<string, number>;
    novelty: {
        already_known: number;
        novel_to_clinician: number;
        sessions_info_gained: number;
        sessions_no_info_gained: number;
    };
    actions_taken: Record<string, number>;
    overall_alignment: Record<string, number>;
    false_negatives: {
        sessions_with_missed: number;
        rate: number | null;
        details: Array<{ analysis_id?: string; timestamp?: string; details?: string; drugs?: string[]; severity?: string }>;
    };
    alternatives_quality: Record<string, number>;
    monitoring_quality: Record<string, number>;
    avg_time_spent_seconds: number | null;
    session_scores: {
        avg_benefit: number | null;
        avg_trust: number | null;
        avg_explanation: number | null;
        avg_recommendation: number | null;
        nps: number | null;
    };
    decision_impact: {
        prescription_changed: number;
        prescription_not_changed: number;
        change_rate: number | null;
        change_types: Record<string, number>;
        change_triggers: Record<string, number>;
        no_change_reasons: Record<string, number>;
    };
    usability: {
        response_time_acceptable: number;
        response_time_not_acceptable: number;
        information_completeness: Record<string, number>;
    };
    qualitative: {
        useful_features: string[];
        improvement_suggestions: string[];
        free_comments: string[];
    };
    context_summary: {
        avg_patient_age: number | null;
        avg_total_medications: number | null;
    };
}

// ── UI Helpers ──

function Bar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-white/60">{label}</span>
                <span className="text-white/80 font-mono">{value}{max > 0 ? ` (${Math.round(pct)}%)` : ''}</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function Metric({ label, value, suffix, icon }: { label: string; value: string | number | null; suffix?: string; icon?: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            {icon && <div className="text-2xl mb-1">{icon}</div>}
            <div className="text-2xl font-bold text-white">
                {value !== null && value !== undefined ? value : '—'}
                {suffix && <span className="text-sm text-white/40">{suffix}</span>}
            </div>
            <div className="text-xs text-white/50 mt-1">{label}</div>
        </div>
    );
}

function Pct({ v }: { v: number | null }) {
    if (v === null) return <span className="text-white/30">—</span>;
    return <>{(v * 100).toFixed(1)}%</>;
}

function Card({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
    return (
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                {icon && <span>{icon}</span>} {title}
            </h3>
            {children}
        </div>
    );
}

const ACTION_LABELS: Record<string, string> = {
    'none': 'Değişiklik yok', 'dose_adjusted': 'Doz ayarı', 'drug_switched': 'İlaç değişimi',
    'drug_removed': 'İlaç çıkarma', 'monitoring_added': 'İzlem eklendi', 'consulted': 'Konsültasyon',
};
const TRIGGER_LABELS: Record<string, string> = {
    'system_warning': 'Sistem uyarısı', 'own_knowledge': 'Kendi bilgisi', 'colleague_advice': 'Meslektaş', 'guidelines': 'Kılavuz', 'other': 'Diğer',
};
const NO_CHANGE_LABELS: Record<string, string> = {
    'already_managed': 'Zaten yönetiliyor', 'not_clinically_relevant': 'Klinik önemsiz',
    'patient_specific': 'Hastaya özel', 'benefit_outweighs_risk': 'Fayda > Risk', 'distrust_system': 'Güvensizlik', 'other': 'Diğer',
};
const CHANGE_TYPE_LABELS: Record<string, string> = {
    'drug_switched': 'İlaç değişimi', 'dose_adjusted': 'Doz ayarı', 'drug_removed': 'İlaç çıkarma',
    'monitoring_added': 'İzlem eklendi', 'multiple_changes': 'Çoklu değişiklik',
};

// ── Main ──

export default function FeedbackDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'accuracy' | 'impact' | 'trust' | 'quality' | 'qualitative'>('accuracy');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetch('/api/feedback')
            .then(r => r.json())
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleExport = async () => {
        setExporting(true);
        try {
            const res = await fetch('/api/feedback/export');
            const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `feedback_export_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
                    <p className="text-white/50">Klinik metrikler yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center space-y-3">
                    <p className="text-white/50">Veri alınamadı.</p>
                    <Link href="/" className="text-indigo-400 hover:underline text-sm">← Ana Sayfa</Link>
                </div>
            </div>
        );
    }

    const s = stats;
    const totalFeedbacks = s.total_quick + s.total_session;

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* ── Header ── */}
            <div className="border-b border-white/10 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-white/40 hover:text-white/70 transition-colors" title="Ana Sayfa">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">📊 Klinik Değerlendirme Dashboard</h1>
                            <p className="text-xs text-white/40">Sistem doğruluğu, klinik etki ve güven analitikleri</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-medium">
                            {totalFeedbacks} geri bildirim
                        </span>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/60 hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                            {exporting ? 'Dışa aktarılıyor...' : '📥 JSON Export'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="max-w-7xl mx-auto px-6 pt-4">
                <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
                    {([
                        ['accuracy', '🎯 Doğruluk & Tespit'],
                        ['impact', '📝 Klinik Etki'],
                        ['trust', '⭐ Güven & Puanlar'],
                        ['quality', '📋 Öneri Kalitesi'],
                        ['qualitative', '💬 Yorumlar'],
                    ] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === key
                                ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/30'
                                : 'text-white/40 hover:text-white/60 border border-transparent'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

                {/* ══════════════════ TAB: ACCURACY ══════════════════ */}
                {tab === 'accuracy' && (
                    <>
                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Metric icon="🔬" label="Değerlendirilen Etkileşim" value={s.accuracy.total_interactions_evaluated} />
                            <Metric icon="✅" label="Gerçek Pozitif (TP)" value={s.accuracy.true_positives} />
                            <Metric icon="❌" label="Yanlış Pozitif (FP)" value={s.accuracy.false_positives} />
                            <Metric icon="🎯" label="Precision" value={s.accuracy.precision !== null ? `${(s.accuracy.precision * 100).toFixed(1)}` : null} suffix="%" />
                            <Metric icon="📊" label="Şiddet Uyumu" value={s.accuracy.severity_agreement_rate !== null ? `${(s.accuracy.severity_agreement_rate * 100).toFixed(1)}` : null} suffix="%" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Detection Reality */}
                            <Card title="Etkileşim Tespiti (TP / FP / Belirsiz)" icon="🎯">
                                <Bar value={s.accuracy.true_positives} max={s.accuracy.total_interactions_evaluated} color="bg-green-500" label="Gerçek Pozitif (TP)" />
                                <Bar value={s.accuracy.false_positives} max={s.accuracy.total_interactions_evaluated} color="bg-red-500" label="Yanlış Pozitif (FP)" />
                                <Bar value={s.accuracy.uncertain} max={s.accuracy.total_interactions_evaluated} color="bg-gray-500" label="Belirsiz" />
                            </Card>

                            {/* Clinician Severity Distribution */}
                            <Card title="Klinisyen Şiddet Değerlendirmesi" icon="🏥">
                                {Object.entries(s.accuracy.clinician_severity_distribution).length > 0 ? (
                                    Object.entries(s.accuracy.clinician_severity_distribution).map(([sev, count]) => {
                                        const total = Object.values(s.accuracy.clinician_severity_distribution).reduce((a, b) => a + b, 0);
                                        const colors: Record<string, string> = { critical: 'bg-red-600', high: 'bg-red-500', moderate: 'bg-yellow-500', low: 'bg-blue-500', none: 'bg-gray-400' };
                                        return <Bar key={sev} value={count} max={total} color={colors[sev] || 'bg-gray-500'} label={sev.charAt(0).toUpperCase() + sev.slice(1)} />;
                                    })
                                ) : (
                                    <p className="text-white/20 text-sm text-center py-4">Henüz veri yok</p>
                                )}
                            </Card>

                            {/* Clinical Relevance */}
                            <Card title="Klinik Önem Dağılımı" icon="📋">
                                {(() => {
                                    const total = Object.values(s.clinical_relevance).reduce((a, b) => a + b, 0);
                                    const labels: Record<string, string> = { highly_relevant: 'Yüksek Önem', somewhat_relevant: 'Orta Önem', not_relevant: 'Düşük Önem' };
                                    const colors: Record<string, string> = { highly_relevant: 'bg-green-500', somewhat_relevant: 'bg-yellow-500', not_relevant: 'bg-gray-500' };
                                    return Object.entries(s.clinical_relevance).map(([key, val]) => (
                                        <Bar key={key} value={val} max={total} color={colors[key] || 'bg-gray-500'} label={labels[key] || key} />
                                    ));
                                })()}
                            </Card>

                            {/* Novelty / Info Gain */}
                            <Card title="Bilgi Yeniliği" icon="💡">
                                <Bar value={s.novelty.novel_to_clinician} max={s.novelty.already_known + s.novelty.novel_to_clinician} color="bg-green-500" label="Yeni Bilgi" />
                                <Bar value={s.novelty.already_known} max={s.novelty.already_known + s.novelty.novel_to_clinician} color="bg-gray-500" label="Zaten Biliniyordu" />
                                <hr className="border-white/5 my-2" />
                                <Bar value={s.novelty.sessions_info_gained} max={s.novelty.sessions_info_gained + s.novelty.sessions_no_info_gained} color="bg-blue-500" label="Yeni bilgi edinen oturum" />
                                <Bar value={s.novelty.sessions_no_info_gained} max={s.novelty.sessions_info_gained + s.novelty.sessions_no_info_gained} color="bg-gray-500" label="Yeni bilgi edinmeyen oturum" />
                            </Card>

                            {/* Overall Alignment */}
                            <Card title="Genel Uyum" icon="🤝">
                                {(() => {
                                    const total = Object.values(s.overall_alignment).reduce((a, b) => a + b, 0);
                                    const labels: Record<string, string> = { aligned: 'Örtüşüyor', partially_aligned: 'Kısmen', not_aligned: 'Örtüşmüyor' };
                                    const colors: Record<string, string> = { aligned: 'bg-green-500', partially_aligned: 'bg-yellow-500', not_aligned: 'bg-red-500' };
                                    return Object.entries(s.overall_alignment).map(([key, val]) => (
                                        <Bar key={key} value={val} max={total} color={colors[key] || 'bg-gray-500'} label={labels[key] || key} />
                                    ));
                                })()}
                            </Card>

                            {/* False Negatives */}
                            <Card title="Kaçırılan Etkileşimler (False Negatives)" icon="🔍">
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="bg-white/5 rounded-lg p-3 text-center">
                                        <div className="text-xl font-bold text-white">{s.false_negatives.sessions_with_missed}</div>
                                        <div className="text-[10px] text-white/40">Kaçırılan Oturum</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3 text-center">
                                        <div className="text-xl font-bold text-white"><Pct v={s.false_negatives.rate} /></div>
                                        <div className="text-[10px] text-white/40">Kaçırma Oranı</div>
                                    </div>
                                </div>
                                {s.false_negatives.details.length > 0 ? (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {s.false_negatives.details.map((d, i) => (
                                            <div key={i} className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 text-xs text-white/70">
                                                {d.details && <p>{d.details}</p>}
                                                {d.drugs && <p className="text-red-300/80 mt-1">İlaçlar: {d.drugs.join(', ')}</p>}
                                                {d.severity && <span className="text-[10px] text-red-300/60">Şiddet: {d.severity}</span>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-white/20 text-sm text-center py-2">Kaçırılan etkileşim bildirilmedi</p>
                                )}
                            </Card>
                        </div>
                    </>
                )}

                {/* ══════════════════ TAB: IMPACT ══════════════════ */}
                {tab === 'impact' && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Metric icon="📝" label="Reçete Değiştiren" value={s.decision_impact.prescription_changed} />
                            <Metric icon="📋" label="Değiştirmeyen" value={s.decision_impact.prescription_not_changed} />
                            <Metric icon="📈" label="Değişim Oranı" value={s.decision_impact.change_rate !== null ? `${(s.decision_impact.change_rate * 100).toFixed(1)}` : null} suffix="%" />
                            <Metric icon="⏱" label="Ort. Değerlendirme Süresi" value={s.avg_time_spent_seconds !== null ? `${Math.round(s.avg_time_spent_seconds)}` : null} suffix="sn" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Actions Taken */}
                            <Card title="Alınan Klinik Aksiyonlar" icon="⚡">
                                {Object.keys(s.actions_taken).length > 0 ? (
                                    (() => {
                                        const total = Object.values(s.actions_taken).reduce((a, b) => a + b, 0);
                                        return Object.entries(s.actions_taken)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([action, count]) => (
                                                <Bar key={action} value={count} max={total} color="bg-blue-500" label={ACTION_LABELS[action] || action} />
                                            ));
                                    })()
                                ) : (
                                    <p className="text-white/20 text-sm text-center py-4">Henüz veri yok</p>
                                )}
                            </Card>

                            {/* Change Types */}
                            <Card title="Değişiklik Türleri" icon="🔄">
                                {Object.keys(s.decision_impact.change_types).length > 0 ? (
                                    (() => {
                                        const total = Object.values(s.decision_impact.change_types).reduce((a, b) => a + b, 0);
                                        return Object.entries(s.decision_impact.change_types).map(([type, count]) => (
                                            <Bar key={type} value={count} max={total} color="bg-purple-500" label={CHANGE_TYPE_LABELS[type] || type} />
                                        ));
                                    })()
                                ) : (
                                    <p className="text-white/20 text-sm text-center py-4">Henüz veri yok</p>
                                )}
                            </Card>

                            {/* Change Triggers */}
                            <Card title="Değişiklik Tetikleyicileri" icon="⚠️">
                                {Object.keys(s.decision_impact.change_triggers).length > 0 ? (
                                    (() => {
                                        const total = Object.values(s.decision_impact.change_triggers).reduce((a, b) => a + b, 0);
                                        return Object.entries(s.decision_impact.change_triggers).map(([trigger, count]) => (
                                            <Bar key={trigger} value={count} max={total} color="bg-orange-500" label={TRIGGER_LABELS[trigger] || trigger} />
                                        ));
                                    })()
                                ) : (
                                    <p className="text-white/20 text-sm text-center py-4">Henüz veri yok</p>
                                )}
                            </Card>

                            {/* No Change Reasons */}
                            <Card title="Değiştirmeme Nedenleri" icon="🚫">
                                {Object.keys(s.decision_impact.no_change_reasons).length > 0 ? (
                                    (() => {
                                        const total = Object.values(s.decision_impact.no_change_reasons).reduce((a, b) => a + b, 0);
                                        return Object.entries(s.decision_impact.no_change_reasons).map(([reason, count]) => (
                                            <Bar key={reason} value={count} max={total} color="bg-gray-500" label={NO_CHANGE_LABELS[reason] || reason} />
                                        ));
                                    })()
                                ) : (
                                    <p className="text-white/20 text-sm text-center py-4">Henüz veri yok</p>
                                )}
                            </Card>
                        </div>
                    </>
                )}

                {/* ══════════════════ TAB: TRUST ══════════════════ */}
                {tab === 'trust' && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <Metric icon="💊" label="Klinik Fayda" value={s.session_scores.avg_benefit} suffix="/5" />
                            <Metric icon="🔒" label="Güven" value={s.session_scores.avg_trust} suffix="/5" />
                            <Metric icon="📝" label="Açıklama Kalitesi" value={s.session_scores.avg_explanation} suffix="/5" />
                            <Metric icon="📊" label="Tavsiye Skoru" value={s.session_scores.avg_recommendation} suffix="/10" />
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                <div className="text-2xl mb-1">🏆</div>
                                <div className={`text-2xl font-bold ${s.session_scores.nps !== null
                                    ? s.session_scores.nps >= 50 ? 'text-green-400'
                                        : s.session_scores.nps >= 0 ? 'text-yellow-400'
                                            : 'text-red-400'
                                    : 'text-white'
                                    }`}>
                                    {s.session_scores.nps !== null ? s.session_scores.nps : '—'}
                                </div>
                                <div className="text-xs text-white/50 mt-1">NPS Skoru</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Usability: Response Time */}
                            <Card title="Yanıt Süresi Değerlendirmesi" icon="⚡">
                                <Bar
                                    value={s.usability.response_time_acceptable}
                                    max={s.usability.response_time_acceptable + s.usability.response_time_not_acceptable}
                                    color="bg-green-500"
                                    label="Kabul edilebilir"
                                />
                                <Bar
                                    value={s.usability.response_time_not_acceptable}
                                    max={s.usability.response_time_acceptable + s.usability.response_time_not_acceptable}
                                    color="bg-red-500"
                                    label="Yavaş"
                                />
                            </Card>

                            {/* Usability: Completeness */}
                            <Card title="Bilgi Yeterliliği" icon="📄">
                                {(() => {
                                    const total = Object.values(s.usability.information_completeness).reduce((a, b) => a + b, 0);
                                    const labels: Record<string, string> = { complete: 'Tam', mostly_complete: 'Çoğunlukla Tam', incomplete: 'Eksik' };
                                    const colors: Record<string, string> = { complete: 'bg-green-500', mostly_complete: 'bg-yellow-500', incomplete: 'bg-red-500' };
                                    return Object.entries(s.usability.information_completeness).map(([key, val]) => (
                                        <Bar key={key} value={val} max={total} color={colors[key] || 'bg-gray-500'} label={labels[key] || key} />
                                    ));
                                })()}
                            </Card>
                        </div>

                        {/* Context */}
                        <div className="grid grid-cols-2 gap-4">
                            <Metric icon="👤" label="Ort. Hasta Yaşı" value={s.context_summary.avg_patient_age} />
                            <Metric icon="💊" label="Ort. İlaç Sayısı" value={s.context_summary.avg_total_medications} />
                        </div>
                    </>
                )}

                {/* ══════════════════ TAB: QUALITY ══════════════════ */}
                {tab === 'quality' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Alternatif Önerilerin Uygunluğu" icon="💊">
                            {(() => {
                                const total = Object.values(s.alternatives_quality).reduce((a, b) => a + b, 0);
                                const labels: Record<string, string> = { yes: 'Uygun', partial: 'Kısmen', no: 'Uygun Değil', na: 'Yok' };
                                const colors: Record<string, string> = { yes: 'bg-green-500', partial: 'bg-yellow-500', no: 'bg-red-500', na: 'bg-gray-400' };
                                return Object.entries(s.alternatives_quality).map(([key, val]) => (
                                    <Bar key={key} value={val} max={total} color={colors[key] || 'bg-gray-500'} label={labels[key] || key} />
                                ));
                            })()}
                        </Card>

                        <Card title="İzlem Planı Uygunluğu" icon="📋">
                            {(() => {
                                const total = Object.values(s.monitoring_quality).reduce((a, b) => a + b, 0);
                                const labels: Record<string, string> = { yes: 'Uygun', partial: 'Kısmen', no: 'Uygun Değil', na: 'Yok' };
                                const colors: Record<string, string> = { yes: 'bg-green-500', partial: 'bg-yellow-500', no: 'bg-red-500', na: 'bg-gray-400' };
                                return Object.entries(s.monitoring_quality).map(([key, val]) => (
                                    <Bar key={key} value={val} max={total} color={colors[key] || 'bg-gray-500'} label={labels[key] || key} />
                                ));
                            })()}
                        </Card>
                    </div>
                )}

                {/* ══════════════════ TAB: QUALITATIVE ══════════════════ */}
                {tab === 'qualitative' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card title="En Faydalı Özellikler" icon="⭐">
                            {s.qualitative.useful_features.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {s.qualitative.useful_features.map((t, i) => (
                                        <div key={i} className="bg-green-500/5 border border-green-500/10 rounded-lg p-2.5 text-sm text-white/70">{t}</div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-white/20 text-sm text-center py-8">Henüz yorum yok</p>
                            )}
                        </Card>

                        <Card title="İyileştirme Önerileri" icon="🔧">
                            {s.qualitative.improvement_suggestions.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {s.qualitative.improvement_suggestions.map((t, i) => (
                                        <div key={i} className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-2.5 text-sm text-white/70">{t}</div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-white/20 text-sm text-center py-8">Henüz öneri yok</p>
                            )}
                        </Card>

                        <Card title="Serbest Yorumlar" icon="💬">
                            {s.qualitative.free_comments.length > 0 ? (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {s.qualitative.free_comments.map((t, i) => (
                                        <div key={i} className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-2.5 text-sm text-white/70 italic">&ldquo;{t}&rdquo;</div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-white/20 text-sm text-center py-8">Henüz yorum yok</p>
                            )}
                        </Card>
                    </div>
                )}

            </div>
        </div>
    );
}
