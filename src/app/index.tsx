import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { isAuthenticated } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check if Zustand store has hydrated
    const unsubHydrate = useAuthStore.persist.onHydrate(() => setIsHydrated(false));
    const unsubFinishHydrate = useAuthStore.persist.onFinishHydration(() => setIsHydrated(true));
    
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubHydrate();
      unsubFinishHydrate();
    };
  }, []);

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9e001f" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={"/(app)/home" as any} />;
  }

  return <Redirect href={"/login" as any} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
});
