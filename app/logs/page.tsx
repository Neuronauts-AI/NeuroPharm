'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle, FileText, Activity, Database, Brain, Sparkles } from 'lucide-react';

interface LogFile {
    filename: string;
    timestamp: string;
    endpoint: string;
    method: string;
}

interface PipelineStep {
    step: number;
    name: string;
    description: string;
    input: any;
    output: any;
    processing_time_ms: number;
}

interface LogDetail {
    log_id: string;
    timestamp: string;
    endpoint: string;
    method: string;
    client: {
        ip: string;
        user_agent: string;
    };
    request: any;
    pipeline: PipelineStep[];
    response: any;
    status_code: number;
    processing_time_ms: number;
}

export default function LogsPage() {
    const [logs, setLogs] = useState<LogFile[]>([]);
    const [selectedLog, setSelectedLog] = useState<LogDetail | null>(null);
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await fetch('/api/logs');
            const data = await response.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogDetail = async (filename: string) => {
        try {
            const response = await fetch(`/api/logs/${filename}`);
            const data = await response.json();
            setSelectedLog(data);
            setExpandedSteps(new Set([0, 1, 2, 3])); // Expand all steps by default
        } catch (error) {
            console.error('Failed to fetch log detail:', error);
        }
    };

    const toggleStep = (step: number) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(step)) {
            newExpanded.delete(step);
        } else {
            newExpanded.add(step);
        }
        setExpandedSteps(newExpanded);
    };

    const getStepIcon = (stepNumber: number) => {
        switch (stepNumber) {
            case 0:
                return <Database className="w-5 h-5 text-blue-500" />;
            case 1:
                return <Activity className="w-5 h-5 text-green-500" />;
            case 2:
                return <Brain className="w-5 h-5 text-purple-500" />;
            case 3:
                return <Sparkles className="w-5 h-5 text-yellow-500" />;
            default:
                return <FileText className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatJson = (obj: any) => {
        return JSON.stringify(obj, null, 2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        📋 Backend Logs
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Tüm analiz isteklerinin detaylı pipeline logları
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Log List */}
                    <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                            Log Dosyaları ({logs.length})
                        </h2>
                        <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                            {logs.map((log) => (
                                <button
                                    key={log.filename}
                                    onClick={() => fetchLogDetail(log.filename)}
                                    className={`w-full text-left p-4 rounded-lg transition-all ${selectedLog?.log_id === log.filename.split('__')[1]?.split('.')[0]
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 text-xs rounded font-medium ${log.endpoint === '/analyze'
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                                    }`}>
                                                    {log.method}
                                                </span>
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    {log.endpoint}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <Clock className="w-3 h-3" />
                                                {log.timestamp}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    Henüz log bulunmuyor
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Log Detail */}
                    <div className="lg:col-span-2">
                        {selectedLog ? (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                                {/* Header */}
                                <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Log Detayı
                                        </h2>
                                        <div className="flex items-center gap-2">
                                            {selectedLog.status_code === 200 ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-red-500" />
                                            )}
                                            <span className={`font-semibold ${selectedLog.status_code === 200
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {selectedLog.status_code}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Zaman:</span>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {new Date(selectedLog.timestamp).toLocaleString('tr-TR')}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Toplam Süre:</span>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {selectedLog.processing_time_ms ? selectedLog.processing_time_ms.toFixed(2) : '0.00'} ms
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Client IP:</span>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {selectedLog.client.ip}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">User Agent:</span>
                                            <div className="font-medium text-gray-900 dark:text-white truncate">
                                                {selectedLog.client.user_agent}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Pipeline Steps */}
                                <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                        Pipeline Adımları
                                    </h3>

                                    {selectedLog.pipeline?.map((step) => (
                                        <div
                                            key={step.step}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                                        >
                                            <button
                                                onClick={() => toggleStep(step.step)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {getStepIcon(step.step)}
                                                    <div className="text-left">
                                                        <div className="font-semibold text-gray-900 dark:text-white">
                                                            Step {step.step}: {step.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {step.description}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                        {step.processing_time_ms ? step.processing_time_ms.toFixed(2) : '0.00'} ms
                                                    </span>
                                                    {expandedSteps.has(step.step) ? (
                                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                            </button>

                                            {expandedSteps.has(step.step) && (
                                                <div className="p-4 bg-white dark:bg-gray-800 space-y-4">
                                                    {/* Input */}
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                            📥 Input
                                                        </h4>
                                                        <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto text-gray-800 dark:text-gray-200">
                                                            {formatJson(step.input)}
                                                        </pre>
                                                    </div>

                                                    {/* Output */}
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                            📤 Output
                                                        </h4>
                                                        <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto max-h-96 text-gray-800 dark:text-gray-200">
                                                            {formatJson(step.output)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
                                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    Log Seçin
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Detayları görmek için soldaki listeden bir log seçin
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
