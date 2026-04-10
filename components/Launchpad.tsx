import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, MoreVertical, Pin, PinOff, Trash, Plus, FolderOpen, Globe, Pencil, X } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { APPS, ICON_MAP } from '../constants';
import { AppId, ForsionApp, DesktopApp, LaunchpadBookmark, LaunchpadFolder, LaunchpadItem } from '../types';
import forsionDeskService, { getAppIconUrl } from '../services/forsionDeskService';
import launchpadOrderService from '../services/launchpadOrderService';
import dockOrderService from '../services/dockOrderService';
import { UninstallConfirmDialog } from './UninstallConfirmDialog';
import { useI18n } from '../services/i18nService';
import { getLaunchpadCols } from './Settings/LaunchpadSettings';
import { AddItemDialog } from './AddItemDialog';
import type { LaunchpadData } from '../services/launchpadOrderService';

// Forsion App Icon Component
interface ForsionAppIconProps {
  icon?: string;
  name: string;
  size?: number;
}

const ForsionAppIcon: React.FC<ForsionAppIconProps> = ({ icon, name, size = 24 }) => {
  const [iconError, setIconError] = useState(false);
  const iconUrl = getAppIconUrl(icon);

  if (iconUrl && !iconError) {
    return (
      <img 
        src={iconUrl} 
        alt={name}
        className="w-full h-full object-contain rounded-lg pointer-events-none"
        onError={() => setIconError(true)}
      />
    );
  }

  return <Package size={size} className="pointer-events-none" />;
};

// Draggable App Item Component
// Renders a single item's icon — size in px, fill mode stretches to fill container
const ItemIcon: React.FC<{ item: LaunchpadItem; size?: number; fill?: boolean; fit?: 'cover' | 'contain'; className?: string }> = ({
  item,
  size = 20,
  fill,
  fit = 'cover',
  className = '',
}) => {
  const s = fill ? '100%' : size;
  const r = fill ? '22%' : size * 0.2;
  if (isBookmark(item) && item.icon) {
    return <img src={item.icon} alt="" className={className} style={{ width: s, height: s, borderRadius: r, objectFit: fit }} />;
  }
  if (isForsionApp(item)) {
    const url = getAppIconUrl((item as ForsionApp).icon);
    if (url) return <img src={url} alt="" className={className} style={{ width: s, height: s, borderRadius: r, objectFit: fit }} />;
  }
  const iconEl = (item as DesktopApp).icon ? ICON_MAP[(item as DesktopApp).icon] : null;
  if (iconEl) return <div className={`flex items-center justify-center ${className}`} style={{ width: s, height: s }}>{iconEl}</div>;
  return <Globe size={fill ? '50%' : size * 0.7} className={`opacity-40 ${className}`} />;
};

// Folder preview: 2x2 grid of first 4 children's icons, sized by iconPx
const FolderPreview: React.FC<{
  folder: LaunchpadFolder;
  allItemsMap?: Map<string, LaunchpadItem>;
  iconPx?: number;
}> = ({ folder, allItemsMap, iconPx = 64 }) => {
  const children = folder.children.slice(0, 4)
    .map(id => allItemsMap?.get(id)).filter(Boolean) as LaunchpadItem[];

  if (children.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <FolderOpen size={Math.round(iconPx * 0.28)} style={{ color: 'var(--ui-text-muted)' }} className="opacity-40" />
      </div>
    );
  }

  const miniSize = Math.round(iconPx * 0.34);
  const pad = Math.round(iconPx * 0.13);
  const gap = Math.round(iconPx * 0.06);

  return (
    <div className="w-full h-full grid grid-cols-2 place-items-center"
      style={{ padding: pad, gap }}
    >
      {[0, 1, 2, 3].map(i => (
        <div key={i}
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: miniSize, height: miniSize,
            borderRadius: Math.round(miniSize * 0.22),
          }}
        >
          {children[i]
            ? <ItemIcon item={children[i]} size={miniSize} fit="contain" />
            : <div className="w-full h-full" style={{ background: 'var(--ui-border-sub)', opacity: 0.4 }} />
          }
        </div>
      ))}
    </div>
  );
};

