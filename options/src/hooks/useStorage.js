import { useState, useEffect } from 'react';

export function useStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await chrome.storage.sync.get(key);
        setValue(result[key] || defaultValue);
        setError(null);
      } catch (err) {
        setError(err);
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // 监听存储变化
    const handleStorageChange = (changes, namespace) => {
      if (namespace === 'sync' && changes[key]) {
        setValue(changes[key].newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [key]);

  const updateValue = async (newValue) => {
    try {
      await chrome.storage.sync.set({ [key]: newValue });
      setValue(newValue);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('Failed to update data:', err);
      throw err;
    }
  };

  return {
    value,
    setValue: updateValue,
    loading,
    error
  };
}