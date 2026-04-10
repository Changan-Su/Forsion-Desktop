import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Package, Globe } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { APPS, ICON_MAP } from '../constants';
import { AppId, ForsionApp, DesktopApp } from '../types';
import SettingsStorageService from '../services/settingsStorageService';
import dockOrderService from '../services/dockOrderService';
import launchpadOrderService from '../services/launchpadOrderService';
import forsionDeskService, { getAppIconUrl } from '../services/forsionDeskService';
import { useI18n } from '../services/i18nService';

interface DockApp {
  id: string;
  name: string;
  nameKey?: string;
  icon?: string;
  iconKey?: string;
  color: string;
  isForsionApp: boolean;
  isBookmark?: boolean;
  url?: string;
}

interface DockProps {
  onLaunch: (id: AppId) => void;
  activeApps: AppId[];
  onLaunchForsionApp?: (app: ForsionApp) => void;
}

// Forsion App Icon Component
const ForsionAppIcon: React.FC<{ icon?: string; name: string; size?: number }> = ({ 
  icon, 
  name, 
  size = 24 
}) => {
  const [iconError, setIconError] = useState(false);
  const iconUrl = getAppIconUrl(icon);

  if (iconUrl && !iconError) {
    return (
      <img 
        src={iconUrl} 
        alt={name}
        className="w-full h-full object-cover rounded-lg pointer-events-none"
        onError={() => setIconError(true)}
      />
    );
  }

  return <Package size={size} className="pointer-events-none" />;
};

// Draggable Dock Item Component
interface DraggableDockItemProps {
  app: DockApp;
  isActive: boolean;
  onLaunch: () => void;
  gpuStyle: React.CSSProperties;
  gpuAcceleration: boolean;
}

const DraggableDockItem: React.FC<DraggableDockItemProps> = ({
  app,
  isActive,
  onLaunch,
  gpuStyle,
  gpuAcceleration
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && !transform) {
      onLaunch();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group touch-none"
    >
      <motion.button
        whileHover={!isDragging ? { scale: 1.2, y: -10 } : {}}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className={`w-12 h-12 rounded-xl ${app.color} flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-300 ${
          app.isForsionApp || app.isBookmark || !app.color ? 'text-surface-text' : 'text-white'
        } ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-pointer'}`}
        data-gpu-accelerated={gpuAcceleration ? 'true' : undefined}
        style={app.isForsionApp || app.isBookmark || !app.color ? { ...gpuStyle, background: 'var(--icon-surface)', backdropFilter: 'var(--backdrop-glass)', WebkitBackdropFilter: 'var(--backdrop-glass)', border: '1px solid var(--ui-border-sub)' } : gpuStyle}
      >
        {app.color && <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />}
        <div className="w-6 h-6 flex items-center justify-center">
          {app.isForsionApp ? (
            <ForsionAppIcon icon={app.icon} name={app.name} size={24} />
          ) : app.isBookmark ? (
            app.icon ? (
              <img
                src={app.icon}
                alt={app.name}
                className="w-full h-full object-cover rounded-lg pointer-events-none"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <Globe size={20} className="pointer-events-none" />
            )
          ) : (
            app.iconKey && ICON_MAP[app.iconKey]
          )}
        </div>
      </motion.button>
      
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-surface-text/80 rounded-full" />
      )}

      <div className="absolute -top-10 left-1/2 -translate-x-1/2 group-hover:-translate-y-2.5 glass px-2 py-1 rounded text-[10px] text-surface-text opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
        {app.nameKey ? t(app.nameKey) : app.name}
      </div>
    </div>
  );
};

