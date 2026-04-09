'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // Already installed, don't show prompt
    }

    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show install prompt after 3 seconds
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Show again after 24 hours
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  if (!showInstallPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl animate-slide-up md:hidden">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <img src="/logo.jpg" alt="TMS" className="w-10 h-10 rounded-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold">Install TMS App</h3>
                <p className="text-xs opacity-90">Quick access from home screen</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full mt-3 bg-white text-blue-600 font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 hover:bg-blue-50 transition-all shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span>Install App</span>
          </button>
        </div>
      </div>

      {/* Desktop Floating Button */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-200 p-4 max-w-sm animate-bounce-slow">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <img src="/logo.jpg" alt="TMS" className="w-10 h-10 rounded-lg" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Install TMS App</h3>
                <p className="text-xs text-gray-600">Access from desktop</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-gray-100 rounded-lg transition-all"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <button
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span>Install Now</span>
          </button>
        </div>
      </div>
    </>
  );
}