interface FolderAnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ExpandedFolderState {
  id: string;
  anchorRect: FolderAnchorRect | null;
}

function toAnchorRect(rect?: DOMRect | null): FolderAnchorRect | null {
  if (!rect) return null;
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function getFolderPanelLayout(childCount: number, viewportWidth: number, viewportHeight: number) {
  const columns = childCount <= 1 ? 1 : childCount === 2 ? 2 : 3;
  const rows = Math.max(1, Math.ceil(Math.max(childCount, 1) / columns));
  const baseWidth = columns === 1 ? 220 : columns === 2 ? 304 : 404;
  const width = Math.min(baseWidth, viewportWidth - 48);
  const height = Math.min(Math.max(220, 112 + rows * 108), viewportHeight - 64);
  return { columns, width, height };
}

interface GridSizeConfig {
  container: string;
  icon: string;
  inner: string;
  gap: string;
  rounded: string;
}

interface DraggableAppProps {
  app: LaunchpadItem;
  isForsionApp: boolean;
  onLaunch: (anchorRect?: DOMRect | null) => void;
  onUninstall?: (app: ForsionApp) => void;
  onAddToDock?: (appId: string) => void;
  onRemoveFromDock?: (appId: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  gridSize: GridSizeConfig;
  cols: number;
  isMergeTarget?: boolean;
  allItemsMap?: Map<string, LaunchpadItem>;
}

const DraggableApp: React.FC<DraggableAppProps> = ({
  app,
  isForsionApp: isForsion,
  onLaunch,
  onUninstall,
  onAddToDock,
  onRemoveFromDock,
  onDelete,
  onEdit,
  gridSize,
  cols,
  isMergeTarget,
  allItemsMap,
}) => {
  const { t } = useI18n();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1 : 'auto',
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger launch if we haven't dragged and didn't click on menu
    if (!isDragging && !transform && !showMenu) {
      onLaunch(iconRef.current?.getBoundingClientRect());
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleAddToDock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToDock) {
      onAddToDock(app.id);
    }
    setShowMenu(false);
  };

  const handleRemoveFromDock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFromDock) {
      onRemoveFromDock(app.id);
    }
    setShowMenu(false);
  };

  const handleUninstall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isForsion && onUninstall) {
      onUninstall(app as ForsionApp);
    }
    setShowMenu(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const isPinned = dockOrderService.isPinned(app.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none cursor-grab active:cursor-grabbing"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex flex-col items-center gap-2.5 group ${gridSize.container} cursor-pointer relative`}>
        <div
          ref={iconRef}
          className={`${gridSize.icon} ${gridSize.rounded} flex items-center justify-center shadow-lg relative overflow-visible transition-all duration-300 group-hover:shadow-xl ring-0 group-hover:ring-2 ring-white/20 ${
            isMergeTarget ? 'ring-2 ring-accent scale-110' : ''
          } ${
            isForsion || isBookmark(app) || isFolder(app) || !(app as DesktopApp).color
              ? 'text-surface-text'
              : `text-white ${(app as DesktopApp).color}`
          }`}
          style={isForsion || isBookmark(app) || isFolder(app) || !(app as DesktopApp).color ? { background: 'var(--icon-surface)', backdropFilter: 'var(--backdrop-glass)', WebkitBackdropFilter: 'var(--backdrop-glass)', border: isMergeTarget ? '2px solid var(--color-primary)' : '1px solid var(--ui-border-sub)' } : undefined}
        >
          {!isForsion && !isBookmark(app) && !isFolder(app) && (app as DesktopApp).color && <div className={`absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity ${gridSize.rounded}`} />}
          {isFolder(app) ? (
            <div className="absolute inset-0 pointer-events-none">
              <FolderPreview folder={app} allItemsMap={allItemsMap} iconPx={GRID_PX[cols] ?? 64} />
            </div>
          ) : null}
          <div className={`${gridSize.inner} flex items-center justify-center pointer-events-none`}>
            {isFolder(app) ? null : isBookmark(app) ? (
              app.icon ? <img src={app.icon} alt={app.name} className="w-full h-full object-contain rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <Globe size={24} />
            ) : isForsion ? (
              <ForsionAppIcon icon={(app as ForsionApp).icon} name={app.name} size={24} />
            ) : (
              ICON_MAP[(app as DesktopApp).icon]
            )}
          </div>
          
          {/* Three dots menu button */}
          {isHovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleMenuClick}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white/80 hover:text-white transition-all z-10 pointer-events-auto backdrop-blur-sm"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <MoreVertical size={14} />
            </motion.button>
          )}

          {/* Menu dropdown */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full right-0 mt-2 w-40 bg-black/80 backdrop-blur-lg rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 pointer-events-auto"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Folders can't live on the dock — suppress the pin option. */}
                {!isFolder(app) && (!isPinned ? (
                  <button
                    onClick={handleAddToDock}
                    className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors"
                  >
                    <Pin size={14} />
                    <span>{t('launchpad.addToDock')}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRemoveFromDock}
                    className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors"
                  >
                    <PinOff size={14} />
                    <span>{t('launchpad.removeFromDock')}</span>
                  </button>
                ))}
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors"
                  >
                    <Pencil size={14} />
                    <span>{t('launchpad.edit')}</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
                  >
                    <Trash size={14} />
                    <span>{t('launchpad.delete')}</span>
                  </button>
                )}
                {isForsion && (
                  <button
                    onClick={handleUninstall}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
                  >
                    <Trash size={14} />
                    <span>{t('launchpad.uninstall')}</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="text-sm font-medium text-surface-text drop-shadow-md text-center leading-tight select-none pointer-events-none">
          {(app as DesktopApp).nameKey ? t((app as DesktopApp).nameKey!) : app.name}
        </span>
      </div>
    </div>
  );
};

