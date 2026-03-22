'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PopupConfig {
  id: string;
  type: 'welcome' | 'promotion' | 'newsletter' | 'exit-intent' | 'time-based';
  title: string;
  content: React.ReactNode;
  trigger: {
    type: 'immediate' | 'scroll' | 'time' | 'exit-intent' | 'page-visit';
    value?: number; // For scroll percentage or time in seconds
  };
  conditions?: {
    maxShowCount?: number;
    cooldownDays?: number;
    userType?: 'guest' | 'authenticated' | 'all';
    pages?: string[];
  };
  priority: number; // Higher number = higher priority
}

interface PopupState {
  id: string;
  showCount: number;
  lastShown: number;
  dismissed: boolean;
}

interface SessionDismissalState {
  id: string;
  dismissedAt: number;
  dismissalType: 'close' | 'dismiss';
}

const STORAGE_KEY = 'popup_states';
const SESSION_DISMISSAL_KEY = 'popup_session_dismissals';

export const usePopupManager = () => {
  const [activePopup, setActivePopup] = useState<PopupConfig | null>(null);
  const [popupQueue, setPopupQueue] = useState<PopupConfig[]>([]);
  const [popupStates, setPopupStates] = useState<Record<string, PopupState>>({});
  const [sessionDismissals, setSessionDismissals] = useState<Record<string, SessionDismissalState>>({});

  // Load popup states from localStorage and session dismissals from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load persistent popup states
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setPopupStates(JSON.parse(stored));
        } catch (error) {
          console.error('Failed to parse popup states:', error);
        }
      }

      // Load session dismissals
      const sessionStored = sessionStorage.getItem(SESSION_DISMISSAL_KEY);
      if (sessionStored) {
        try {
          setSessionDismissals(JSON.parse(sessionStored));
        } catch (error) {
          console.error('Failed to parse session dismissals:', error);
        }
      }
    }
  }, []);

  // Save popup states to localStorage
  const savePopupStates = useCallback((states: Record<string, PopupState>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    }
  }, []);

  // Save session dismissals to sessionStorage
  const saveSessionDismissals = useCallback((dismissals: Record<string, SessionDismissalState>) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_DISMISSAL_KEY, JSON.stringify(dismissals));
    }
  }, []);

  // Check if popup should be shown based on conditions
  const shouldShowPopup = useCallback((popup: PopupConfig): boolean => {
    const state = popupStates[popup.id];
    const sessionDismissal = sessionDismissals[popup.id];
    const now = Date.now();

    // Check session dismissal first (highest priority)
    if (sessionDismissal && sessionDismissal.dismissalType === 'dismiss') {
      return false;
    }

    // For temporary close, implement a short cooldown (5 minutes)
    if (sessionDismissal && sessionDismissal.dismissalType === 'close') {
      const tempCloseCooldown = 5 * 60 * 1000; // 5 minutes
      if (now - sessionDismissal.dismissedAt < tempCloseCooldown) {
        return false;
      }
    }

    // Check max show count
    if (popup.conditions?.maxShowCount && state?.showCount >= popup.conditions.maxShowCount) {
      return false;
    }

    // Check cooldown period
    if (popup.conditions?.cooldownDays && state?.lastShown) {
      const cooldownMs = popup.conditions.cooldownDays * 24 * 60 * 60 * 1000;
      if (now - state.lastShown < cooldownMs) {
        return false;
      }
    }

    // Check if permanently dismissed (localStorage)
    if (state?.dismissed) {
      return false;
    }

    // Check current page
    if (popup.conditions?.pages && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (!popup.conditions.pages.some(page => currentPath.includes(page))) {
        return false;
      }
    }

    return true;
  }, [popupStates, sessionDismissals]);

  // Register a popup
  const registerPopup = useCallback((popup: PopupConfig) => {
    if (shouldShowPopup(popup)) {
      setPopupQueue(prev => {
        const filtered = prev.filter(p => p.id !== popup.id);
        const newQueue = [...filtered, popup].sort((a, b) => b.priority - a.priority);
        return newQueue;
      });
    }
  }, [shouldShowPopup]);

  // Show next popup in queue
  const showNextPopup = useCallback(() => {
    if (popupQueue.length > 0 && !activePopup) {
      const nextPopup = popupQueue[0];
      setActivePopup(nextPopup);
      setPopupQueue(prev => prev.slice(1));

      // Update popup state
      const newStates = {
        ...popupStates,
        [nextPopup.id]: {
          id: nextPopup.id,
          showCount: (popupStates[nextPopup.id]?.showCount || 0) + 1,
          lastShown: Date.now(),
          dismissed: false,
        },
      };
      setPopupStates(newStates);
      savePopupStates(newStates);
    }
  }, [popupQueue, activePopup, popupStates, savePopupStates]);

  // Close active popup with session-based dismissal support
  const closePopup = useCallback((dismissType: 'close' | 'dismiss' = 'close') => {
    if (activePopup) {
      if (dismissType === 'dismiss') {
        // Session-based dismissal - store in sessionStorage
        const newSessionDismissals = {
          ...sessionDismissals,
          [activePopup.id]: {
            id: activePopup.id,
            dismissedAt: Date.now(),
            dismissalType: 'dismiss' as const,
          },
        };
        setSessionDismissals(newSessionDismissals);
        saveSessionDismissals(newSessionDismissals);
      } else {
        // Temporary close - store in sessionStorage with 'close' type
        const newSessionDismissals = {
          ...sessionDismissals,
          [activePopup.id]: {
            id: activePopup.id,
            dismissedAt: Date.now(),
            dismissalType: 'close' as const,
          },
        };
        setSessionDismissals(newSessionDismissals);
        saveSessionDismissals(newSessionDismissals);
      }
    }
    setActivePopup(null);
  }, [activePopup, sessionDismissals, saveSessionDismissals]);

  // Permanent dismissal (localStorage) - for cases where user wants to never see popup again
  const permanentlyDismissPopup = useCallback((popupId: string) => {
    const newStates = {
      ...popupStates,
      [popupId]: {
        ...popupStates[popupId],
        dismissed: true,
      },
    };
    setPopupStates(newStates);
    savePopupStates(newStates);
  }, [popupStates, savePopupStates]);

  // Trigger popup based on conditions
  const triggerPopup = useCallback((popup: PopupConfig) => {
    switch (popup.trigger.type) {
      case 'immediate':
        registerPopup(popup);
        break;
      case 'time':
        setTimeout(() => registerPopup(popup), (popup.trigger.value || 5) * 1000);
        break;
      case 'scroll':
        const handleScroll = () => {
          const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercent >= (popup.trigger.value || 50)) {
            registerPopup(popup);
            window.removeEventListener('scroll', handleScroll);
          }
        };
        window.addEventListener('scroll', handleScroll);
        break;
      case 'exit-intent':
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            registerPopup(popup);
            document.removeEventListener('mouseleave', handleMouseLeave);
          }
        };
        document.addEventListener('mouseleave', handleMouseLeave);
        break;
    }
  }, [registerPopup]);

  // Auto-show next popup when queue changes
  useEffect(() => {
    const timer = setTimeout(showNextPopup, 100);
    return () => clearTimeout(timer);
  }, [popupQueue, showNextPopup]);

  // Clear session dismissals (useful for testing or manual reset)
  const clearSessionDismissals = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_DISMISSAL_KEY);
      setSessionDismissals({});
    }
  }, []);

  // Check if popup is session dismissed
  const isSessionDismissed = useCallback((popupId: string): boolean => {
    const dismissal = sessionDismissals[popupId];
    return dismissal?.dismissalType === 'dismiss';
  }, [sessionDismissals]);

  // Check if popup was temporarily closed in this session
  const wasTemporarilyClosed = useCallback((popupId: string): boolean => {
    const dismissal = sessionDismissals[popupId];
    return dismissal?.dismissalType === 'close';
  }, [sessionDismissals]);

  // Get remaining cooldown time for temporarily closed popup (in milliseconds)
  const getTempCloseCooldownRemaining = useCallback((popupId: string): number => {
    const dismissal = sessionDismissals[popupId];
    if (!dismissal || dismissal.dismissalType !== 'close') {
      return 0;
    }

    const tempCloseCooldown = 5 * 60 * 1000; // 5 minutes
    const elapsed = Date.now() - dismissal.dismissedAt;
    const remaining = tempCloseCooldown - elapsed;

    return Math.max(0, remaining);
  }, [sessionDismissals]);

  // Format cooldown time for display
  const formatCooldownTime = useCallback((milliseconds: number): string => {
    if (milliseconds <= 0) return '';

    const minutes = Math.ceil(milliseconds / (60 * 1000));
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }, []);

  return {
    activePopup,
    registerPopup,
    triggerPopup,
    closePopup,
    showNextPopup,
    permanentlyDismissPopup,
    clearSessionDismissals,
    isSessionDismissed,
    wasTemporarilyClosed,
    getTempCloseCooldownRemaining,
    formatCooldownTime,
    popupStates,
    sessionDismissals,
  };
};
