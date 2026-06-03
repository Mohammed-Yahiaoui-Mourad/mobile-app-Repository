/**
 * Platform-aware secure storage
 * Uses expo-secure-store for native platforms (iOS/Android)
 * Falls back to localStorage for web platform
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface SecureStorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const isWeb = Platform.OS === 'web';

/**
 * Web storage implementation using localStorage
 */
const webStorage: SecureStorageInterface = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        console.warn(`Web storage unavailable during SSR for key ${key}`);
        return null;
      }
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn(`Web storage - Error reading key ${key}:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        console.warn(`Web storage unavailable during SSR for key ${key}`);
        return;
      }
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`Web storage - Error writing key ${key}:`, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
        console.warn(`Web storage unavailable during SSR for key ${key}`);
        return;
      }
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Web storage - Error removing key ${key}:`, error);
    }
  },
};

/**
 * Native storage implementation using expo-secure-store
 */
const nativeStorage: SecureStorageInterface = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`SecureStore - Error reading key ${key}:`, error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`SecureStore - Error writing key ${key}:`, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`SecureStore - Error removing key ${key}:`, error);
    }
  },
};

/**
 * Get the appropriate storage implementation for the current platform
 */
export const secureStorage: SecureStorageInterface = isWeb ? webStorage : nativeStorage;
