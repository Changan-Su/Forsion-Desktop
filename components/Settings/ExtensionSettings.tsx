import React from 'react';
import { Download, BookOpen, Puzzle, Chrome } from 'lucide-react';
import { API_BASE_URL } from '../../services/apiService';
import { useI18n } from '../../services/i18nService';

export const ExtensionSettings: React.FC = () => {
  const { t } = useI18n();

  const steps = [
    t('extension.step1'),
    t('extension.step2'),
    t('extension.step3'),
    t('extension.step4'),
    t('extension.step5'),
  ];

  const features = [
    t('extension.feature1'),
    t('extension.feature2'),
    t('extension.feature3'),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-surface-text mb-1">{t('extension.title')}</h2>
        <p className="text-xs text-surface-text/50">{t('extension.subtitle')}</p>
      </div>

      {/* Hero card */}
      <section className="bg-surface-text/5 p-5 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
            <Puzzle size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-surface-text">Forsion Launcher</div>
            <div className="text-xs text-surface-text/60 mt-1 leading-relaxed">
              {t('extension.heroDesc')}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-surface-text/50">
              <Chrome size={12} />
              <span>{t('extension.compat')}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <a
            href="/downloads/forsion-launcher.zip"
            download="forsion-launcher.zip"
            className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:brightness-110 transition-all text-sm font-medium"
          >
            <Download size={14} />
            <span>{t('about.extensionDownload')}</span>
          </a>
          <a
            href={`${API_BASE_URL}/docs/desk#browser-extension`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-accent hover:underline transition-colors"
          >
            <BookOpen size={14} />
            <span>{t('extension.fullGuide')}</span>
          </a>
        </div>
      </section>

      {/* Features */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-surface-text/50">
          {t('extension.features')}
        </h3>
        <div className="bg-surface-text/5 p-4 rounded-xl space-y-2.5">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <span className="text-xs text-surface-text/80 leading-relaxed">{feature}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Install steps */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-surface-text/50">
          {t('extension.installSteps')}
        </h3>
        <div className="bg-surface-text/5 p-4 rounded-xl space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-accent/15 text-accent text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <span className="text-xs text-surface-text/80 leading-relaxed pt-0.5">{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Note */}
      <section className="bg-surface-text/5 p-4 rounded-xl border-l-2 border-accent/40">
        <div className="text-xs text-surface-text/70 leading-relaxed">
          <span className="font-bold text-surface-text">{t('extension.noteTitle')}</span>
          {t('extension.noteBody')}
        </div>
      </section>
    </div>
  );
};
