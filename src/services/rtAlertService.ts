import { getDatabase, ref, push, onValue, update, off } from 'firebase/database';
import { User } from '@/types/auth';

export interface RTAlert {
  id: string;
  from: {
    name: string;
    council: 'HCC' | 'FCC';
    role: 'member-hcc' | 'member-fcc';
    userId: string;
  };
  to: 'admin-rt';
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  replies: Array<{
    from: string;
    message: string;
    timestamp: number;
    fromRole: string;
  }>;
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface RTAlertReply {
  from: string;
  message: string;
  timestamp: number;
  fromRole: string;
}

class RTAlertService {
  private db = getDatabase();
  private alertsRef = ref(this.db, 'rt_alerts');

  /**
   * Create a new R&T alert from a member to admin-rt
   */
  async createRTAlert(alertData: {
    message: string;
    from: RTAlert['from'];
  }): Promise<string | null> {
    try {
      const newAlert: Omit<RTAlert, 'id'> = {
        ...alertData,
        to: 'admin-rt',
        status: 'pending',
        replies: [],
        createdAt: Date.now(),
      };

      const newAlertRef = await push(this.alertsRef, newAlert);
      
      if (newAlertRef.key) {
        // Update the alert with its own ID
        await update(ref(this.db, `rt_alerts/${newAlertRef.key}`), {
          id: newAlertRef.key
        });
        return newAlertRef.key;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating R&T alert:', error);
      throw error;
    }
  }

  /**
   * Update R&T alert status (accept/reject)
   */
  async updateRTAlertStatus(
    alertId: string, 
    status: 'accepted' | 'rejected',
    resolvedBy: string
  ): Promise<void> {
    try {
      const alertRef = ref(this.db, `rt_alerts/${alertId}`);
      await update(alertRef, {
        status,
        resolvedAt: Date.now(),
        resolvedBy
      });
    } catch (error) {
      console.error('Error updating R&T alert status:', error);
      throw error;
    }
  }

  /**
   * Add a reply to an R&T alert
   */
  async addRTAlertReply(
    alertId: string,
    reply: Omit<RTAlertReply, 'timestamp'>
  ): Promise<void> {
    try {
      const alertRef = ref(this.db, `rt_alerts/${alertId}`);
      
      // Get current alert data to append reply
      return new Promise((resolve, reject) => {
        onValue(alertRef, (snapshot) => {
          const alertData = snapshot.val() as RTAlert;
          if (alertData) {
            const updatedReplies = [
              ...(alertData.replies || []),
              {
                ...reply,
                timestamp: Date.now()
              }
            ];
            
            update(alertRef, { replies: updatedReplies })
              .then(() => resolve())
              .catch(reject);
          } else {
            reject(new Error('Alert not found'));
          }
        }, { onlyOnce: true });
      });
    } catch (error) {
      console.error('Error adding R&T alert reply:', error);
      throw error;
    }
  }

  /**
   * Listen to R&T alerts for admin-rt
   */
  onRTAlerts(callback: (alerts: RTAlert[]) => void): () => void {
    const unsubscribe = onValue(this.alertsRef, (snapshot) => {
      const alertsData = snapshot.val();
      if (alertsData) {
        const alerts = Object.values(alertsData) as RTAlert[];
        // Sort by creation time, newest first
        alerts.sort((a, b) => b.createdAt - a.createdAt);
        callback(alerts);
      } else {
        callback([]);
      }
    });

    return () => {
      off(this.alertsRef, 'value', unsubscribe);
    };
  }

  /**
   * Listen to R&T alerts for a specific member
   */
  onMemberRTAlerts(userId: string, callback: (alerts: RTAlert[]) => void): () => void {
    const unsubscribe = onValue(this.alertsRef, (snapshot) => {
      const alertsData = snapshot.val();
      if (alertsData) {
        const alerts = Object.values(alertsData) as RTAlert[];
        // Filter alerts created by this member
        const memberAlerts = alerts.filter(alert => alert.from.userId === userId);
        // Sort by creation time, newest first
        memberAlerts.sort((a, b) => b.createdAt - a.createdAt);
        callback(memberAlerts);
      } else {
        callback([]);
      }
    });

    return () => {
      off(this.alertsRef, 'value', unsubscribe);
    };
  }

  /**
   * Listen to specific R&T alert updates
   */
  onRTAlertUpdates(alertId: string, callback: (alert: RTAlert | null) => void): () => void {
    const alertRef = ref(this.db, `rt_alerts/${alertId}`);
    
    const unsubscribe = onValue(alertRef, (snapshot) => {
      const alertData = snapshot.val() as RTAlert | null;
      callback(alertData);
    });

    return () => {
      off(alertRef, 'value', unsubscribe);
    };
  }
}

export const rtAlertService = new RTAlertService();