export const Dock: React.FC<DockProps> = ({ onLaunch, activeApps, onLaunchForsionApp }) => {
  const [gpuAcceleration, setGpuAcceleration] = useState<boolean>(true);
  const [dockApps, setDockApps] = useState<DockApp[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [forsionApps, setForsionApps] = useState<ForsionApp[]>([]);
  // Bumps whenever the pinned set or launchpad data changes, so the dock
  // rebuild effect re-runs independently of the Forsion app fetch.
  const [pinnedVersion, setPinnedVersion] = useState(0);

  // Load Forsion apps
  useEffect(() => {
    const loadForsionApps = async () => {
      try {
        const installedApps = await forsionDeskService.getUserInstalledApps();
        const activeApps = installedApps.filter(app => app.isActive);
        setForsionApps(activeApps);
      } catch (error) {
        console.error('Failed to load Forsion apps for Dock:', error);
      }
    };

    loadForsionApps();

    const handleAppChange = () => {
      loadForsionApps();
      // Also trigger a rebuild for pinned bookmarks that don't depend on
      // the Forsion apps fetch completing.
      setPinnedVersion(v => v + 1);
    };

    window.addEventListener('forsion-app-installed', handleAppChange);
    window.addEventListener('forsion-app-uninstalled', handleAppChange);
    window.addEventListener('dock-apps-updated', handleAppChange);

    return () => {
      window.removeEventListener('forsion-app-installed', handleAppChange);
      window.removeEventListener('forsion-app-uninstalled', handleAppChange);
      window.removeEventListener('dock-apps-updated', handleAppChange);
    };
  }, []);

  // Build dock apps list from pinned apps and default apps
  useEffect(() => {
    const pinnedIds = dockOrderService.getPinnedApps();
    const savedOrder = dockOrderService.getOrder();
    const launchpadData = launchpadOrderService.getData();

    const defaultApps: DockApp[] = APPS.map(app => ({
        id: app.id,
        name: app.name,
        nameKey: app.nameKey,
        iconKey: app.icon,
        color: app.color,
        isForsionApp: false,
      }));

    // Resolve each pinned ID against Forsion apps first, then launchpad bookmarks.
    // This lets users pin any non-default drawer item (Forsion app or bookmark).
    const pinnedItems: DockApp[] = pinnedIds
      .filter(id => !defaultApps.some(app => app.id === id))
      .map(id => {
        const forsionApp = forsionApps.find(app => app.id === id);
        if (forsionApp) {
          return {
            id: forsionApp.id,
            name: forsionApp.name,
            icon: forsionApp.icon,
            color: '',
            isForsionApp: true,
            url: forsionApp.url,
          };
        }
        const bookmark = launchpadData.bookmarks[id];
        if (bookmark) {
          return {
            id: bookmark.id,
            name: bookmark.name,
            icon: bookmark.icon,
            color: '',
            isForsionApp: false,
            isBookmark: true,
            url: bookmark.url,
          };
        }
        return null;
      })
      .filter((app): app is DockApp => app !== null);

    // Combine all apps
    let allApps = [...defaultApps, ...pinnedItems];

    // Apply saved order if available
    if (savedOrder.length > 0) {
      const ordered = savedOrder
        .map(id => allApps.find(app => app.id === id))
        .filter((app): app is DockApp => !!app);
      const unordered = allApps.filter(app => !savedOrder.includes(app.id));
      allApps = [...ordered, ...unordered];
    }

    setDockApps(allApps);
  }, [forsionApps, pinnedVersion]);

  useEffect(() => {
    const gpuEnabled = SettingsStorageService.getGPUAcceleration();
    setGpuAcceleration(gpuEnabled);

    const handleStorageChange = () => {
      setGpuAcceleration(SettingsStorageService.getGPUAcceleration());
    };
    const handleGPUChange = (e: CustomEvent) => {
      setGpuAcceleration(e.detail.enabled);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('gpu-acceleration-changed', handleGPUChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('gpu-acceleration-changed', handleGPUChange as EventListener);
    };
  }, []);

  // Distance-based sensor: any 8px pointer movement initiates drag.
  // Clicks (no movement) still propagate to onClick for app launch.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const gpuStyle = gpuAcceleration ? {
    willChange: 'transform' as const,
    transform: 'translateZ(0)',
  } : {};

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = dockApps.findIndex((app) => app.id === active.id);
      const newIndex = dockApps.findIndex((app) => app.id === over.id);

      const newOrder = arrayMove(dockApps, oldIndex, newIndex);
      setDockApps(newOrder);

      // Save order
      const orderIds = newOrder.map(app => app.id);
      dockOrderService.saveOrder(orderIds);
    }

    setActiveId(null);
  };

  const handleLaunch = (app: DockApp) => {
    if (app.isBookmark && app.url) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (app.isForsionApp && app.url) {
      if (onLaunchForsionApp) {
        const forsionApp = forsionApps.find(fa => fa.id === app.id);
        if (forsionApp) {
          onLaunchForsionApp(forsionApp);
        } else {
          window.open(app.url, '_blank', 'noopener,noreferrer');
        }
      } else {
        window.open(app.url, '_blank', 'noopener,noreferrer');
      }
    } else {
      onLaunch(app.id as AppId);
    }
  };

  const activeApp = activeId ? dockApps.find(app => app.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000]">
          <motion.div 
            layout
            className="glass-dark px-3 py-2 rounded-2xl flex items-end space-x-2 shadow-2xl text-surface-text"
            data-gpu-accelerated={gpuAcceleration ? 'true' : undefined}
            style={gpuStyle}
          >
            <SortableContext 
              items={dockApps.map(app => app.id)} 
              strategy={horizontalListSortingStrategy}
            >
              {dockApps.map((app) => (
                <DraggableDockItem
                  key={app.id}
                  app={app}
                  isActive={activeApps.includes(app.id as AppId)}
                  onLaunch={() => handleLaunch(app)}
                  gpuStyle={gpuStyle}
                  gpuAcceleration={gpuAcceleration}
                />
              ))}
            </SortableContext>
          </motion.div>
        </div>

        {/* DragOverlay */}
        {createPortal(
          <DragOverlay
            style={{
              cursor: 'grabbing',
            }}
            dropAnimation={null}
          >
            {activeApp ? (
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl opacity-90 ${activeApp.isForsionApp || activeApp.isBookmark || !activeApp.color ? 'text-surface-text' : 'text-white'}`}>
                <div className={`w-12 h-12 rounded-xl ${activeApp.color} flex items-center justify-center`} style={activeApp.isForsionApp || activeApp.isBookmark || !activeApp.color ? { background: 'var(--icon-surface)', backdropFilter: 'var(--backdrop-glass)', WebkitBackdropFilter: 'var(--backdrop-glass)', border: '1px solid var(--ui-border-sub)' } : undefined}>
                  <div className="w-6 h-6 flex items-center justify-center">
                    {activeApp.isForsionApp ? (
                      <ForsionAppIcon icon={activeApp.icon} name={activeApp.name} size={24} />
                    ) : activeApp.isBookmark ? (
                      activeApp.icon ? (
                        <img
                          src={activeApp.icon}
                          alt={activeApp.name}
                          className="w-full h-full object-cover rounded-lg pointer-events-none"
                        />
                      ) : (
                        <Globe size={20} className="pointer-events-none" />
                      )
                    ) : (
                      activeApp.iconKey && ICON_MAP[activeApp.iconKey]
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </>
  );
};
