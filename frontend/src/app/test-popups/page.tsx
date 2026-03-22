'use client';

import React from 'react';
import PopupSessionTest from '@/components/test/PopupSessionTest';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TestPopupsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Popup Session Dismissal Testing
          </h1>
          <p className="text-gray-600 max-w-3xl">
            This page provides comprehensive testing tools for the session-based popup dismissal functionality. 
            Use the test suite below to verify that popups behave correctly when dismissed or temporarily closed.
          </p>
        </div>

        <div className="grid gap-8">
          <PopupSessionTest />
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Testing Instructions
            </h2>
            
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Automated Test Suite</h3>
                <p>
                  Click "Run Test Suite" to automatically test all session dismissal functionality. 
                  The tests will verify that popups are correctly dismissed, session data persists, 
                  and temporary closes work as expected.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Manual Testing</h3>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Use the manual test controls to show popups</li>
                  <li>Try dismissing a popup using "Don't show again"</li>
                  <li>Try temporarily closing a popup using "Maybe later"</li>
                  <li>Navigate to different pages and verify behavior</li>
                  <li>Open a new tab/window to test session isolation</li>
                  <li>Close and reopen the browser to test session reset</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Expected Behavior</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Session Dismissal:</strong> Popup won't show again in the same browser session</li>
                  <li><strong>Temporary Close:</strong> Popup may show again later in the same session</li>
                  <li><strong>Navigation:</strong> Dismissal state persists when navigating between pages</li>
                  <li><strong>New Session:</strong> Dismissed popups can appear again in new browser sessions</li>
                  <li><strong>Storage:</strong> Session data is stored in sessionStorage, not localStorage</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Development Notes</h3>
                <p className="text-yellow-700">
                  This test page is only available in development mode. The debug panel on the home page 
                  provides additional tools for monitoring popup states and session dismissals in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
