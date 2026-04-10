import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, FolderPlus, Link, Upload, Shuffle, Loader } from 'lucide-react';
import { useI18n } from '../services/i18nService';
import apiService from '../services/apiService';
import type { LaunchpadBookmark, LaunchpadFolder } from '../types';

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBookmark: (bookmark: LaunchpadBookmark) => void;
  onAddFolder: (folder: LaunchpadFolder) => void;
  editBookmark?: LaunchpadBookmark | null;
}

type Tab = 'bookmark' | 'folder';

const RANDOM_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1'];

function randomLetterIcon(name: string): string {
  const letter = (name || '?')[0].toUpperCase();
  const color = RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
  const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="${color}" rx="15"/><text x="50" y="62" text-anchor="middle" font-size="48" font-weight="bold" fill="white" font-family="Inter,sans-serif">${letter}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function getDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}

export const AddItemDialog: React.FC<AddItemDialogProps> = ({ isOpen, onClose, onAddBookmark, onAddFolder, editBookmark }) => {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('bookmark');

  // Bookmark fields
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [iconPreview, setIconPreview] = useState('');
  const [fetching, setFetching] = useState(false);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Folder fields
  const [folderName, setFolderName] = useState('');

  // Pre-fill when editing
  useEffect(() => {
    if (editBookmark) {
      setTab('bookmark');
      setUrl(editBookmark.url);
      setTitle(editBookmark.name);
      setIconUrl(editBookmark.icon || '');
      setIconPreview(editBookmark.icon || '');
    }
  }, [editBookmark]);

  // Auto-fetch title and favicon from backend when URL changes (debounced)
  useEffect(() => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    if (!url.trim() || !getDomain(url).includes('.')) {
      setIconPreview('');
      return;
    }

    fetchTimerRef.current = setTimeout(async () => {
      setFetching(true);
      try {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        const meta = await apiService.get<{ title: string; favicon: string }>(
          `/api/wallpaper/url-meta?url=${encodeURIComponent(fullUrl)}`
        );
        if (meta.title && !title) setTitle(meta.title);
        if (meta.favicon) {
          setIconPreview(meta.favicon);
          if (!iconUrl) setIconUrl(meta.favicon);
        }
      } catch {
        // Fallback: use DuckDuckGo icon
        const domain = getDomain(url);
        const fallback = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
        setIconPreview(fallback);
        if (!iconUrl) setIconUrl(fallback);
      } finally {
        setFetching(false);
      }
    }, 600);

    return () => { if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current); };
  }, [url]);

  const reset = () => {
    setUrl('');
    setTitle('');
    setIconUrl('');
    setIconPreview('');
    setFolderName('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAddBookmark = () => {
    if (!url.trim()) return;
    const domain = getDomain(url);
    const finalTitle = title.trim() || domain;
    const finalIcon = iconUrl.trim() || randomLetterIcon(finalTitle);
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    const bookmark: LaunchpadBookmark = {
      id: editBookmark?.id || ('bookmark-' + Date.now()),
      type: 'bookmark',
      name: finalTitle,
      url: fullUrl,
      icon: finalIcon,
    };
    onAddBookmark(bookmark);
    reset();
    onClose();
  };

  const handleAddFolder = () => {
    const name = folderName.trim() || t('launchpad.folder.defaultName');
    const folder: LaunchpadFolder = {
      id: 'folder-' + Date.now(),
      type: 'folder',
      name,
      children: [],
    };
    onAddFolder(folder);
    reset();
    onClose();
  };

  const handleRandomIcon = () => {
    const name = title.trim() || getDomain(url) || '?';
    setIconUrl(randomLetterIcon(name));
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setIconUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10001] flex items-center justify-center"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-[380px] rounded-2xl shadow-2xl overflow-hidden text-surface-text"
            style={{ background: 'var(--ui-surface)', backdropFilter: 'var(--backdrop-glass)', WebkitBackdropFilter: 'var(--backdrop-glass)', border: '1px solid var(--ui-border-sub)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-text/10">
              <div className="flex gap-1">
                <button
                  onClick={() => setTab('bookmark')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tab === 'bookmark' ? 'bg-accent/15 text-accent' : 'text-surface-text/50 hover:text-surface-text'
                  }`}
                >
                  <Globe size={14} className="inline mr-1.5" />
                  {t('launchpad.addBookmark')}
                </button>
                <button
                  onClick={() => setTab('folder')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tab === 'folder' ? 'bg-accent/15 text-accent' : 'text-surface-text/50 hover:text-surface-text'
                  }`}
                >
                  <FolderPlus size={14} className="inline mr-1.5" />
                  {t('launchpad.addFolder')}
                </button>
              </div>
              <button onClick={handleClose} className="w-7 h-7 rounded-full bg-surface-text/5 hover:bg-surface-text/10 flex items-center justify-center">
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {tab === 'bookmark' ? (
                <>
                  {/* URL */}
                  <div>
                    <label className="text-xs font-bold text-surface-text/60 mb-1.5 block">{t('launchpad.bookmark.url')}</label>
                    <div className="flex items-center gap-2 bg-surface-text/5 rounded-xl px-3 py-2 border border-surface-text/10 focus-within:border-accent/40 transition-colors">
                      <Link size={14} className="text-surface-text/40 flex-shrink-0" />
                      <input
                        type="text"
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 bg-transparent text-sm text-surface-text placeholder:text-surface-text/30 focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs font-bold text-surface-text/60 mb-1.5 block">{t('launchpad.bookmark.title')}</label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder={t('launchpad.bookmark.titlePlaceholder')}
                      className="w-full bg-surface-text/5 rounded-xl px-3 py-2 text-sm text-surface-text placeholder:text-surface-text/30 border border-surface-text/10 focus:border-accent/40 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="text-xs font-bold text-surface-text/60 mb-1.5 block">{t('launchpad.bookmark.icon')}</label>
                    <div className="flex items-center gap-3">
                      {/* Preview */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: 'var(--ui-surface)', border: '1px solid var(--ui-border-sub)' }}>
                        {fetching ? (
                          <Loader size={18} className="animate-spin text-surface-text/40" />
                        ) : (iconUrl || iconPreview) ? (
                          <img src={iconUrl || iconPreview} alt="" className="w-8 h-8 object-contain" onError={() => setIconUrl('')} />
                        ) : (
                          <Globe size={20} className="text-surface-text/30" />
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex gap-1.5 flex-wrap">
                        <label className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-surface-text/5 hover:bg-surface-text/10 text-[11px] font-medium text-surface-text/70 transition-colors flex items-center gap-1">
                          <Upload size={12} />
                          <span>{t('appearance.upload')}</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                        </label>
                        <button
                          onClick={handleRandomIcon}
                          className="px-2.5 py-1.5 rounded-lg bg-surface-text/5 hover:bg-surface-text/10 text-[11px] font-medium text-surface-text/70 transition-colors flex items-center gap-1"
                        >
                          <Shuffle size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleAddBookmark}
                    disabled={!url.trim()}
                    className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-bold transition-all hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {t('launchpad.addBookmark')}
                  </button>
                </>
              ) : (
                <>
                  {/* Folder name */}
                  <div>
                    <label className="text-xs font-bold text-surface-text/60 mb-1.5 block">{t('launchpad.folder.name')}</label>
                    <input
                      type="text"
                      value={folderName}
                      onChange={e => setFolderName(e.target.value)}
                      placeholder={t('launchpad.folder.defaultName')}
                      className="w-full bg-surface-text/5 rounded-xl px-3 py-2 text-sm text-surface-text placeholder:text-surface-text/30 border border-surface-text/10 focus:border-accent/40 focus:outline-none transition-colors"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleAddFolder}
                    className="w-full py-2.5 rounded-xl bg-accent text-white text-sm font-bold transition-all hover:bg-accent/90"
                  >
                    {t('launchpad.addFolder')}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
