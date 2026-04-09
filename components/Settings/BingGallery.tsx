import React, { useState, useEffect } from 'react';
import { Loader, Sparkles, RefreshCw } from 'lucide-react';
import { fetchBingWallpapers, BingWallpaper } from '../../services/wallpaperService';
import { useI18n } from '../../services/i18nService';

interface BingGalleryProps {
  onSelectWallpaper: (wallpaperUrl: string) => void;
  selectedUrl?: string;
}

export const BingGallery: React.FC<BingGalleryProps> = ({ onSelectWallpaper, selectedUrl }) => {
  const { t } = useI18n();
  const [wallpapers, setWallpapers] = useState<BingWallpaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBingWallpapers();
      setWallpapers(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load wallpapers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && wallpapers.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-surface-text/40">
        <Loader size={16} className="animate-spin mr-2" />
        <span className="text-xs">{t('bing.loading')}</span>
      </div>
    );
  }

  if (error && wallpapers.length === 0) {
    return (
      <div className="text-xs text-center py-6 text-surface-text/40">
        <p>{error}</p>
        <button onClick={load} className="mt-2 text-accent hover:underline">{t('bing.retry')}</button>
      </div>
    );
  }

  if (wallpapers.length === 0) return null;

  const [today, ...rest] = wallpapers;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-surface-text/50">{t('bing.daily')}</h4>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-surface-text/10 transition-colors disabled:opacity-30 text-surface-text/50"
          title={t('bing.retry')}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Today's wallpaper — hero card */}
      <button
        onClick={() => onSelectWallpaper(today.url)}
        className={`relative w-full rounded-xl overflow-hidden group transition-all ring-2 ${
          selectedUrl === today.url ? 'ring-accent' : 'ring-transparent hover:ring-surface-text/20'
        }`}
      >
        <img
          src={today.thumbnailUrl}
          alt={today.title}
          className="w-full h-36 object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles size={10} className="text-amber-300" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">{t('bing.todaysPick')}</span>
          </div>
          <div className="text-xs font-bold text-white/90 truncate">{today.title}</div>
          <div className="text-[10px] text-white/50 truncate">{today.copyright}</div>
        </div>
      </button>

      {/* History grid */}
      {rest.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {rest.map((wp, i) => (
            <button
              key={i}
              onClick={() => onSelectWallpaper(wp.url)}
              className={`relative rounded-lg overflow-hidden group transition-all ring-2 ${
                selectedUrl === wp.url ? 'ring-accent' : 'ring-transparent hover:ring-surface-text/20'
              }`}
              title={wp.title}
            >
              <img
                src={wp.thumbnailUrl}
                alt={wp.title}
                className="w-full h-16 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <span className="text-[8px] text-white/90 font-bold opacity-0 group-hover:opacity-100 transition-opacity truncate px-1">
                  {wp.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
