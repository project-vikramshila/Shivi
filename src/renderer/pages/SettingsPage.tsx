import React, { useState, useEffect } from 'react';
import { useShiviAPI } from '@hooks/useShiviAPI';

const SettingsPage = () => {
  const [aiSettings, setAiSettings] = useState({
    enableGemini: false,
    localOnly: false,
    privacyLevel: 'moderate' as 'strict' | 'moderate' | 'relaxed'
  });
  const { api: shiviAPI, isReady } = useShiviAPI();

  useEffect(() => {
    const loadSettings = async () => {
      if (!isReady || !shiviAPI?.config?.get) {
        return;
      }
      try {
        const config = await shiviAPI.config.get();
        if (config.aiSettings) {
          setAiSettings(config.aiSettings);
        }
      } catch (error) {
        console.warn('Failed to load AI settings:', error);
      }
    };
    loadSettings();
  }, [isReady, shiviAPI]);

  const handleAiSettingChange = async (setting: string, value: boolean | string) => {
    const newSettings = { ...aiSettings, [setting]: value };
    setAiSettings(newSettings);
    if (!shiviAPI?.config?.set) {
      console.warn('Config API not available');
      return;
    }
    // Save to persistent storage
    try {
      const currentConfig = await shiviAPI.config.get();
      await shiviAPI.config.set({
        ...currentConfig,
        aiSettings: newSettings
      });
    } catch (error) {
      console.warn('Failed to save AI settings:', error);
    }
  };

  return (
    <section className="glass-card rounded-[32px] p-8 mb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-shivi-pink-200">Settings</p>
          <h1 className="text-3xl font-semibold text-white">System settings</h1>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-[#111827]/80 p-6 space-y-4">
        {/* AI Intelligence Settings */}
        <div className="rounded-2xl bg-shivi-dark-900 p-4 border border-white/5">
          <p className="font-semibold text-white mb-2">AI Intelligence Layer</p>
          <p className="text-white/70 mb-4">Control how Shivi uses local and cloud AI for enhanced responses.</p>
          <p className="text-yellow-400 text-sm mb-4">Note: To use Gemini, set GEMINI_API_KEY environment variable.</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Enable Gemini Enhancement</p>
                <p className="text-white/60 text-sm">Use Google Gemini for better Hindi fluency and emotional nuance</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.enableGemini}
                  onChange={(e) => handleAiSettingChange('enableGemini', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Local Only Mode</p>
                <p className="text-white/60 text-sm">Force all processing to stay local, no cloud AI</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.localOnly}
                  onChange={(e) => handleAiSettingChange('localOnly', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white">Privacy Level</p>
                <p className="text-white/60 text-sm">How strictly to filter data sent to cloud AI</p>
              </div>
              <select
                value={aiSettings.privacyLevel}
                onChange={(e) => handleAiSettingChange('privacyLevel', e.target.value as any)}
                className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
              >
                <option value="strict">Strict (Block sensitive)</option>
                <option value="moderate">Moderate (Sanitize)</option>
                <option value="relaxed">Relaxed (Allow most)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
            <p className="text-blue-300 text-sm">
              {aiSettings.localOnly ? '🟢 Local Mode' :
               aiSettings.enableGemini ? '✨ Gemini Enhanced' : '🔒 Local Only'}
            </p>
            <p className="text-blue-400 text-xs mt-1">
              {aiSettings.enableGemini ?
                'Responses may be enhanced with cloud AI for better quality' :
                'All processing stays local for maximum privacy'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-shivi-dark-900 p-4 border border-white/5">
          <p className="font-semibold text-white">Local configuration</p>
          <p className="text-white/70">Offline settings, preferences, and startup controls.</p>
        </div>
        <div className="rounded-2xl bg-shivi-dark-900 p-4 border border-white/5">
          <p className="font-semibold text-white">Security</p>
          <p className="text-white/70">Encrypted local storage, permission audit, and app controls.</p>
        </div>
      </div>
    </section>
  );
};

export default SettingsPage;
