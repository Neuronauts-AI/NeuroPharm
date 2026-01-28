'use client';

import { useState, useRef, useEffect } from 'react';
import { AnalysisResponse, Patient } from '@/types';

interface AnalysisChatProps {
    analysisResult: AnalysisResponse;
    patient: Patient | null;
    medicines: any[];
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function AnalysisChat({ analysisResult, patient, medicines }: AnalysisChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Prepare context for the backend
            const simplifyAnalysis = (result: AnalysisResponse) => ({
                risk_score: result.risk_score,
                summary: result.clinical_summary,
                interactions: result.interaction_details?.map(i => ({
                    drugs: i.drugs,
                    severity: i.severity,
                    mechanism: i.mechanism
                })),
                alternatives: result.alternatives?.map(a => ({
                    original: a.original_drug,
                    suggested: a.suggested_alternative
                }))
            });

            const simplifyPatient = (p: Patient | null) => p ? {
                age: p.age,
                gender: p.gender,
                conditions: p.conditions,
                medications: medicines.map(m => m.name)
            } : {};

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    context: simplifyAnalysis(analysisResult),
                    patient_info: simplifyPatient(patient),
                    history: messages.map(m => ({ role: m.role, content: m.content }))
                }),
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply
            };

            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="mt-8 bg-gradient-to-br from-gray-900/90 via-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl border border-white/10 overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Analiz Asistanı</h3>
                        <p className="text-sm text-white/60">Sonuçlarla ilgili sorularınızı sorun</p>
                    </div>
                </div>
            </div>

            <div className="h-[400px] overflow-y-auto p-6 space-y-4 bg-black/20">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                            <span className="text-3xl">👋</span>
                        </div>
                        <div>
                            <p className="text-white font-medium">Nasıl yardımcı olabilirim?</p>
                            <p className="text-sm text-white/50 mt-1">Örnek: "Bu etkileşim neden önemli?" veya "Alternatif ilacı nasıl kullanmalıyım?"</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] px-5 py-3 rounded-2xl ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white/10 text-white/90 rounded-bl-none border border-white/5'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                            </div>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 rounded-2xl px-5 py-4 rounded-bl-none border border-white/5 flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Bir soru sorun..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-6 rounded-xl font-medium transition-colors flex items-center justify-center"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
