import React, { useState } from 'react';
import { Server, CheckCircle2, XCircle, Loader, Info, FileText, Shield, BookOpen } from 'lucide-react';
import apiService, { API_BASE_URL } from '../../services/apiService';
import { useI18n } from '../../services/i18nService';

export const AboutSettings: React.FC = () => {
  const { t } = useI18n();
  const [connectionStatus, setConnectionStatus] = useState<{
    testing: boolean;
    status: 'idle' | 'success' | 'error';
    message: string;
  }>({ testing: false, status: 'idle', message: '' });

  const handleTestConnection = async () => {
    setConnectionStatus({ testing: true, status: 'idle', message: t('about.testing') });
    try {
      const result = await apiService.testConnection();
      if (result.status === 'ok') {
        const dbStatusMap: Record<string, string> = {
          connected: t('about.connected'),
          error: t('about.error'),
        };
        const dbStatus = dbStatusMap[result.database] || t('about.disconnected');
        setConnectionStatus({
          testing: false,
          status: 'success',
          message: t('about.backendRunning') + dbStatus,
        });
      } else {
        setConnectionStatus({
          testing: false,
          status: 'error',
          message: result.error || t('about.connectFailed'),
        });
      }
    } catch (error: any) {
      setConnectionStatus({
        testing: false,
        status: 'error',
        message: error.message || t('about.connectFailed'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-surface-text mb-1">{t('about.title')}</h2>
        <p className="text-xs text-surface-text/50">{t('about.subtitle')}</p>
      </div>

      {/* Version */}
      <section className="bg-surface-text/5 p-4 rounded-xl space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-surface-text/60" />
          <span className="text-sm font-bold text-surface-text">Forsion Desktop</span>
        </div>
        <div className="text-xs text-surface-text/50 space-y-1">
          <div>{t('about.version')}</div>
          <div>{t('about.techStack')}</div>
        </div>
      </section>

      {/* Backend Connection */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-surface-text/50">{t('about.backendConnection')}</h3>
        <div className="bg-surface-text/5 p-4 rounded-xl space-y-3">
          <button
            onClick={handleTestConnection}
            disabled={connectionStatus.testing}
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {connectionStatus.testing ? (
              <><Loader size={14} className="animate-spin" /><span>{t('about.testing')}</span></>
            ) : (
              <><Server size={14} /><span>{t('about.testConnection')}</span></>
            )}
          </button>

          {connectionStatus.message && (
            <div className={`flex items-center gap-2 text-xs p-3 rounded-lg ${
              connectionStatus.status === 'success'
                ? 'bg-accent/15 text-accent'
                : connectionStatus.status === 'error'
                ? 'bg-red-500/15 text-surface-text'
                : 'bg-accent/10 text-surface-text/70'
            }`}>
              {connectionStatus.status === 'success' && <CheckCircle2 size={14} />}
              {connectionStatus.status === 'error' && <XCircle size={14} />}
              <span>{connectionStatus.message}</span>
            </div>
          )}
        </div>
      </section>

      {/* Documentation Links */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-surface-text/50">{t('about.documentation')}</h3>
        <div className="bg-surface-text/5 p-4 rounded-xl space-y-3">
          <a href={`${API_BASE_URL}/docs/terms`} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 text-sm text-accent hover:underline transition-colors">
            <FileText size={14} />
            <span>{t('about.termsOfService')}</span>
          </a>
          <a href={`${API_BASE_URL}/docs/privacy`} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 text-sm text-accent hover:underline transition-colors">
            <Shield size={14} />
            <span>{t('about.privacyPolicy')}</span>
          </a>
          <a href={`${API_BASE_URL}/docs/desk`} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-2 text-sm text-accent hover:underline transition-colors">
            <BookOpen size={14} />
            <span>{t('about.deskGuide')}</span>
          </a>
        </div>
      </section>
    </div>
  );
};
