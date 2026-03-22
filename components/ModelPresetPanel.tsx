'use client';

import { LLMPreset, LLMProvider, LLMModel } from '@/types';

interface ModelPresetPanelProps {
  provider: LLMProvider;
  model: LLMModel;
  presets: LLMPreset[];
  onProviderChange: (provider: LLMProvider) => void;
  onModelChange: (model: LLMModel) => void;
}

export default function ModelPresetPanel({
  provider,
  model,
  presets,
  onProviderChange,
  onModelChange,
}: ModelPresetPanelProps) {
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 mb-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground)]">LLM On Ayar Paneli</h3>
            <p className="text-xs text-[var(--text-muted)]">
              DeepSeek ve Qwen modellerinden birini secin; provider otomatik veya manuel olabilir.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="llm-provider" className="text-xs text-[var(--text-muted)]">
              Provider
            </label>
            <select
              id="llm-provider"
              value={provider}
              onChange={(e) => onProviderChange(e.target.value as LLMProvider)}
              className="text-sm bg-[var(--background)] border border-[var(--card-border)] rounded-md px-2 py-1.5 text-[var(--foreground)]"
            >
              <option value="auto">Auto</option>
              <option value="fal">Fal</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {presets.map((preset) => {
            const isActive = model === preset.model;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onModelChange(preset.model)}
                className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-[var(--card-border)] hover:border-blue-400/50'
                }`}
              >
                <div className="text-sm font-medium text-[var(--foreground)]">{preset.label}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">{preset.description}</div>
                <div className="text-[11px] text-blue-400 mt-1">{preset.model}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
