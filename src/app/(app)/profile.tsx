import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Switch,
  Alert,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useBlood } from '@/hooks/useBlood';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Border, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { PreScreenModal } from '@/components/PreScreenModal';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, updateAvailability, logout } = useAuth();
  const { requests, schedules, resetMockData } = useBlood();

  const [modalVisible, setModalVisible] = useState(false);

  const toggleAvailability = (value: boolean) => {
    updateAvailability(value);
    Alert.alert(
      value ? 'Status: Active' : 'Status: Paused',
      value 
        ? 'You are now visible to hospitals for emergency matching.' 
        : 'You will not receive emergency alerts temporarily.'
    );
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset App State',
      'This will reset your mock donation schedules, urgent requests, and health clearance status to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Defaults',
          style: 'destructive',
          onPress: () => {
            resetMockData();
            Alert.alert('Success', 'Application state has been reset to defaults.');
          },
        },
      ]
    );
  };

  const completedDonationsCount = schedules.filter((s) => s.status === 'COMPLETED').length;
  const livesSavedCount = completedDonationsCount * 3;

  return (
    <ScrollView style={[styles.scrollView, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        
        {/* Profile Card */}
        <ThemedView type="surface" style={styles.profileCard}>
          <View style={[styles.avatarBg, { backgroundColor: theme.primary + '1A' }]}>
            <Ionicons name="person" size={48} color={theme.primary} />
          </View>
          <View style={styles.profileMeta}>
            <ThemedText style={styles.profileName}>{user?.name || 'Sarah Connor'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{user?.email}</ThemedText>
            
            <View style={styles.bloodTypeRow}>
              <View style={[styles.bloodTypePill, { backgroundColor: theme.primary }]}>
                <ThemedText type="smallBold" style={styles.bloodTypeText}>
                  Blood Type: {user?.bloodType}
                </ThemedText>
              </View>
              <View style={[styles.locationCol]}>
                <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary" style={{ marginLeft: 4 }}>
                  Algiers
                </ThemedText>
              </View>
            </View>
          </View>
        </ThemedView>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <ThemedView type="surface" style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {completedDonationsCount}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Donations</ThemedText>
          </ThemedView>
          
          <ThemedView type="surface" style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: theme.tertiary }]}>
              {livesSavedCount}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Lives Saved</ThemedText>
          </ThemedView>

          <ThemedView type="surface" style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: theme.secondary }]}>
              {requests.length}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Matches</ThemedText>
          </ThemedView>
        </View>

        {/* Health Pre-Screening Section */}
        <ThemedText style={styles.sectionTitle}>Medical Eligibility</ThemedText>
        
        {user?.healthClearanceToken ? (
          <ThemedView type="surface" style={[styles.clearanceCard, { borderLeftColor: theme.tertiary }]}>
            <View style={styles.clearanceHeader}>
              <View style={styles.clearanceTitleCol}>
                <Ionicons name="checkmark-circle" size={20} color={theme.tertiary} />
                <ThemedText type="smallBold" style={{ color: theme.tertiary, marginLeft: 6 }}>
                  Cleared for Donation
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>Re-evaluate</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={[styles.tokenBox, { backgroundColor: theme.background }]}>
              <View>
                <ThemedText type="small" themeColor="textSecondary">Clearance Code</ThemedText>
                <ThemedText type="code" style={styles.tokenText}>{user.healthClearanceToken}</ThemedText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <ThemedText type="small" themeColor="textSecondary">Checked At</ThemedText>
                <ThemedText type="small" style={{ marginTop: 4 }}>
                  {new Date(user.healthCheckedAt || '').toLocaleDateString()}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              Your questionnaire status has been uploaded. Present this code at the hospital check-in to bypass pre-donation paperwork.
            </ThemedText>
          </ThemedView>
        ) : (
          <ThemedView type="surface" style={[styles.clearanceCard, { borderLeftColor: theme.primary }]}>
            <View style={styles.clearanceHeader}>
              <View style={styles.clearanceTitleCol}>
                <Ionicons name="alert-circle" size={20} color={theme.primary} />
                <ThemedText type="smallBold" style={{ color: theme.primary, marginLeft: 6 }}>
                  Pre-Screening Required
                </ThemedText>
              </View>
            </View>
            
            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
              Complete your pre-screening health check on your phone. This prevents walk-in clinic rejection and secures your eligibility.
            </ThemedText>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primary }]}
              onPress={() => setModalVisible(true)}
            >
              <ThemedText style={styles.actionBtnText}>Start Questionnaire</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* Settings Area */}
        <ThemedText style={styles.sectionTitle}>Account Actions</ThemedText>
        
        <ThemedView type="surface" style={styles.settingsGroup}>
          {/* Availability Toggle */}
          <View style={styles.settingsRow}>
            <View style={styles.settingsMeta}>
              <ThemedText type="smallBold">Emergency Availability</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Receive hospital match notifications</ThemedText>
            </View>
            <Switch
              trackColor={{ false: theme.border, true: theme.primary + '80' }}
              thumbColor={user?.isAvailable ? theme.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleAvailability}
              value={user?.isAvailable}
            />
          </View>

          {/* Reset Application State */}
          <TouchableOpacity
            style={[styles.settingsRow, styles.borderTop, { borderTopColor: theme.border }]}
            onPress={handleResetData}
          >
            <View style={styles.settingsMeta}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>Reset Application Data</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Clear mock schedules & clearance</ThemedText>
            </View>
            <Ionicons name="refresh-outline" size={20} color={theme.primary} />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.settingsRow, styles.borderTop, { borderTopColor: theme.border }]}
            onPress={logout}
          >
            <View style={styles.settingsMeta}>
              <ThemedText type="smallBold" style={{ color: theme.error }}>Sign Out</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Clear auth token from SecureStore</ThemedText>
            </View>
            <Ionicons name="log-out-outline" size={20} color={theme.error} />
          </TouchableOpacity>
        </ThemedView>

      </ThemedView>

      {/* Pre-Screen Modal */}
      <PreScreenModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Border.radiusMd,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: Spacing.four,
  },
  avatarBg: {
    width: 80,
    height: 80,
    borderRadius: Border.radiusFull,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    ...Typography.headlineMD,
    fontSize: 18,
    fontWeight: '700',
  },
  bloodTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  bloodTypePill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Border.radiusFull,
  },
  bloodTypeText: {
    color: '#ffffff',
    fontSize: 11,
  },
  locationCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Border.radiusMd,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  sectionTitle: {
    ...Typography.headlineMD,
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.three,
    marginBottom: Spacing.half,
  },
  clearanceCard: {
    padding: Spacing.four,
    borderRadius: Border.radiusMd,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: Spacing.three,
  },
  clearanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearanceTitleCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Border.radiusDefault,
  },
  tokenText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  actionBtn: {
    height: 44,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  settingsGroup: {
    borderRadius: Border.radiusMd,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
  },
  borderTop: {
    borderTopWidth: 1,
  },
  settingsMeta: {
    flex: 1,
    paddingRight: Spacing.two,
  },
});