// Sortable child item inside expanded folder (extracted to own component for hooks compliance)
const SortableFolderChild: React.FC<{
  child: LaunchpadItem;
  onLaunch: (id: string) => void;
  onClose: () => void;
}> = ({ child, onLaunch, onClose }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: child.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="flex flex-col items-center gap-2 group cursor-grab active:cursor-grabbing touch-none"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      onClick={() => {
        if (transform) return;
        if (isBookmark(child)) window.open(child.url, '_blank', 'noopener,noreferrer');
        else if (isForsionApp(child)) window.open((child as ForsionApp).url, '_blank', 'noopener,noreferrer');
        else onLaunch(child.id);
        onClose();
      }}
    >
      <div
        className="w-16 h-16 rounded-[18px] flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:scale-105 group-active:scale-95"
        style={{
          background: 'var(--icon-surface)',
          backdropFilter: 'var(--backdrop-glass)',
          WebkitBackdropFilter: 'var(--backdrop-glass)',
          border: '1px solid var(--ui-border-sub)',
        }}
      >
        <ItemIcon item={child} size={38} fit="contain" />
      </div>
      <span
        className="text-[11px] font-medium text-center leading-[1.25] w-full opacity-85"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {child.name}
      </span>
    </div>
  );
};

// App Preview for Drag Overlay
const AppPreview: React.FC<{ app: LaunchpadItem; allItemsMap?: Map<string, LaunchpadItem> }> = ({ app, allItemsMap }) => {
  const hasColor = !isForsionApp(app) && !isBookmark(app) && !isFolder(app) && (app as DesktopApp).color;
  return (
    <div className="flex flex-col items-center gap-3 w-24 opacity-95 scale-110 cursor-grabbing pointer-events-none">
      <div
        className={`w-20 h-20 rounded-[22px] flex items-center justify-center shadow-2xl relative overflow-hidden ring-2 ring-white/50 ${
          hasColor ? `text-white ${(app as DesktopApp).color}` : 'text-surface-text'
        }`}
        style={!hasColor ? { background: 'var(--icon-surface)', backdropFilter: 'var(--backdrop-glass)', WebkitBackdropFilter: 'var(--backdrop-glass)', border: '1px solid var(--ui-border-sub)' } : undefined}
      >
        {isFolder(app) ? (
          <FolderPreview folder={app} allItemsMap={allItemsMap} iconPx={80} />
        ) : (
          <ItemIcon item={app} size={40} fit="contain" />
        )}
      </div>
      <span className="text-sm font-bold text-white drop-shadow-lg text-center leading-tight">
        {app.name}
      </span>
    </div>
  );
};

