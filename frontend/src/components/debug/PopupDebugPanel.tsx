'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, RefreshCw, Eye, EyeOff, Trash2, Info } from 'lucide-react';
import { usePopupManager } from '@/hooks/usePopupManager';

interface PopupDebugPanelProps {
  isVisible?: boolean;
}

const PopupDebugPanel: React.FC<PopupDebugPanelProps> = ({ isVisible = false }) => {
  const [isOpen, setIsOpen] = useState(isVisible);
  const {
    popupStates,
    sessionDismissals,
    clearSessionDismissals,
    isSessionDismissed,
    wasTemporarilyClosed,
    getTempCloseCooldownRemaining,
    formatCooldownTime,
    triggerPopup,
  } = usePopupManager();

  const handleClearSessionStorage = () => {
    clearSessionDismissals();
    alert('Session dismissals cleared! Popups can now be shown again.');
  };

  const handleClearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('popup_states');
      alert('Popup states cleared from localStorage! Page will reload.');
      window.location.reload();
    }
  };

  const handleTriggerWelcomePopup = () => {
    triggerPopup({
      id: 'welcome-test',
      type: 'welcome',
      title: 'Test Welcome',
      content: <div className="p-6 text-center">Test Welcome Popup</div>,
      trigger: { type: 'immediate' },
      conditions: { userType: 'all' },
      priority: 100,
    });
  };

  const handleTriggerNewsletterPopup = () => {
    triggerPopup({
      id: 'newsletter-test',
      type: 'newsletter',
      title: 'Test Newsletter',
      content: <div className="p-6 text-center">Test Newsletter Popup</div>,
      trigger: { type: 'immediate' },
      conditions: { userType: 'all' },
      priority: 100,
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Open Popup Debug Panel"
      >
        <Settings className="h-5 w-5" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-xl max-w-sm w-full max-h-96 overflow-y-auto"
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Popup Debug Panel
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <EyeOff className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Session Dismissals */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              Session Dismissals
            </h4>
            {Object.keys(sessionDismissals).length === 0 ? (
              <p className="text-sm text-gray-500">No session dismissals</p>
            ) : (
              <div className="space-y-1">
                {Object.entries(sessionDismissals).map(([id, dismissal]) => (
                  <div key={id} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="font-medium">{id}</div>
                    <div className="text-gray-600">
                      Type: {dismissal.dismissalType} | 
                      Time: {new Date(dismissal.dismissedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popup States */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Popup States (Persistent)
            </h4>
            {Object.keys(popupStates).length === 0 ? (
              <p className="text-sm text-gray-500">No popup states</p>
            ) : (
              <div className="space-y-1">
                {Object.entries(popupStates).map(([id, state]) => (
                  <div key={id} className="text-xs bg-blue-50 p-2 rounded">
                    <div className="font-medium">{id}</div>
                    <div className="text-gray-600">
                      Shows: {state.showCount} | 
                      Dismissed: {state.dismissed ? 'Yes' : 'No'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Checks */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Status Checks</h4>
            <div className="space-y-1 text-xs">
              <div>Welcome dismissed: {isSessionDismissed('welcome') ? 'Yes' : 'No'}</div>
              <div>Newsletter dismissed: {isSessionDismissed('newsletter') ? 'Yes' : 'No'}</div>
              <div>Welcome temp closed: {wasTemporarilyClosed('welcome') ? 'Yes' : 'No'}</div>
              <div>Newsletter temp closed: {wasTemporarilyClosed('newsletter') ? 'Yes' : 'No'}</div>

              {/* Cooldown Information */}
              {wasTemporarilyClosed('welcome') && (
                <div className="text-blue-600">
                  Welcome cooldown: {formatCooldownTime(getTempCloseCooldownRemaining('welcome')) || 'Expired'}
                </div>
              )}
              {wasTemporarilyClosed('newsletter') && (
                <div className="text-blue-600">
                  Newsletter cooldown: {formatCooldownTime(getTempCloseCooldownRemaining('newsletter')) || 'Expired'}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleClearSessionStorage}
              className="w-full btn-outline text-sm py-2 flex items-center justify-center"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Clear Session Dismissals
            </button>
            
            <button
              onClick={handleClearLocalStorage}
              className="w-full btn-outline text-sm py-2 flex items-center justify-center text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All Popup Data
            </button>

            <div className="border-t pt-2 space-y-1">
              <button
                onClick={handleTriggerWelcomePopup}
                className="w-full btn-primary text-xs py-1"
              >
                Test Welcome Popup
              </button>
              <button
                onClick={handleTriggerNewsletterPopup}
                className="w-full btn-primary text-xs py-1"
              >
                Test Newsletter Popup
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 border-t pt-2">
            <p><strong>Session dismissals</strong> reset when browser session ends.</p>
            <p><strong>Popup states</strong> persist across sessions.</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PopupDebugPanel;
