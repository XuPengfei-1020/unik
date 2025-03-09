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
        // 使用默认值作为后备
        setValue(changes[key].newValue || defaultValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [key, defaultValue]); // 添加 defaultValue 到依赖数组

  const updateValue = async (newValue) => {
    try {
      // 确保不存储 undefined 或 null
      const valueToStore = newValue || defaultValue;
      await chrome.storage.sync.set({ [key]: valueToStore });
      setValue(valueToStore);
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