// Type Guards and Helpers
function isForsionApp(item: LaunchpadItem): item is ForsionApp {
  return 'url' in item && !('type' in item);
}
function isBookmark(item: LaunchpadItem): item is LaunchpadBookmark {
  return 'type' in item && (item as any).type === 'bookmark';
}
function isFolder(item: LaunchpadItem): item is LaunchpadFolder {
  return 'type' in item && (item as any).type === 'folder';
}
function isDesktopApp(item: LaunchpadItem): item is DesktopApp {
  return !isForsionApp(item) && !isBookmark(item) && !isFolder(item);
}

function applyOrder(
  builtInApps: DesktopApp[],
  forsionApps: ForsionApp[],
  data: LaunchpadData
): LaunchpadItem[] {
  const all = new Map<string, LaunchpadItem>();
  builtInApps.forEach(a => all.set(a.id, a));
  forsionApps.forEach(a => all.set(a.id, a));
  Object.values(data.bookmarks).forEach(b => all.set(b.id, b));
  Object.values(data.folders).forEach(f => all.set(f.id, f));

  // Items in folders should not appear at top level
  const inFolder = new Set<string>();
  Object.values(data.folders).forEach(f => f.children.forEach(c => inFolder.add(c)));

  const ordered = data.order
    .filter(id => !inFolder.has(id))
    .map(id => all.get(id))
    .filter((item): item is LaunchpadItem => !!item);

  const inOrder = new Set(data.order);
  const newApps = [...builtInApps, ...forsionApps].filter(a => !inOrder.has(a.id) && !inFolder.has(a.id));

  // Insert new apps (never reordered) before bookmarks/folders, after existing apps
  if (newApps.length > 0) {
    const firstNonAppIdx = ordered.findIndex(item => isBookmark(item) || isFolder(item));
    if (firstNonAppIdx >= 0) {
      const result = [...ordered];
      result.splice(firstNonAppIdx, 0, ...newApps);
      return result;
    }
  }
  return [...ordered, ...newApps];
}

interface LaunchpadProps {
  onLaunch: (appId: AppId) => void;
  onLaunchForsionApp?: (app: ForsionApp) => void;
}

// Grid size config per column count
const GRID_CONFIG: Record<number, { container: string; icon: string; inner: string; gap: string; rounded: string }> = {
  4: { container: 'w-24', icon: 'w-20 h-20', inner: 'w-10 h-10', gap: '2rem', rounded: 'rounded-[22px]' },
  5: { container: 'w-20', icon: 'w-16 h-16', inner: 'w-8 h-8', gap: '1.5rem', rounded: 'rounded-[18px]' },
  6: { container: 'w-[72px]', icon: 'w-14 h-14', inner: 'w-7 h-7', gap: '1.25rem', rounded: 'rounded-[16px]' },
};

// Numeric pixel sizes for folder preview icon scaling
const GRID_PX: Record<number, number> = { 4: 80, 5: 64, 6: 56 };

