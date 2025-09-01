/**
 * Notification Delivery Tracker
 * Tracks notification delivery status and provides confirmation callbacks
 */

interface DeliveryStatus {
  id: string;
  timestamp: number;
  status: 'pending' | 'delivered' | 'failed' | 'clicked' | 'dismissed';
  title: string;
  platform: string;
  deliveryTime?: number;
  error?: string;
}

class NotificationDeliveryTracker {
  private deliveries = new Map<string, DeliveryStatus>();
  private callbacks = new Map<string, (status: DeliveryStatus) => void>();
  private deliveryTimeout = 5000; // 5 seconds to consider delivery failed

  constructor() {
    this.setupServiceWorkerListener();
  }

  /**
   * Track a new notification
   */
  trackNotification(id: string, title: string, platform: string, callback?: (status: DeliveryStatus) => void): string {
    const deliveryStatus: DeliveryStatus = {
      id,
      timestamp: Date.now(),
      status: 'pending',
      title,
      platform
    };

    this.deliveries.set(id, deliveryStatus);
    
    if (callback) {
      this.callbacks.set(id, callback);
    }

    // Set timeout for delivery failure
    setTimeout(() => {
      const current = this.deliveries.get(id);
      if (current && current.status === 'pending') {
        this.updateStatus(id, 'failed', 'Delivery timeout');
      }
    }, this.deliveryTimeout);

    return id;
  }

  /**
   * Update notification status
   */
  updateStatus(id: string, status: DeliveryStatus['status'], error?: string) {
    const delivery = this.deliveries.get(id);
    if (!delivery) return;

    delivery.status = status;
    if (error) delivery.error = error;
    if (status === 'delivered') {
      delivery.deliveryTime = Date.now() - delivery.timestamp;
    }

    this.deliveries.set(id, delivery);

    // Call callback if exists
    const callback = this.callbacks.get(id);
    if (callback) {
      callback(delivery);
    }

    // Log delivery status
    console.log(`[Notification Delivery] ${id}: ${status}`, delivery);
  }

  /**
   * Get delivery status
   */
  getStatus(id: string): DeliveryStatus | undefined {
    return this.deliveries.get(id);
  }

  /**
   * Get all deliveries
   */
  getAllDeliveries(): DeliveryStatus[] {
    return Array.from(this.deliveries.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get delivery statistics
   */
  getStats() {
    const deliveries = this.getAllDeliveries();
    const total = deliveries.length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;
    const pending = deliveries.filter(d => d.status === 'pending').length;
    const clicked = deliveries.filter(d => d.status === 'clicked').length;

    const avgDeliveryTime = deliveries
      .filter(d => d.deliveryTime)
      .reduce((sum, d) => sum + (d.deliveryTime || 0), 0) / delivered || 0;

    return {
      total,
      delivered,
      failed,
      pending,
      clicked,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      avgDeliveryTime: Math.round(avgDeliveryTime)
    };
  }

  /**
   * Setup service worker message listener
   */
  private setupServiceWorkerListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, notificationId, status, error } = event.data;
        
        if (type === 'NOTIFICATION_DELIVERY_STATUS') {
          this.updateStatus(notificationId, status, error);
        }
      });
    }
  }

  /**
   * Clear old deliveries (keep last 50)
   */
  cleanup() {
    const deliveries = this.getAllDeliveries();
    if (deliveries.length > 50) {
      const toKeep = deliveries.slice(0, 50);
      this.deliveries.clear();
      this.callbacks.clear();
      
      toKeep.forEach(delivery => {
        this.deliveries.set(delivery.id, delivery);
      });
    }
  }

  /**
   * Generate unique notification ID
   */
  static generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const notificationDeliveryTracker = new NotificationDeliveryTracker();
export type { DeliveryStatus };