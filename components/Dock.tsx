import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Package } from 'lucide-react';
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
import forsionDeskService, { getAppIconUrl } from '../services/forsionDeskService';

interface DockApp {
  id: string;
  name: string;
  icon?: string;
  iconKey?: string;
  color: string;
  isForsionApp: boolean;
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

  return <Package size={size} className="text-white pointer-events-none" />;
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
        className={`w-12 h-12 rounded-xl ${app.color} flex items-center justify-center text-white shadow-lg relative overflow-hidden transition-all duration-300 ${
          isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-pointer'
        }`}
        data-gpu-accelerated={gpuAcceleration ? 'true' : undefined}
        style={gpuStyle}
      >
        <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
        <div className="w-6 h-6">
          {app.isForsionApp ? (
            <ForsionAppIcon icon={app.icon} name={app.name} size={24} />
          ) : (
            app.iconKey && ICON_MAP[app.iconKey]
          )}
        </div>
      </motion.button>
      
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/80 rounded-full" />
      )}

      <div className="absolute -top-10 left-1/2 -translate-x-1/2 glass px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {app.name}
      </div>
    </div>
  );
};

export const Dock: React.FC<DockProps> = ({ onLaunch, activeApps, onLaunchForsionApp }) => {
  const [gpuAcceleration, setGpuAcceleration] = useState<boolean>(true);
  const [dockApps, setDockApps] = useState<DockApp[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [forsionApps, setForsionApps] = useState<ForsionApp[]>([]);

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
    
    // Start with default APPS (excluding recipe, notes, studio, workspace)
    const excludedAppIds = ['recipe', 'notes', 'studio', 'workspace'];
    const defaultApps: DockApp[] = APPS.filter(app => !excludedAppIds.includes(app.id))
      .map(app => ({
        id: app.id,
        name: app.name,
        iconKey: app.icon,
        color: app.color,
        isForsionApp: false,
      }));

    // Add pinned Forsion apps
    const pinnedForsionApps: DockApp[] = pinnedIds
      .filter(id => !defaultApps.some(app => app.id === id))
      .map(id => {
        const forsionApp = forsionApps.find(app => app.id === id);
        if (forsionApp) {
          return {
            id: forsionApp.id,
            name: forsionApp.name,
            icon: forsionApp.icon,
            color: 'bg-gradient-to-br from-purple-500/80 to-pink-500/80',
            isForsionApp: true,
            url: forsionApp.url,
          };
        }
        return null;
      })
      .filter((app): app is DockApp => app !== null);

    // Combine all apps
    let allApps = [...defaultApps, ...pinnedForsionApps];

    // Apply saved order if available
    if (savedOrder.length > 0) {
      const ordered = savedOrder
        .map(id => allApps.find(app => app.id === id))
        .filter((app): app is DockApp => !!app);
      const unordered = allApps.filter(app => !savedOrder.includes(app.id));
      allApps = [...ordered, ...unordered];
    }

    setDockApps(allApps);
  }, [forsionApps]);

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

  // Long press sensor (300ms)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 300,
        tolerance: 5,
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
            className="glass-dark px-3 py-2 rounded-2xl flex items-end space-x-2 shadow-2xl"
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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-2xl opacity-90">
                <div className={`w-12 h-12 rounded-xl ${activeApp.color} flex items-center justify-center`}>
                  <div className="w-6 h-6">
                    {activeApp.isForsionApp ? (
                      <ForsionAppIcon icon={activeApp.icon} name={activeApp.name} size={24} />
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
