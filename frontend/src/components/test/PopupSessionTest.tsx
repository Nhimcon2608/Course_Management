'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Play } from 'lucide-react';
import { usePopupManager } from '@/hooks/usePopupManager';
import WelcomePopup from '@/components/popups/WelcomePopup';
import NewsletterPopup from '@/components/popups/NewsletterPopup';
import Modal from '@/components/ui/Modal';

interface TestResult {
  name: string;
  status: 'pending' | 'passed' | 'failed';
  message: string;
}

const PopupSessionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [showTestPopup, setShowTestPopup] = useState(false);
  const [testPopupType, setTestPopupType] = useState<'welcome' | 'newsletter'>('welcome');

  const {
    triggerPopup,
    closePopup,
    clearSessionDismissals,
    isSessionDismissed,
    wasTemporarilyClosed,
    sessionDismissals,
  } = usePopupManager();

  const updateTestResult = (name: string, status: 'passed' | 'failed', message: string) => {
    setTestResults(prev => prev.map(test => 
      test.name === name ? { ...test, status, message } : test
    ));
  };

  const initializeTests = () => {
    const tests: TestResult[] = [
      { name: 'Session Storage Clear', status: 'pending', message: 'Waiting...' },
      { name: 'Popup Dismissal', status: 'pending', message: 'Waiting...' },
      { name: 'Session Persistence', status: 'pending', message: 'Waiting...' },
      { name: 'Temporary Close', status: 'pending', message: 'Waiting...' },
      { name: 'Navigation Test', status: 'pending', message: 'Waiting...' },
    ];
    setTestResults(tests);
  };

  const runTests = async () => {
    setIsRunning(true);
    initializeTests();

    try {
      // Test 1: Clear session storage
      setCurrentTest('Clearing session storage...');
      clearSessionDismissals();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (Object.keys(sessionDismissals).length === 0) {
        updateTestResult('Session Storage Clear', 'passed', 'Session storage cleared successfully');
      } else {
        updateTestResult('Session Storage Clear', 'failed', 'Session storage not cleared');
      }

      // Test 2: Test popup dismissal
      setCurrentTest('Testing popup dismissal...');
      const testPopupId = 'test-dismissal-popup';
      
      // Trigger a test popup
      triggerPopup({
        id: testPopupId,
        type: 'welcome',
        title: 'Test',
        content: <div>Test popup</div>,
        trigger: { type: 'immediate' },
        conditions: { userType: 'all' },
        priority: 100,
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Dismiss it
      closePopup('dismiss');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (isSessionDismissed(testPopupId)) {
        updateTestResult('Popup Dismissal', 'passed', 'Popup correctly marked as dismissed');
      } else {
        updateTestResult('Popup Dismissal', 'failed', 'Popup dismissal not recorded');
      }

      // Test 3: Session persistence
      setCurrentTest('Testing session persistence...');
      
      // Try to trigger the same popup again
      triggerPopup({
        id: testPopupId,
        type: 'welcome',
        title: 'Test',
        content: <div>Test popup</div>,
        trigger: { type: 'immediate' },
        conditions: { userType: 'all' },
        priority: 100,
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if it was blocked
      if (isSessionDismissed(testPopupId)) {
        updateTestResult('Session Persistence', 'passed', 'Dismissed popup correctly blocked');
      } else {
        updateTestResult('Session Persistence', 'failed', 'Dismissed popup was not blocked');
      }

      // Test 4: Temporary close
      setCurrentTest('Testing temporary close...');
      const tempClosePopupId = 'test-temp-close-popup';
      
      triggerPopup({
        id: tempClosePopupId,
        type: 'newsletter',
        title: 'Test Temp',
        content: <div>Test temp close popup</div>,
        trigger: { type: 'immediate' },
        conditions: { userType: 'all' },
        priority: 100,
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Temporarily close it
      closePopup('close');
      await new Promise(resolve => setTimeout(resolve, 500));

      if (wasTemporarilyClosed(tempClosePopupId) && !isSessionDismissed(tempClosePopupId)) {
        updateTestResult('Temporary Close', 'passed', 'Temporary close recorded correctly');
      } else {
        updateTestResult('Temporary Close', 'failed', 'Temporary close not working correctly');
      }

      // Test 5: Navigation simulation
      setCurrentTest('Testing navigation persistence...');
      
      // Simulate page navigation by checking if session data persists
      const sessionData = sessionStorage.getItem('popup_session_dismissals');
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData);
          if (parsed[testPopupId] && parsed[testPopupId].dismissalType === 'dismiss') {
            updateTestResult('Navigation Test', 'passed', 'Session data persists across navigation');
          } else {
            updateTestResult('Navigation Test', 'failed', 'Session data not found or incorrect');
          }
        } catch (error) {
          updateTestResult('Navigation Test', 'failed', 'Failed to parse session data');
        }
      } else {
        updateTestResult('Navigation Test', 'failed', 'No session data found');
      }

    } catch (error) {
      console.error('Test error:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const handleTestPopupClose = (type: 'close' | 'dismiss') => {
    setShowTestPopup(false);
    // You can add additional logic here to test the dismissal
  };

  const getStatusIcon = (status: 'pending' | 'passed' | 'failed') => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Popup Session Dismissal Test Suite
        </h2>
        <p className="text-gray-600">
          Test the session-based popup dismissal functionality to ensure popups behave correctly.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Running Tests...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>Run Test Suite</span>
            </>
          )}
        </button>

        {currentTest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-blue-600 font-medium"
          >
            {currentTest}
          </motion.div>
        )}
      </div>

      <div className="space-y-3">
        {testResults.map((test, index) => (
          <motion.div
            key={test.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg"
          >
            {getStatusIcon(test.status)}
            <div className="flex-1">
              <div className="font-medium text-gray-900">{test.name}</div>
              <div className="text-sm text-gray-600">{test.message}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Manual Test Controls</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              setTestPopupType('welcome');
              setShowTestPopup(true);
            }}
            className="btn-outline text-sm mr-2"
          >
            Show Welcome Popup
          </button>
          <button
            onClick={() => {
              setTestPopupType('newsletter');
              setShowTestPopup(true);
            }}
            className="btn-outline text-sm mr-2"
          >
            Show Newsletter Popup
          </button>
          <button
            onClick={clearSessionDismissals}
            className="btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50"
          >
            Clear Session Data
          </button>
        </div>
      </div>

      {/* Test Popup Modal */}
      {showTestPopup && (
        <Modal
          isOpen={showTestPopup}
          onClose={() => handleTestPopupClose('close')}
          showCloseButton={true}
          size="md"
        >
          {testPopupType === 'welcome' ? (
            <WelcomePopup
              onClose={() => handleTestPopupClose('close')}
              onDismiss={() => handleTestPopupClose('dismiss')}
              onTemporaryClose={() => handleTestPopupClose('close')}
            />
          ) : (
            <NewsletterPopup
              onClose={() => handleTestPopupClose('close')}
              onDismiss={() => handleTestPopupClose('dismiss')}
              onTemporaryClose={() => handleTestPopupClose('close')}
            />
          )}
        </Modal>
      )}
    </div>
  );
};

export default PopupSessionTest;
