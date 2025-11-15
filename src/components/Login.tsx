/**
 * Login Component - Refactored with FHIR SDK
 *
 * This replaces the old Login component with SDK-powered authentication.
 * No more manual OAuth handling, PKCE, or EMR-specific logic!
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Lock, Activity, Server, CheckCircle, Heart, ChevronRight, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth, emrRegistry } from '@nirmiteeio/fhir-sdk';
import { useRouter } from 'next/navigation';

const HealthJourneyPortal = () => {
  const router = useRouter();
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [callbackProviderId, setCallbackProviderId] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  const [status, setStatus] = useState('');
  const authInitiated = useRef(false);

  // Check for OAuth callback and determine provider ID
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state && !authInitiated.current) {
      // Get provider ID from sessionStorage (set during authorize)
      const sessionProviderId = sessionStorage.getItem('fhir_sdk_auth_provider_id');

      if (sessionProviderId) {
        setCallbackProviderId(sessionProviderId);
        authInitiated.current = true;
      }
    } else {
      // Not a callback, load saved provider ID for login
      const savedProviderId = localStorage.getItem('selected_provider_id');
      if (savedProviderId) {
        setSelectedProviderId(savedProviderId);
      }
    }
  }, []);

  const providers = emrRegistry.listProviders();

  // Get auth client - use callback provider ID if handling callback, otherwise use selected
  const effectiveProviderId = callbackProviderId || selectedProviderId || 'epic';
  const authClient = useAuth(effectiveProviderId);

  // Handle OAuth callback
  useEffect(() => {
    if (!callbackProviderId) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state) {
      setStage(3);
      setStatus('Processing authentication...');

      // Save the full callback URL BEFORE clearing it
      const callbackUrl = window.location.href;

      // Clear URL params immediately
      window.history.replaceState({}, document.title, window.location.pathname);

      // Handle callback with SDK using saved URL
      authClient.handleCallback(callbackUrl)
        .then(() => {
          setStatus('Authentication successful! Redirecting...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        })
        .catch((error) => {
          console.error('Authentication failed:', error);
          setStatus(`Authentication failed: ${error.message}`);
          setStage(0);
          setCallbackProviderId(null);
          authInitiated.current = false;
        });
    }
  }, [callbackProviderId, authClient, router]);

  // Check if already authenticated
  useEffect(() => {
    // Check if we have tokens in storage
    const hasAccessToken = localStorage.getItem('fhir_sdk_access_token');
    const hasProviderId = localStorage.getItem('selected_provider_id');

    if (hasAccessToken && hasProviderId) {
      console.log('✅ Already authenticated, redirecting to dashboard...');
      router.push('/dashboard');
    }
  }, [router]);

  const handleEMRSelect = (providerId: string) => {
    setSelectedProviderId(providerId);
    localStorage.setItem('selected_provider_id', providerId);
    setStage(1);
  };

  const handleConnectClick = async () => {
    setStage(2);
    setStatus('Initiating secure connection...');

    try {
      // SDK handles all OAuth, PKCE, and EMR-specific logic!
      await authClient.login();
    } catch (error) {
      console.error('Login failed:', error);
      setStatus(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStage(0);
    }
  };

  const stageConfig = [
    { icon: Server, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Select EMR' },
    { icon: Lock, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Secure Connection' },
    { icon: Activity, color: 'text-purple-500', bgColor: 'bg-purple-100', label: 'Authenticating' },
    { icon: CheckCircle, color: 'text-teal-500', bgColor: 'bg-teal-100', label: 'Access Granted' },
  ];

  const renderStageContent = () => {
    switch(stage) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold">Welcome to Your Health Journey</h3>
            <p>This portal allows you to securely access and manage your medical records from various healthcare providers. Let's get started by selecting your EMR system.</p>
            <Select onValueChange={handleEMRSelect} value={selectedProviderId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your EMR system" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        );
      case 1:
        const selectedProvider = providers.find(p => p.id === selectedProviderId);
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold">Secure Connection</h3>
            <p>You've selected {selectedProvider?.name}. We're ready to establish a secure connection to access your medical records.</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Your data is encrypted end-to-end</li>
              <li>We comply with HIPAA regulations</li>
              <li>You control who sees your information</li>
              <li>SMART on FHIR compliant authentication</li>
            </ul>
            <Button className="w-full" onClick={handleConnectClick}>
              <Lock className="mr-2 h-4 w-4" /> Connect Securely
            </Button>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <Activity className="h-16 w-16 text-purple-500 mx-auto animate-pulse" />
            <h3 className="text-xl font-semibold">Establishing Secure Connection</h3>
            <p>We're securely connecting to your EMR system. This process ensures your data remains protected.</p>
            <p className="text-sm text-gray-500">{status}</p>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h3 className="text-xl font-semibold">Secure Authentication in Progress</h3>
            <div className="flex justify-center">
              <div className="p-4 bg-green-100 rounded-full">
                <Activity className="h-16 w-16 text-green-500 animate-pulse" />
              </div>
            </div>
            <p className="text-center">{status}</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Encrypting data transfer
              </li>
              <li className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Verifying user permissions
              </li>
              <li className="flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Establishing secure session
              </li>
            </ul>
            <p className="text-sm text-gray-500 italic">
              This process ensures the highest level of security for your medical information.
            </p>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      <div className="flex-1 p-8 flex flex-col justify-center items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Your Health Journey</h1>
          <p className="text-xl text-gray-600">Empowering you with secure access to your complete medical history</p>
        </motion.div>

        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="flex justify-between mb-12">
              {stageConfig.map((config, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger>
                      <motion.div
                        className={`rounded-full p-4 ${stage >= index ? config.bgColor : 'bg-gray-100'}`}
                        animate={{ scale: stage === index ? 1.1 : 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <config.icon className={`h-8 w-8 ${stage >= index ? config.color : 'text-gray-400'}`} />
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{config.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {renderStageContent()}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>

      <div className="w-1/3 bg-white p-8 flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-6">Why Use Our Health Portal?</h2>
        <ul className="space-y-4">
          {[
            { icon: Heart, text: "Comprehensive Health Overview" },
            { icon: Lock, text: "Bank-Level Security" },
            { icon: FileText, text: "Access to All Your Medical Records" },
            { icon: Activity, text: "Real-time Health Insights" },
            { icon: Info, text: "Educational Resources" },
          ].map((item, index) => (
            <motion.li
              key={index}
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <item.icon className="h-6 w-6 text-blue-500" />
              <span>{item.text}</span>
            </motion.li>
          ))}
        </ul>
        <Button variant="outline" className="mt-8">
          Learn More <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default HealthJourneyPortal;
