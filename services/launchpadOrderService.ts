/**
 * Launchpad Order Service
 * Handles persistence of app order in Launchpad using localStorage
 */

const LAUNCHPAD_ORDER_KEY = 'forsion-launchpad-order';

interface LaunchpadOrder {
  order: string[]; // Array of app IDs in order
}

class LaunchpadOrderService {
  /**
   * Get the saved order from localStorage
   */
  getOrder(): string[] {
    try {
      const saved = localStorage.getItem(LAUNCHPAD_ORDER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LaunchpadOrder;
        return parsed.order || [];
      }
    } catch (error) {
      console.error('[LaunchpadOrderService] Failed to parse saved order:', error);
    }
    return [];
  }

  /**
   * Save the current order to localStorage
   */
  saveOrder(order: string[]): void {
    try {
      const data: LaunchpadOrder = { order };
      localStorage.setItem(LAUNCHPAD_ORDER_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[LaunchpadOrderService] Failed to save order:', error);
    }
  }

  /**
   * Reset order to default
   */
  resetOrder(): void {
    localStorage.removeItem(LAUNCHPAD_ORDER_KEY);
  }
}

export const launchpadOrderService = new LaunchpadOrderService();
export default launchpadOrderService;

