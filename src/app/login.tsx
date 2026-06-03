import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Border, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { login, isLoading } = useAuth();
  
  const [email, setEmail] = useState('sarah.connor@amal.org');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');

  const handleAuth = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (isRegistering && !name) {
      setError('Please enter your full name');
      return;
    }

    setError(null);
    try {
      const success = await login(email, password);
      if (success) {
        // Successful login, navigate to app home screen
        router.replace('/(app)/home' as any);
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.keyboardContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <ThemedView style={styles.container}>
            {/* Logo / Hero Area */}
            <View style={styles.logoSection}>
              <View style={[styles.logoIcon, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.logoSymbol}>A</ThemedText>
              </View>
              <ThemedText style={styles.brandTitle}>VITAL LIFE / AMAL</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.brandSubtitle}>
                Every Drop Counts. Every Second Matters.
              </ThemedText>
            </View>

            {/* Form Card */}
            <ThemedView type="surface" style={styles.formCard}>
              <ThemedText style={styles.formTitle}>
                {isRegistering ? 'Create Donor Account' : 'Sign In as Donor'}
              </ThemedText>
              
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: theme.error + '1A' }]}>
                  <ThemedText style={[styles.errorText, { color: theme.error }]}>
                    {error}
                  </ThemedText>
                </View>
              )}

              {isRegistering && (
                <View style={styles.inputGroup}>
                  <ThemedText type="smallBold" style={styles.inputLabel}>
                    Full Name
                  </ThemedText>
                  <TextInput
                    style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
                    placeholder="Sarah Connor"
                    placeholderTextColor={theme.textSecondary}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setError(null);
                    }}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.inputLabel}>
                  Email Address
                </ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
                  placeholder="example@amal.org"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.inputLabel}>
                  Password
                </ThemedText>
                <TextInput
                  style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: theme.primary }]}
                onPress={handleAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <ThemedText style={styles.authButtonText}>
                    {isRegistering ? 'Register & Set Available' : 'Sign In Now'}
                  </ThemedText>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                }}
              >
                <ThemedText type="small" style={{ color: theme.primary, textAlign: 'center' }}>
                  {isRegistering
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* Quick Mock Access Info */}
            <View style={styles.mockInfo}>
              <ThemedText type="code" themeColor="textSecondary" style={styles.mockInfoText}>
                Mock User: sarah.connor@amal.org / password123
              </ThemedText>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: Border.radiusLg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: Spacing.two,
  },
  logoSymbol: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  brandTitle: {
    ...Typography.headlineMD,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: Spacing.one,
  },
  brandSubtitle: {
    marginTop: Spacing.half,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Border.radiusLg,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  formTitle: {
    ...Typography.headlineMD,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.four,
    textAlign: 'center',
  },
  errorContainer: {
    borderRadius: Border.radiusDefault,
    padding: Spacing.two,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: Spacing.three,
  },
  inputLabel: {
    marginBottom: Spacing.one,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
    backgroundColor: '#ffffff',
  },
  authButton: {
    height: 48,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  authButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  toggleButton: {
    marginTop: Spacing.four,
    paddingVertical: Spacing.half,
  },
  mockInfo: {
    marginTop: Spacing.five,
  },
  mockInfoText: {
    textAlign: 'center',
    fontSize: 11,
  },
});
