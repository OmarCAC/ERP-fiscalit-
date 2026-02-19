
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification, NotificationPayload, User, UserRole, NotificationEventType, NotificationLog } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/initial_data';

// Structure d'un Toast de simulation
export interface SimulatedToast {
    id: string;
    channel: 'EMAIL' | 'SMS' | 'PUSH';
    recipient: string;
    message: string;
    timestamp: number;
}

interface NotificationContextType {
  notifications: AppNotification[];
  history: NotificationLog[]; // NOUVEAU : Historique des envois
  unreadCount: number;
  dispatch: (payload: NotificationPayload) => void;
  markAsRead: (id: string) => void;
  snoozeNotification: (id: string, hours: number) => void; // NOUVEAU
  removeNotification: (id: string) => void; // NOUVEAU
  clearAll: () => void;
  pushNotification: (notification: AppNotification) => void;
  // Gestion Toaster
  simulatedToasts: SimulatedToast[];
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode, currentUser?: User }> = ({ children, currentUser }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [history, setHistory] = useState<NotificationLog[]>([]); // État pour l'historique
  const [simulatedToasts, setSimulatedToasts] = useState<SimulatedToast[]>([]);

  // Dérive le nombre de non-lus (exclut les snoozed actifs)
  const unreadCount = notifications.filter(n => n.status === 'unread' && (!n.snoozedUntil || n.snoozedUntil < Date.now())).length;

  // --- LOGIQUE TOASTER ---
  const addToast = (channel: 'EMAIL' | 'SMS' | 'PUSH', recipient: string, message: string) => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setSimulatedToasts(prev => [...prev, { id, channel, recipient, message, timestamp: Date.now() }]);
      
      // Ajouter au log historique
      const logEntry: NotificationLog = {
          id: `log_${Date.now()}_${Math.random()}`,
          date: new Date().toLocaleString(),
          channel: channel,
          recipient: recipient,
          event: message,
          status: 'DELIVERED'
      };
      setHistory(prev => [logEntry, ...prev]);

      // Auto remove après 5 sec
      setTimeout(() => {
          setSimulatedToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
  };

  const removeToast = (id: string) => {
      setSimulatedToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- LE CERVEAU DU SYSTÈME (MOTEUR DE REGLES) ---
  const dispatch = (payload: NotificationPayload) => {
    // 1. Déterminer si l'utilisateur courant est concerné
    const isTargeted = !payload.targetRoles || payload.targetRoles.length === 0 || 
                       (currentUser && payload.targetRoles.includes(currentUser.role));

    if (!currentUser || !isTargeted) return;

    // 2. Notification In-App (Toujours générée si ciblé)
    const newNotif: AppNotification = {
        id: `notif_${Date.now()}`,
        type: payload.type,
        title: payload.title,
        desc: payload.message,
        date: "À l'instant",
        priority: payload.type === 'DEADLINE' || payload.type === 'SECURITY' ? 'high' : 'medium',
        status: 'unread',
        regime: 'SYSTEM', 
        action: payload.actionLink ? 'Voir' : undefined
    };
    setNotifications(prev => [newNotif, ...prev]);

    // 3. Moteur de Canaux Externes (Email / SMS)
    if (currentUser.notificationSettings) {
        
        // Mapping Type Event -> Clé Préférence
        const categoryMap: Record<NotificationEventType, keyof typeof currentUser.notificationSettings> = {
            'DEADLINE': 'deadline',
            'PAYMENT': 'payment',
            'SECURITY': 'security',
            'ADMIN': 'admin',
            'INFO': 'deadline', 
            'INSIGHT': 'deadline' 
        };

        const categoryKey = categoryMap[payload.type];
        // @ts-ignore
        const userPrefs = currentUser.notificationSettings[categoryKey];

        if (userPrefs) {
            // Simulation envoi Email
            if (userPrefs.email) {
                addToast('EMAIL', currentUser.email, payload.title);
            }
            // Simulation envoi SMS
            if (userPrefs.sms) {
                const phone = "+213 550 XX XX XX"; 
                addToast('SMS', phone, payload.title);
            }
            // Simulation Push
            if (userPrefs.push) {
                // Optionnel : addToast('PUSH', 'Mobile', payload.title);
            }
        }
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
  };

  const snoozeNotification = (id: string, hours: number) => {
    const wakeUpTime = Date.now() + (hours * 60 * 60 * 1000);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, snoozedUntil: wakeUpTime, status: 'read' } : n)); // Snooze marks as read temporarily or hides it
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const pushNotification = (notification: AppNotification) => {
      setNotifications(prev => [notification, ...prev]);
  };

  return (
    <NotificationContext.Provider value={{ 
        notifications, 
        history,
        unreadCount, 
        dispatch, 
        markAsRead, 
        snoozeNotification,
        removeNotification,
        clearAll, 
        pushNotification,
        simulatedToasts,
        removeToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
