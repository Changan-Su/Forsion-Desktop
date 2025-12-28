import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Trash2, MoreVertical, Pin, PinOff, Trash } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  rectIntersection,
  CollisionDetection,
  pointerWithin,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { APPS, ICON_MAP } from '../constants';
import { AppId, ForsionApp, DesktopApp } from '../types';
import forsionDeskService from '../services/forsionDeskService';
import launchpadOrderService from '../services/launchpadOrderService';
import dockOrderService from '../services/dockOrderService';
import { UninstallConfirmDialog } from './UninstallConfirmDialog';

// Forsion App Icon Component
interface ForsionAppIconProps {
  icon?: string;
  name: string;
  size?: number;
}

const ForsionAppIcon: React.FC<ForsionAppIconProps> = ({ icon, name, size = 24 }) => {
  const [iconError, setIconError] = useState(false);

  if (icon && !iconError) {
    return (
      <img 
        src={icon} 
        alt={name}
        className="w-full h-full object-cover rounded-lg pointer-events-none"
        onError={() => setIconError(true)}
      />
    );
  }

  return <Package size={size} className="text-white pointer-events-none" />;
};

// Draggable App Item Component
interface DraggableAppProps {
  app: DesktopApp | ForsionApp;
  isForsionApp: boolean;
  onLaunch: () => void;
  onUninstall?: (app: ForsionApp) => void;
  onAddToDock?: (appId: string) => void;
  onRemoveFromDock?: (appId: string) => void;
}

