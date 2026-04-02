import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const UACContext = createContext();

export const UACProvider = ({ children }) => {
  const [config, setConfig] = useState({
    features: {
        dashboard: true,
        clients: true,
        accounts: true,
        transactions: true,
        invoices: true,
        reports: true,
        gst_reports: true,
        automation: true,
        audit_trail: true,
        settings: true
    },
    updated_at: null
  });
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/system/config');
      setConfig(res.data);
    } catch (error) {
      console.error("Failed to fetch system configuration:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    // Optional: Refresh config periodically (e.g., every 60 seconds)
    const interval = setInterval(fetchConfig, 60000);
    return () => clearInterval(interval);
  }, []);

  const updateConfig = async (newFeatures) => {
    try {
      await api.post('/system/config', newFeatures);
      await fetchConfig(); // Refresh local state
      return true;
    } catch (error) {
      console.error("Failed to update system configuration:", error);
      return false;
    }
  };

  const isEnabled = (feature) => {
    return config.features[feature] !== false;
  };

  return (
    <UACContext.Provider value={{ config, loading, fetchConfig, updateConfig, isEnabled }}>
      {children}
    </UACContext.Provider>
  );
};

export const useUAC = () => {
  const context = useContext(UACContext);
  if (context === undefined) {
    throw new Error('useUAC must be used within a UACProvider');
  }
  return context;
};
