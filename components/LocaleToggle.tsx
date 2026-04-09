import React, { useState } from 'react';
import { useI18n } from '../services/i18nService';

export const LocaleToggle: React.FC = () => {
  const { locale, setLocale } = useI18n();
  const [hovered, setHovered] = useState(false);

  const toggle = () => setLocale(locale === 'zh' ? 'en' : 'zh');

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 32,
        minWidth: 32,
        paddingLeft: 8,
        paddingRight: 8,
        borderRadius: 'var(--radius-pill)',
        border: `1px solid ${hovered ? 'var(--ui-primary)' : 'var(--ui-border-sub)'}`,
        background: hovered ? 'var(--ui-primary-tint)' : 'var(--ui-surface-sub)',
        color: hovered ? 'var(--ui-primary)' : 'var(--ui-text-muted)',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        transition: `all var(--dur-fast) var(--ease-apple)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title={locale === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      {locale === 'zh' ? 'EN' : '中'}
    </button>
  );
};