const DraggableApp: React.FC<DraggableAppProps> = ({ 
  app, 
  isForsionApp, 
  onLaunch,
  onUninstall,
  onAddToDock,
  onRemoveFromDock
}) => {
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1 : 'auto',
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger launch if we haven't dragged and didn't click on menu
    if (!isDragging && !transform && !showMenu) {
      onLaunch();
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
    if (isForsionApp && onUninstall) {
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
      <div className="flex flex-col items-center gap-3 group w-24 cursor-pointer relative">
        <div 
          className={`w-20 h-20 rounded-[22px] flex items-center justify-center text-white shadow-lg relative overflow-visible transition-all duration-300 group-hover:shadow-xl ring-0 group-hover:ring-2 ring-white/20 ${
            isForsionApp 
              ? 'bg-gradient-to-br from-purple-500/80 to-pink-500/80' 
              : (app as DesktopApp).color
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[22px]" />
          <div className="w-10 h-10 flex items-center justify-center pointer-events-none">
            {isForsionApp ? (
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
                {!isPinned ? (
                  <button
                    onClick={handleAddToDock}
                    className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors"
                  >
                    <Pin size={14} />
                    <span>添加到 Dock</span>
                  </button>
                ) : (
                  <button
                    onClick={handleRemoveFromDock}
                    className="w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10 flex items-center gap-2 transition-colors"
                  >
                    <PinOff size={14} />
                    <span>从 Dock 移除</span>
                  </button>
                )}
                {isForsionApp && (
                  <button
                    onClick={handleUninstall}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/20 flex items-center gap-2 transition-colors"
                  >
                    <Trash size={14} />
                    <span>卸载</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="text-sm font-medium text-white/90 drop-shadow-md text-center leading-tight select-none pointer-events-none">
          {app.name}
        </span>
      </div>
    </div>
  );
};

// App Preview for Drag Overlay
const AppPreview: React.FC<{ app: DesktopApp | ForsionApp, isForsionApp: boolean }> = ({ app, isForsionApp }) => {
  return (
    <div className="flex flex-col items-center gap-3 w-24 opacity-95 scale-110 cursor-grabbing pointer-events-none">
      <div 
        className={`w-20 h-20 rounded-[22px] flex items-center justify-center text-white shadow-2xl relative overflow-hidden ring-2 ring-white/50 ${
          isForsionApp 
            ? 'bg-gradient-to-br from-purple-500/90 to-pink-500/90' 
            : (app as DesktopApp).color
        }`}
      >
        <div className="w-10 h-10 flex items-center justify-center">
          {isForsionApp ? (
            <ForsionAppIcon icon={(app as ForsionApp).icon} name={app.name} size={24} />
          ) : (
            ICON_MAP[(app as DesktopApp).icon]
          )}
        </div>
      </div>
      <span className="text-sm font-bold text-white drop-shadow-lg text-center leading-tight">
        {app.name}
      </span>
    </div>
  );
};

// Trash Zone Component
interface TrashZoneProps {
  isActive: boolean;
  isDraggingForsionApp: boolean;
  trashZoneRef: React.RefObject<HTMLDivElement>;
}

const TrashZone: React.FC<TrashZoneProps & { isOverTrash: boolean }> = ({ isActive, isDraggingForsionApp, trashZoneRef, isOverTrash }) => {
  const { setNodeRef } = useDroppable({
    id: 'trash-zone',
    disabled: !isDraggingForsionApp,
  });

  // Combine refs
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (trashZoneRef) {
      (trashZoneRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  return (
    <motion.div
      ref={combinedRef}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: isActive && isDraggingForsionApp ? 1 : 0,
        opacity: isActive && isDraggingForsionApp ? 1 : 0,
        y: isActive && isDraggingForsionApp ? 0 : 50
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`absolute bottom-8 right-8 w-24 h-24 rounded-3xl flex items-center justify-center ${
        isOverTrash ? 'bg-red-500 scale-110 shadow-red-500/50' : 'bg-red-500/60'
      } backdrop-blur-lg border-4 border-white/40 shadow-2xl transition-all duration-200 z-50 pointer-events-auto`}
    >
      <Trash2 size={40} className="text-white" />
    </motion.div>
  );
};

// Type Guards and Helpers
function isForsionApp(app: DesktopApp | ForsionApp): app is ForsionApp {
  return 'url' in app;
}

function applyOrder(
  builtInApps: DesktopApp[],
  forsionApps: ForsionApp[],
  savedOrder: string[]
): Array<DesktopApp | ForsionApp> {
  const allApps = [...builtInApps, ...forsionApps];
  
  if (!savedOrder || savedOrder.length === 0) {
    return allApps;
  }
  
  // Apps in the saved order
  const ordered = savedOrder
    .map(id => allApps.find(app => app.id === id))
    .filter((app): app is DesktopApp | ForsionApp => !!app);
  
  // New apps not in the saved order
  const newApps = allApps.filter(app => !savedOrder.includes(app.id));
  
  return [...ordered, ...newApps];
}

interface LaunchpadProps {
  onLaunch: (appId: AppId) => void;
  onLaunchForsionApp?: (app: ForsionApp) => void;
}

export const Launchpad: React.FC<LaunchpadProps> = ({ onLaunch, onLaunchForsionApp }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [forsionApps, setForsionApps] = useState<ForsionApp[]>([]);
  const [orderedApps, setOrderedApps] = useState<Array<DesktopApp | ForsionApp>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uninstallApp, setUninstallApp] = useState<ForsionApp | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags on click)
      },
    })
  );

  // Ref for trash zone element to get its position
  const trashZoneRef = React.useRef<HTMLDivElement>(null);
  
  // Custom collision detection that prioritizes trash zone
  const customCollisionDetection = useCallback<CollisionDetection>((args) => {
    const { pointerCoordinates, droppableContainers, active } = args;
    
    if (!pointerCoordinates || !active) {
      return rectIntersection(args);
    }
    
    // Only check trash zone if dragging a Forsion app
    const draggedApp = orderedApps.find(a => a.id === active.id);
    if (!draggedApp || !isForsionApp(draggedApp)) {
      return rectIntersection(args);
    }
    
    // Check if pointer is over trash zone using ref
    if (trashZoneRef.current) {
      const rect = trashZoneRef.current.getBoundingClientRect();
      const { x, y } = pointerCoordinates;
      
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        const trashContainer = droppableContainers.find(container => container.id === 'trash-zone');
        if (trashContainer) {
          return [{ id: 'trash-zone', data: { droppableContainer: trashContainer } }];
        }
      }
    }
    
    // Otherwise use rect intersection for sortable items
    return rectIntersection(args);
  }, [orderedApps]);

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

  // Apply ordering whenever apps change
  useEffect(() => {
    const builtInApps = APPS.filter(app => app.id !== 'launchpad');
    const savedOrder = launchpadOrderService.getOrder();
    const ordered = applyOrder(builtInApps, forsionApps, savedOrder);
    setOrderedApps(ordered);
  }, [forsionApps]);

  // Filter apps based on search query
  const displayedApps = orderedApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (isForsionApp(app) && app.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleLaunch = (app: DesktopApp | ForsionApp) => {
    if (isForsionApp(app)) {
      if (onLaunchForsionApp) {
        onLaunchForsionApp(app);
      } else {
        window.open(app.url, '_blank', 'noopener,noreferrer');
      }
    } else {
      onLaunch(app.id);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setIsOverTrash(false);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over, active } = event;
    
    // Only check trash zone if dragging a Forsion app
    const draggedApp = orderedApps.find(a => a.id === active.id);
    if (!draggedApp || !isForsionApp(draggedApp)) {
      setIsOverTrash(false);
      return;
    }
    
    // Update state based on collision detection result
    setIsOverTrash(over?.id === 'trash-zone');
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Check if dropped on trash
    if (over?.id === 'trash-zone') {
      const app = orderedApps.find(a => a.id === active.id);
      if (app && isForsionApp(app)) {
        setUninstallApp(app);
      }
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
    setIsOverTrash(false);
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

  const isDraggingForsionApp = activeId 
    ? isForsionApp(orderedApps.find(a => a.id === activeId) as any || {}) 
    : false;

  const activeApp = activeId ? orderedApps.find(a => a.id === activeId) : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full flex flex-col relative">
          {/* Search Bar */}
          <div className="p-8 pb-4 flex justify-center">
            <div className="relative w-full max-w-sm group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 bg-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:bg-white/20 transition-all border border-white/10 focus:border-white/30"
              />
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-8 pt-4 scrollbar-hide">
            <SortableContext 
              items={displayedApps.map(a => a.id)} 
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-4 gap-8 justify-items-center pb-24">
                {displayedApps.map((app) => (
                  <DraggableApp 
                    key={app.id} 
                    app={app} 
                    isForsionApp={isForsionApp(app)}
                    onLaunch={() => handleLaunch(app)}
                    onUninstall={isForsionApp(app) ? (app) => setUninstallApp(app) : undefined}
                    onAddToDock={handleAddToDock}
                    onRemoveFromDock={handleRemoveFromDock}
                  />
                ))}
              </div>
            </SortableContext>
          </div>

          {/* Trash Zone - inside Launchpad window */}
          <TrashZone 
            isActive={!!activeId} 
            isDraggingForsionApp={isDraggingForsionApp}
            trashZoneRef={trashZoneRef}
            isOverTrash={isOverTrash}
          />

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
            {activeApp ? (
              <AppPreview 
                app={activeApp} 
                isForsionApp={isForsionApp(activeApp)} 
              />
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </>
  );
};
