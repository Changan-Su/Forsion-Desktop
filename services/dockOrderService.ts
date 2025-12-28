/**
 * Dock Order Service
 * Handles persistence of app order and pinned apps in Dock using localStorage
 */

const DOCK_ORDER_KEY = 'forsion-dock-order';
const DOCK_PINNED_KEY = 'forsion-dock-pinned';

interface DockOrder {
  order: string[]; // Array of app IDs in order
}

interface DockPinned {
  pinned: string[]; // Array of pinned app IDs (including Forsion apps)
}

class DockOrderService {
  /**
   * Get the saved order from localStorage
   */
  getOrder(): string[] {
    try {
      const saved = localStorage.getItem(DOCK_ORDER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DockOrder;
        return parsed.order || [];
      }
    } catch (error) {
      console.error('[DockOrderService] Failed to parse saved order:', error);
    }
    return [];
  }

  /**
   * Save the current order to localStorage
   */
  saveOrder(order: string[]): void {
    try {
      const data: DockOrder = { order };
      localStorage.setItem(DOCK_ORDER_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[DockOrderService] Failed to save order:', error);
    }
  }

  /**
   * Get pinned apps from localStorage
   */
  getPinnedApps(): string[] {
    try {
      const saved = localStorage.getItem(DOCK_PINNED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DockPinned;
        return parsed.pinned || [];
      }
    } catch (error) {
      console.error('[DockOrderService] Failed to parse pinned apps:', error);
    }
    return [];
  }

  /**
   * Add an app to pinned apps
   */
  addPinnedApp(appId: string): void {
    try {
      const pinned = this.getPinnedApps();
      if (!pinned.includes(appId)) {
        pinned.push(appId);
        const data: DockPinned = { pinned };
        localStorage.setItem(DOCK_PINNED_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('[DockOrderService] Failed to add pinned app:', error);
    }
  }

  /**
   * Remove an app from pinned apps
   */
  removePinnedApp(appId: string): void {
    try {
      const pinned = this.getPinnedApps();
      const filtered = pinned.filter(id => id !== appId);
      const data: DockPinned = { pinned: filtered };
      localStorage.setItem(DOCK_PINNED_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[DockOrderService] Failed to remove pinned app:', error);
    }
  }

  /**
   * Check if an app is pinned
   */
  isPinned(appId: string): boolean {
    return this.getPinnedApps().includes(appId);
  }

  /**
   * Reset order to default
   */
  resetOrder(): void {
    localStorage.removeItem(DOCK_ORDER_KEY);
  }

  /**
   * Reset pinned apps
   */
  resetPinned(): void {
    localStorage.removeItem(DOCK_PINNED_KEY);
  }
}

export const dockOrderService = new DockOrderService();
export default dockOrderService;

