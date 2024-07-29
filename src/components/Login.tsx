import React, { useEffect, useState, useRef } from 'react';
import { Lock, Hospital } from 'lucide-react';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { useAuthCallback } from '@/hooks/useAuthCallback';

const Login = () => {
  const [status, setStatus] = useState<string>('');
  const { handleLogin } = useSmartAuth();
  const { verifyStateAndExchangeToken, isProcessingAuth } = useAuthCallback(setStatus);
  const authInitiated = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state && !isProcessingAuth && !authInitiated.current) {
      authInitiated.current = true;
      verifyStateAndExchangeToken(code, state);
    }
  }, [verifyStateAndExchangeToken, isProcessingAuth]);

  if (status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold mb-4">Authentication in progress</h2>
          <p>{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center text-gray-800">Login to Your EMR</h2>
          <p className="text-center text-gray-600">
            Connect securely with EPIC EMR using SMART on FHIR
          </p>
          <div className="flex justify-center">
            <div className="p-6 bg-blue-100 rounded-full">
              <Hospital size={48} className="text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center">
            Click the button below to securely connect with your EPIC EMR account.
          </p>
        </div>
        <div className="px-6 pb-6">
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
            onClick={handleLogin}
          >
            <Lock size={18} className="mr-2" />
            Connect to EPIC EMR
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;