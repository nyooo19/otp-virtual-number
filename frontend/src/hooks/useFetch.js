import { useState, useEffect } from 'react';
import { useNotification } from './useNotification.js';

export const useFetch = (fn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { error: showError } = useNotification();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fn();
        setData(response.data?.data || response.data);
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setError(message);
        showError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};