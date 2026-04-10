/**
 * Launchpad Order Service
 * Handles persistence of app order, bookmarks, and folders in Launchpad.
 * Local: localStorage. Cloud: syncs to /api/settings (launchpadData field).
 * Schema v2: { version: 2, order: string[], bookmarks: Record<string, Bookmark>, folders: Record<string, Folder> }
 */

import type { LaunchpadBookmark, LaunchpadFolder } from '../types';
import apiService from './apiService';

const LAUNCHPAD_ORDER_KEY = 'forsion-launchpad-order';

export interface LaunchpadData {
  version: 2;
  order: string[];
  bookmarks: Record<string, LaunchpadBookmark>;
  folders: Record<string, LaunchpadFolder>;
}

function emptyData(): LaunchpadData {
  return { version: 2, order: [], bookmarks: {}, folders: {} };
}

class LaunchpadOrderService {
  private _syncTimer: ReturnType<typeof setTimeout> | null = null;
  private _cloudPulled = false;

  /** Load full data with v1→v2 migration */
  getData(): LaunchpadData {
    try {
      const raw = localStorage.getItem(LAUNCHPAD_ORDER_KEY);
      if (!raw) return emptyData();
      const parsed = JSON.parse(raw);
      // v1: { order: string[] } — no version field
      if (!parsed.version) {
        return { version: 2, order: parsed.order || [], bookmarks: {}, folders: {} };
      }
      return parsed as LaunchpadData;
    } catch {
      return emptyData();
    }
  }

  saveData(data: LaunchpadData): void {
    try {
      localStorage.setItem(LAUNCHPAD_ORDER_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[LaunchpadOrderService] Failed to save data:', error);
    }
    this._schedulePush();
  }

  /** Backward-compat: get just the order array */
  getOrder(): string[] {
    return this.getData().order;
  }

  /** Backward-compat: save just the order array (preserves bookmarks/folders) */
  saveOrder(order: string[]): void {
    const data = this.getData();
    data.order = order;
    this.saveData(data);
  }

  // ── Bookmark CRUD ──

  addBookmark(bookmark: LaunchpadBookmark): void {
    const data = this.getData();
    data.bookmarks[bookmark.id] = bookmark;
    data.order.push(bookmark.id);
    this.saveData(data);
  }

  updateBookmark(id: string, updates: Partial<LaunchpadBookmark>): void {
    const data = this.getData();
    if (data.bookmarks[id]) {
      data.bookmarks[id] = { ...data.bookmarks[id], ...updates };
      this.saveData(data);
    }
  }

  removeBookmark(id: string): void {
    const data = this.getData();
    delete data.bookmarks[id];
    data.order = data.order.filter(i => i !== id);
    // Also remove from any folder children
    for (const folder of Object.values(data.folders)) {
      folder.children = folder.children.filter(c => c !== id);
    }
    this.saveData(data);
  }

  getBookmark(id: string): LaunchpadBookmark | undefined {
    return this.getData().bookmarks[id];
  }

  // ── Folder CRUD ──

  createFolder(folder: LaunchpadFolder): void {
    const data = this.getData();
    data.folders[folder.id] = folder;
    data.order.push(folder.id);
    this.saveData(data);
  }

  updateFolder(id: string, updates: Partial<LaunchpadFolder>): void {
    const data = this.getData();
    if (data.folders[id]) {
      data.folders[id] = { ...data.folders[id], ...updates };
      this.saveData(data);
    }
  }

  removeFolder(id: string): void {
    const data = this.getData();
    const folder = data.folders[id];
    if (folder) {
      // Disperse children back to root order at folder's position
      const idx = data.order.indexOf(id);
      data.order.splice(idx, 1, ...folder.children);
      delete data.folders[id];
      this.saveData(data);
    }
  }

  getFolder(id: string): LaunchpadFolder | undefined {
    return this.getData().folders[id];
  }

  addToFolder(folderId: string, itemId: string): void {
    const data = this.getData();
    const folder = data.folders[folderId];
    if (folder && !folder.children.includes(itemId)) {
      folder.children.push(itemId);
      // Remove from top-level order
      data.order = data.order.filter(i => i !== itemId);
      this.saveData(data);
    }
  }

  removeFromFolder(folderId: string, itemId: string): void {
    const data = this.getData();
    const folder = data.folders[folderId];
    if (folder) {
      folder.children = folder.children.filter(c => c !== itemId);
      // Add back to top-level order after the folder
      const folderIdx = data.order.indexOf(folderId);
      data.order.splice(folderIdx + 1, 0, itemId);
      this.saveData(data);
    }
  }

  /** Create a folder by merging two items */
  createFolderFromItems(itemId1: string, itemId2: string, folderName?: string): LaunchpadFolder {
    const data = this.getData();
    const folder: LaunchpadFolder = {
      id: 'folder-' + Date.now(),
      type: 'folder',
      name: folderName || '',
      children: [itemId2, itemId1],
    };
    data.folders[folder.id] = folder;
    // Replace itemId2's position with the folder, remove itemId1
    const idx = data.order.indexOf(itemId2);
    data.order = data.order.filter(i => i !== itemId1 && i !== itemId2);
    data.order.splice(idx >= 0 ? idx : data.order.length, 0, folder.id);
    this.saveData(data);
    return folder;
  }

  // ── Cloud Sync ──

  /** Debounced push to backend (2s after last change) */
  private _schedulePush(): void {
    if (this._syncTimer) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this._pushToCloud(), 2000);
  }

  /** Push current local data to backend */
  private async _pushToCloud(): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) return; // Not logged in, skip sync
    try {
      const data = this.getData();
      await apiService.put('/api/settings', { launchpadData: data });
    } catch (error) {
      console.error('[LaunchpadOrderService] Cloud push failed:', error);
    }
  }

  /** Pull from backend and merge (cloud wins if local is empty, otherwise local wins) */
  async pullFromCloud(): Promise<boolean> {
    if (this._cloudPulled) return false;
    const token = localStorage.getItem('auth_token');
    if (!token) return false;
    try {
      const settings = await apiService.get<any>('/api/settings');
      if (settings?.launchpadData) {
        const local = this.getData();
        const hasLocalData = local.order.length > 0 || Object.keys(local.bookmarks).length > 0 || Object.keys(local.folders).length > 0;
        if (!hasLocalData) {
          // Local is empty, use cloud data
          const cloud = settings.launchpadData as LaunchpadData;
          localStorage.setItem(LAUNCHPAD_ORDER_KEY, JSON.stringify(cloud));
          this._cloudPulled = true;
          return true; // Data changed, caller should reload
        }
        // Local has data — push local to cloud (local wins)
        this._pushToCloud();
      }
      this._cloudPulled = true;
      return false;
    } catch (error) {
      console.error('[LaunchpadOrderService] Cloud pull failed:', error);
      return false;
    }
  }
}

export const launchpadOrderService = new LaunchpadOrderService();
export default launchpadOrderService;