export const Launchpad: React.FC<LaunchpadProps> = ({ onLaunch, onLaunchForsionApp }) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [forsionApps, setForsionApps] = useState<ForsionApp[]>([]);
  const [orderedApps, setOrderedApps] = useState<LaunchpadItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uninstallApp, setUninstallApp] = useState<ForsionApp | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<LaunchpadBookmark | null>(null);
  const [expandedFolder, setExpandedFolder] = useState<ExpandedFolderState | null>(null);
  // DnD folder merge state
  const [folderMergeTarget, setFolderMergeTarget] = useState<string | null>(null);
  const hoverTargetRef = useRef<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cols, setCols] = useState(getLaunchpadCols);

  // Listen for column changes from settings
  useEffect(() => {
    const handler = (e: CustomEvent) => setCols(e.detail.cols);
    window.addEventListener('launchpad-cols-changed', handler as EventListener);
    return () => window.removeEventListener('launchpad-cols-changed', handler as EventListener);
  }, []);

  const gridSize = GRID_CONFIG[cols] || GRID_CONFIG[5];
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags on click)
      },
    })
  );


  // Load installed Forsion Desk apps
  const loadForsionApps = useCallback(async () => {
    try {
      const installedApps = await forsionDeskService.getUserInstalledApps();
      const activeApps = installedApps.filter(app => app.isActive);
      setForsionApps(activeApps);
    } catch (error) {
      console.error('Failed to load Forsion Desk apps:', error);
    }
  }, []);

  useEffect(() => {
    loadForsionApps();

    const handleAppChange = () => {
      loadForsionApps();
    };

    window.addEventListener('forsion-app-installed', handleAppChange);
    window.addEventListener('forsion-app-uninstalled', handleAppChange);

    return () => {
      window.removeEventListener('forsion-app-installed', handleAppChange);
      window.removeEventListener('forsion-app-uninstalled', handleAppChange);
    };
  }, [loadForsionApps]);

  // Reload launchpad items
  const reloadItems = useCallback(() => {
    const builtInApps = APPS.filter(app => app.id !== 'launchpad');
    const data = launchpadOrderService.getData();
    const ordered = applyOrder(builtInApps, forsionApps, data);
    setOrderedApps(ordered);
  }, [forsionApps]);

  // Apply ordering whenever apps change; pull cloud data on first mount
  useEffect(() => {
    reloadItems();
    launchpadOrderService.pullFromCloud().then(changed => {
      if (changed) reloadItems();
    });
  }, [reloadItems]);

  // Filter items based on search query
  const displayedApps = orderedApps.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (isForsionApp(item) && item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (!expandedFolder) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedFolder(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedFolder]);

  const handleLaunch = (item: LaunchpadItem, anchorRect?: DOMRect | null) => {
    if (isFolder(item)) {
      setExpandedFolder(current => current?.id === item.id ? null : { id: item.id, anchorRect: toAnchorRect(anchorRect) });
      return;
    }
    if (isBookmark(item)) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (isForsionApp(item)) {
      if (onLaunchForsionApp) {
        onLaunchForsionApp(item);
      } else {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }
    } else {
      onLaunch(item.id);
    }
  };

  const handleAddBookmark = (bookmark: LaunchpadBookmark) => {
    launchpadOrderService.addBookmark(bookmark);
    reloadItems();
  };

  const handleAddFolder = (folder: LaunchpadFolder) => {
    launchpadOrderService.createFolder(folder);
    reloadItems();
  };

  const handleDeleteItem = (id: string) => {
    const item = orderedApps.find(a => a.id === id);
    if (!item) return;
    if (isBookmark(item)) {
      launchpadOrderService.removeBookmark(id);
      // Also drop from the Dock if pinned — otherwise a stale empty pin remains.
      if (dockOrderService.isPinned(id)) {
        dockOrderService.removePinnedApp(id);
        window.dispatchEvent(new CustomEvent('dock-apps-updated'));
      }
      reloadItems();
    } else if (isFolder(item)) {
      launchpadOrderService.removeFolder(id);
      reloadItems();
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setFolderMergeTarget(null);
    hoverTargetRef.current = null;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;
    const draggedItem = orderedApps.find(a => a.id === active.id);

    // Folder merge detection: hover over another item for 500ms
    if (over && over.id !== active.id) {
      const overItem = orderedApps.find(a => a.id === over.id);
      // Allow merging any two items into a folder
      if (overItem) {
        if (hoverTargetRef.current !== over.id) {
          hoverTargetRef.current = over.id as string;
          setFolderMergeTarget(null);
          if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
          hoverTimerRef.current = setTimeout(() => {
            setFolderMergeTarget(over.id as string);
          }, 350);
        }
        return;
      }
    }
    // Reset merge state
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTargetRef.current = null;
    setFolderMergeTarget(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const mergeTarget = folderMergeTarget;

    // Reset DnD state
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTargetRef.current = null;
    setFolderMergeTarget(null);

    // Folder merge: held over another item long enough
    if (mergeTarget && active.id !== mergeTarget) {
      const targetItem = orderedApps.find(a => a.id === mergeTarget);
      if (targetItem && isFolder(targetItem)) {
        // Add to existing folder
        launchpadOrderService.addToFolder(mergeTarget, active.id as string);
      } else {
        // Create new folder from two items
        launchpadOrderService.createFolderFromItems(active.id as string, mergeTarget);
      }
      reloadItems();
      setActiveId(null);
        return;
    }

    // Handle reordering
    if (over && active.id !== over.id) {
      const oldIndex = orderedApps.findIndex((i) => i.id === active.id);
      const newIndex = orderedApps.findIndex((i) => i.id === over.id);

      const newOrder = arrayMove(orderedApps, oldIndex, newIndex);
      setOrderedApps(newOrder);

      // Save order
      const orderIds = newOrder.map(a => a.id);
      launchpadOrderService.saveOrder(orderIds);
    }

    setActiveId(null);
  };

  const handleUninstallConfirm = async () => {
    if (!uninstallApp) return;
    
    try {
      await forsionDeskService.uninstallApp(uninstallApp.id);
      // Remove from dock if pinned
      dockOrderService.removePinnedApp(uninstallApp.id);
      window.dispatchEvent(new CustomEvent('forsion-app-uninstalled'));
    } catch (error) {
      console.error('Failed to uninstall app:', error);
    } finally {
      setUninstallApp(null);
    }
  };

  const handleAddToDock = (appId: string) => {
    dockOrderService.addPinnedApp(appId);
    // Dispatch event to notify Dock to refresh
    window.dispatchEvent(new CustomEvent('dock-apps-updated'));
  };

  const handleRemoveFromDock = (appId: string) => {
    dockOrderService.removePinnedApp(appId);
    // Dispatch event to notify Dock to refresh
    window.dispatchEvent(new CustomEvent('dock-apps-updated'));
  };


  const activeItem = activeId ? orderedApps.find(a => a.id === activeId) : null;

  // Build a map of all items for folder previews
  const allItemsMap = React.useMemo(() => {
    const map = new Map<string, LaunchpadItem>();
    orderedApps.forEach(item => map.set(item.id, item));
    // Also include items inside folders
    const data = launchpadOrderService.getData();
    for (const folder of Object.values(data.folders)) {
      for (const childId of folder.children) {
        if (!map.has(childId)) {
          const b = data.bookmarks[childId];
          if (b) map.set(childId, b);
        }
      }
    }
    // Include forsion apps that might be in folders
    forsionApps.forEach(a => { if (!map.has(a.id)) map.set(a.id, a); });
    APPS.forEach(a => { if (!map.has(a.id)) map.set(a.id, a); });
    return map;
  }, [orderedApps, forsionApps]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full flex flex-col relative">
          {/* Search Bar */}
          <div className="p-8 pb-4 flex justify-center">
            <div className="relative w-full max-w-sm group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-text/50 group-focus-within:text-surface-text transition-colors" />
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 bg-surface-text/5 rounded-2xl text-surface-text placeholder:text-surface-text/30 focus:outline-none focus:bg-surface-text/10 transition-all border border-surface-text/10 focus:border-surface-text/30"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-8 pt-4 scrollbar-hide">
            <SortableContext 
              items={displayedApps.map(a => a.id)} 
              strategy={rectSortingStrategy}
            >
              <div className="grid justify-items-center pb-24" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: gridSize.gap }}>
                {displayedApps.map((item) => (
                  <DraggableApp
                    key={item.id}
                    app={item}
                    isForsionApp={isForsionApp(item)}
                    onLaunch={(anchorRect) => handleLaunch(item, anchorRect)}
                    onUninstall={isForsionApp(item) ? (app) => setUninstallApp(app) : undefined}
                    onAddToDock={handleAddToDock}
                    onRemoveFromDock={handleRemoveFromDock}
                    onDelete={isBookmark(item) || isFolder(item) ? () => handleDeleteItem(item.id) : undefined}
                    onEdit={isBookmark(item) ? () => { setEditingBookmark(item as LaunchpadBookmark); setShowAddDialog(true); } : undefined}
                    gridSize={gridSize}
                    cols={cols}
                    isMergeTarget={folderMergeTarget === item.id}
                    allItemsMap={allItemsMap}
                  />
                ))}
                {/* Add button */}
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddDialog(true)}
                    className={`flex flex-col items-center gap-2.5 ${gridSize.container} cursor-pointer group`}
                  >
                    <div
                      className={`${gridSize.icon} ${gridSize.rounded} flex items-center justify-center text-surface-text/40 group-hover:text-surface-text/70 transition-all duration-300 group-hover:shadow-lg`}
                      style={{ background: 'var(--icon-surface)', backdropFilter: 'var(--backdrop-glass)', WebkitBackdropFilter: 'var(--backdrop-glass)', border: '2px dashed var(--ui-border-sub)' }}
                    >
                      <Plus size={24} />
                    </div>
                  </button>
                )}
              </div>
            </SortableContext>
          </div>

          {/* Expanded Folder Overlay — portaled to escape window transform context */}
          {createPortal(
          <AnimatePresence>
            {expandedFolder && (() => {
              const folder = orderedApps.find(a => a.id === expandedFolder.id);
              if (!folder || !isFolder(folder)) return null;
              const children = folder.children.map(id => allItemsMap.get(id)).filter(Boolean) as LaunchpadItem[];
              const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
              const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
              const { columns, width, height } = getFolderPanelLayout(children.length, viewportWidth, viewportHeight);
              const bodyHeight = height - 80;
              const anchorRect = expandedFolder.anchorRect;
              const anchorCenterX = anchorRect ? anchorRect.left + anchorRect.width / 2 : viewportWidth / 2;
              const anchorCenterY = anchorRect ? anchorRect.top + anchorRect.height / 2 : viewportHeight / 2;
              const initialScaleX = anchorRect ? Math.max(0.24, Math.min(1, anchorRect.width / width)) : 0.78;
              const initialScaleY = anchorRect ? Math.max(0.2, Math.min(1, anchorRect.height / height)) : 0.82;
              const initialX = anchorRect ? anchorCenterX - viewportWidth / 2 : 0;
              const initialY = anchorRect ? anchorCenterY - viewportHeight / 2 : 24;
              return (
                <React.Fragment key={expandedFolder.id}>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                    className="fixed inset-0 z-40 pointer-events-auto"
                    onClick={() => setExpandedFolder(null)}
                    style={{
                      background: 'rgba(0,0,0,0.18)',
                      backdropFilter: 'blur(20px) saturate(1.2)',
                      WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
                    }}
                  />

                  {/* Folder panel */}
                  <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10 pointer-events-none">
                    <motion.div
                      initial={{
                        opacity: 0,
                        scaleX: initialScaleX,
                        scaleY: initialScaleY,
                        x: initialX,
                        y: initialY,
                        borderRadius: anchorRect ? Math.max(18, Math.min(24, anchorRect.width * 0.35)) : 24,
                      }}
                      animate={{ opacity: 1, scaleX: 1, scaleY: 1, x: 0, y: 0, borderRadius: 24 }}
                      exit={{
                        opacity: 0,
                        scaleX: initialScaleX,
                        scaleY: initialScaleY,
                        x: initialX * 0.45,
                        y: initialY * 0.45,
                        borderRadius: anchorRect ? Math.max(18, Math.min(24, anchorRect.width * 0.35)) : 24,
                      }}
                      transition={{ type: 'spring', stiffness: 360, damping: 30, mass: 0.82 }}
                      className="pointer-events-auto"
                      onClick={e => e.stopPropagation()}
                    >
                      <div
                        className="relative overflow-hidden text-surface-text"
                        style={{
                          width,
                          height,
                          borderRadius: 24,
                          background: 'var(--ui-surface)',
                          backdropFilter: 'blur(40px) saturate(1.4)',
                          WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
                          border: '1px solid var(--ui-border)',
                          boxShadow: '0 24px 80px -16px rgba(0,0,0,0.25)',
                        }}
                      >
                        {/* Folder title */}
                        <div className="relative flex items-center justify-between px-5 pt-4 pb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 overflow-hidden"
                              style={{ background: 'var(--ui-surface-sub)', border: '1px solid var(--ui-border-sub)' }}
                            >
                              <FolderPreview folder={folder} allItemsMap={allItemsMap} iconPx={40} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-medium tracking-[0.2em] text-surface-text/40">
                                {children.length.toString().padStart(2, '0')}
                              </div>
                              <span className="block text-[17px] font-semibold tracking-tight truncate max-w-[220px]">
                                {folder.name || t('launchpad.folder.defaultName')}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => setExpandedFolder(null)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-surface-text/50 hover:text-surface-text/80 transition-colors"
                            style={{ background: 'var(--ui-border-sub)' }}
                            aria-label="Close folder"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        {/* Children grid — drag to remove from folder */}
                        <div className="relative px-4 pb-4" style={{ height: bodyHeight }}>
                          {children.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[12px] text-surface-text/35 text-center">
                              {t('market.noApps')}
                            </div>
                          ) : (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={rectIntersection}
                              onDragEnd={(e) => {
                                const { active, over } = e;
                                if (!over || over.id === 'folder-remove-zone') {
                                  // Dragged outside children or onto remove zone → remove from folder
                                  launchpadOrderService.removeFromFolder(folder.id, active.id as string);
                                  reloadItems();
                                  if (folder.children.length <= 1) setExpandedFolder(null);
                                } else if (over.id !== active.id) {
                                  // Reorder within folder
                                  const oldIdx = folder.children.indexOf(active.id as string);
                                  const newIdx = folder.children.indexOf(over.id as string);
                                  if (oldIdx >= 0 && newIdx >= 0) {
                                    const newChildren = arrayMove(folder.children, oldIdx, newIdx);
                                    launchpadOrderService.updateFolder(folder.id, { children: newChildren });
                                    reloadItems();
                                  }
                                }
                              }}
                            >
                              <SortableContext items={children.map(c => c.id)} strategy={rectSortingStrategy}>
                                <div className="h-full overflow-auto scrollbar-hide pr-1">
                                  <div
                                    className="grid gap-x-3 gap-y-4 justify-items-center"
                                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                                  >
                                    {children.map((child) => (
                                      <SortableFolderChild
                                        key={child.id}
                                        child={child}
                                        onLaunch={onLaunch}
                                        onClose={() => setExpandedFolder(null)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </SortableContext>
                              <DragOverlay dropAnimation={null}>
                                {null}
                              </DragOverlay>
                            </DndContext>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </React.Fragment>
              );
            })()}
          </AnimatePresence>,
          document.body)}

          <UninstallConfirmDialog
            app={uninstallApp}
            isOpen={!!uninstallApp}
            onConfirm={handleUninstallConfirm}
            onCancel={() => setUninstallApp(null)}
          />
        </div>

        {/* DragOverlay - in document.body for accurate mouse following */}
        {createPortal(
          <DragOverlay
            style={{
              cursor: 'grabbing',
            }}
            dropAnimation={null}
          >
            {activeItem ? (
              <AppPreview app={activeItem} allItemsMap={allItemsMap} />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      <AddItemDialog
        isOpen={showAddDialog}
        onClose={() => { setShowAddDialog(false); setEditingBookmark(null); }}
        onAddBookmark={(bookmark) => {
          if (editingBookmark) {
            launchpadOrderService.updateBookmark(bookmark.id, bookmark);
            reloadItems();
            setEditingBookmark(null);
          } else {
            handleAddBookmark(bookmark);
          }
        }}
        onAddFolder={handleAddFolder}
        editBookmark={editingBookmark}
      />
    </>
  );
};
