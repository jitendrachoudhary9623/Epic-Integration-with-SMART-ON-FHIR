import { useState, useEffect } from 'react';

export const useSessionTimer = () => {
  const [expiryTime, setExpiryTime] = useState(0);

  useEffect(() => {
    const expiresAt = localStorage.getItem('expires_at') || '0';
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = Math.max(0, parseInt(expiresAt, 10) - now);
    setExpiryTime(expiresIn);

    const timer = setInterval(() => {
      setExpiryTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds:any) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return { expiryTime, formatTime };
};