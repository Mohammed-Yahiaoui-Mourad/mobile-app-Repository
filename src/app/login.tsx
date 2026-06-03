import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Border } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { login, register, isLoading, isAuthenticated } = useAuth();
  
  // Redirect to dashboard when already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home');
    }
  }, [isAuthenticated, router]);
  
  // Login fields
  const [email, setEmail] = useState('sarah.connor@amal.org');
  const [password, setPassword] = useState('password123');
  
  // Registration fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showBloodTypeDropdown, setShowBloodTypeDropdown] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const requestLocation = async () => {
    try {
      setLocationLoading(true);
      // For now, use default Casablanca coordinates for web/demo
      // In production, use proper geolocation API
      if (Platform.OS === 'web') {
        // Web: use geolocation API
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLatitude(position.coords.latitude);
              setLongitude(position.coords.longitude);
              setLocationLoading(false);
            },
            (error) => {
              console.warn('Geolocation error:', error);
              // Fallback to Casablanca coordinates
              setLatitude(33.5731);
              setLongitude(-7.5898);
              setLocationLoading(false);
            }
          );
        } else {
          // No geolocation support, use default
          setLatitude(33.5731);
          setLongitude(-7.5898);
          setLocationLoading(false);
        }
      } else {
        // Native: try using expo-location if available
        try {
          const { Location } = await import('expo-location');
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setError('Location permission required for donor registration');
            setLocationLoading(false);
            return;
          }

          const location = await Location.getCurrentPositionAsync({});
          setLatitude(location.coords.latitude);
          setLongitude(location.coords.longitude);
          setLocationLoading(false);
        } catch (err) {
          // Fallback
          setLatitude(33.5731);
          setLongitude(-7.5898);
          setLocationLoading(false);
        }
      }
    } catch (err) {
      console.error('Location error:', err);
      // Fallback to Casablanca coordinates
      setLatitude(33.5731);
      setLongitude(-7.5898);
      setLocationLoading(false);
    }
  };

  // Get user's location for donor signup
  useEffect(() => {
    if (isRegistering && latitude === null && longitude === null) {
      requestLocation();
    }
  }, [isRegistering, latitude, longitude]);
  

  const handleAuth = async () => {
    // Validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (isRegistering) {
      if (!fullName.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (!phoneNumber.trim()) {
        setError('Please enter your phone number');
        return;
      }
      if (!bloodType) {
        setError('Please select your blood type');
        return;
      }
      if (latitude === null || longitude === null) {
        // Auto-get location
        await requestLocation();
        return;
      }

      setError(null);
      try {
        const success = await register({
          email: email.toLowerCase(),
          password,
          full_name: fullName,
          phone_number: phoneNumber,
          blood_type: bloodType,
          latitude,
          longitude,
        });

        if (success) {
          router.replace('/home');
        } else {
          setError('Registration failed. Please try again.');
        }
      } catch (err: any) {
        const message = err.message || 'An unexpected error occurred. Please try again.';
        setError(message);
        Alert.alert('Registration Error', message);
      }
    } else {
      // Login
      setError(null);
      try {
        const success = await login(email.toLowerCase(), password);
        if (success) {
          router.replace('/home');
        } else {
          setError('Authentication failed. Please check your credentials.');
        }
      } catch (err: any) {
        const message = err.message || 'An unexpected error occurred. Please try again.';
        setError(message);
        Alert.alert('Login Error', message);
      }
    }
  };

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    if (!isRegistering) {
      // Switching to register mode, get location
      requestLocation();
    }
  };

  return (
    <SafeAreaView style={[styles.keyboardContainer, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
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
                <>
                  <View style={styles.inputGroup}>
                    <ThemedText type="smallBold" style={styles.inputLabel}>
                      Full Name
                    </ThemedText>
                    <TextInput
                      style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
                      placeholder="Sarah Connor"
                      placeholderTextColor={theme.textSecondary}
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        setError(null);
                      }}
                      autoCapitalize="words"
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <ThemedText type="smallBold" style={styles.inputLabel}>
                      Phone Number
                    </ThemedText>
                    <TextInput
                      style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
                      placeholder="+212 6XX XXX XXX"
                      placeholderTextColor={theme.textSecondary}
                      value={phoneNumber}
                      onChangeText={(text) => {
                        setPhoneNumber(text);
                        setError(null);
                      }}
                      keyboardType="phone-pad"
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <ThemedText type="smallBold" style={styles.inputLabel}>
                      Blood Type
                    </ThemedText>
                    <TouchableOpacity
                      style={[styles.textInput, { borderColor: theme.border, justifyContent: 'center' }]}
                      onPress={() => setShowBloodTypeDropdown(!showBloodTypeDropdown)}
                      disabled={isLoading}
                    >
                      <ThemedText style={{ color: theme.text }}>
                        {bloodType}
                      </ThemedText>
                    </TouchableOpacity>
                    {showBloodTypeDropdown && (
                      <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {BLOOD_TYPES.map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setBloodType(type);
                              setShowBloodTypeDropdown(false);
                              setError(null);
                            }}
                          >
                            <ThemedText style={{ color: theme.text }}>
                              {type}
                            </ThemedText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <ThemedText type="smallBold" style={styles.inputLabel}>
                      Location {locationLoading && '(detecting...)'}
                    </ThemedText>
                    <View style={[styles.textInput, { borderColor: theme.border, justifyContent: 'center' }]}>
                      {latitude !== null && longitude !== null ? (
                        <ThemedText type="small" style={{ color: theme.text }}>
                          Lat: {latitude.toFixed(4)}, Lon: {longitude.toFixed(4)}
                        </ThemedText>
                      ) : (
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {locationLoading ? 'Getting location...' : 'Tap to enable location'}
                        </ThemedText>
                      )}
                    </View>
                    {!locationLoading && (latitude === null || longitude === null) && (
                      <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: theme.primary }]}
                        onPress={requestLocation}
                        disabled={isLoading}
                      >
                        <ThemedText style={{ color: theme.primary }}>
                          Enable Location
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
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
                  editable={!isLoading}
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
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[styles.authButton, { backgroundColor: theme.primary, opacity: isLoading ? 0.6 : 1 }]}
                onPress={handleAuth}
                disabled={isLoading || (isRegistering && locationLoading)}
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
                onPress={handleToggleMode}
                disabled={isLoading}
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
                Demo: sarah.connor@amal.org / password123
              </ThemedText>
            </View>
          </ThemedView>
        </ScrollView>
      </View>
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
    fontSize: 20,
    lineHeight: 28,
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
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    marginBottom: Spacing.four,
    textAlign: 'center',
  },
  errorContainer: {
    borderRadius: Border.radiusMd,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  inputLabel: {
    marginBottom: Spacing.one,
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Border.radiusMd,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 14,
    height: 48,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: Border.radiusMd,
    marginTop: Spacing.two,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: Border.radiusMd,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
    alignItems: 'center',
  },
  authButton: {
    borderRadius: Border.radiusMd,
    paddingVertical: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.four,
    height: 48,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    paddingVertical: Spacing.three,
    marginTop: Spacing.three,
  },
  mockInfo: {
    marginTop: Spacing.six,
    alignItems: 'center',
  },
  mockInfoText: {
    fontSize: 11,
    textAlign: 'center',
  },
});
