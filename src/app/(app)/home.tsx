import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Switch,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useBlood } from '@/hooks/useBlood';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Border, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, updateAvailability, logout } = useAuth();
  const { requests, respondToInvitation, isLoading } = useBlood();
  
  const [activeTab, setActiveTab] = useState('home');

  const toggleAvailability = (value: boolean) => {
    updateAvailability(value);
    Alert.alert(
      value ? 'Status: Active' : 'Status: Paused',
      value 
        ? 'You are now visible to hospitals for emergency matching.' 
        : 'You will not receive emergency alerts temporarily.'
    );
  };

  const handleAcceptRequest = async (requestId: string, hospitalName: string) => {
    // Find the invitation for this request if any
    Alert.alert(
      'Confirm Emergency RSVP',
      `Are you sure you want to respond to the emergency request at ${hospitalName}? This will lock your slot for 180 seconds.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept & Lock Slot', 
          onPress: async () => {
            const success = await respondToInvitation('inv_001', true);
            if (success) {
              Alert.alert(
                'RSVP Confirmed!',
                'Your slot has been locked. Please proceed to the hospital immediately.',
                [{ text: 'View Navigation', onPress: () => router.push('/(app)/schedule' as any) }]
              );
            } else {
              Alert.alert('Error', 'Unable to complete RSVP. The invitation may have expired.');
            }
          }
        }
      ]
    );
  };

  // Calculate time since last donation
  const getLastDonationText = () => {
    if (!user || !user.lastDonationDate) return 'Never';
    const lastDate = new Date(user.lastDonationDate);
    const diffTime = Math.abs(Date.now() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    return months > 0 ? `${months} months` : `${diffDays} days`;
  };

  return (
    <ScrollView style={[styles.scrollView, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.container}>
        
        {/* Welcome Section */}
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="small" themeColor="textSecondary">Welcome back,</ThemedText>
            <ThemedText style={[styles.userName, { color: theme.primary }]}>
              Hello {user?.name || 'Donor'}
            </ThemedText>
          </View>
          <TouchableOpacity onPress={logout} style={[styles.logoutBtn, { borderColor: theme.border }]}>
            <Ionicons name="log-out-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Bento Grid Stats */}
        <View style={styles.bentoGrid}>
          {/* Blood Type Card */}
          <ThemedView type="surface" style={[styles.bentoCard, styles.leftAccentCard, { borderLeftColor: theme.primary }]}>
            <ThemedText type="smallBold" themeColor="textSecondary">Blood Type</ThemedText>
            <View style={styles.cardInfoRow}>
              <ThemedText style={[styles.largeText, { color: theme.primary }]}>
                {user?.bloodType || 'O-'}
              </ThemedText>
              <Ionicons name="water" size={32} color={theme.primary} />
            </View>
          </ThemedView>

          {/* Eligibility Card */}
          <ThemedView type="surface" style={styles.bentoCard}>
            <ThemedText type="smallBold" themeColor="textSecondary">Eligibility</ThemedText>
            <View style={styles.cardInfoCol}>
              <View style={[styles.statusChip, { backgroundColor: theme.tertiary + '1A' }]}>
                <ThemedText type="smallBold" style={{ color: theme.tertiary, fontSize: 12 }}>
                  Eligible
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.cardDesc}>
                Ready to donate
              </ThemedText>
            </View>
          </ThemedView>

          {/* Availability Card */}
          <ThemedView type="surface" style={styles.bentoCard}>
            <ThemedText type="smallBold" themeColor="textSecondary">Availability</ThemedText>
            <View style={styles.cardInfoRow}>
              <ThemedText type="smallBold" style={styles.availabilityStatus}>
                {user?.isAvailable ? 'Active' : 'Paused'}
              </ThemedText>
              <Switch
                trackColor={{ false: theme.border, true: theme.primary + '80' }}
                thumbColor={user?.isAvailable ? theme.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleAvailability}
                value={user?.isAvailable}
              />
            </View>
          </ThemedView>

          {/* Last Donation Card */}
          <ThemedView type="surface" style={styles.bentoCard}>
            <ThemedText type="smallBold" themeColor="textSecondary">Last Donation</ThemedText>
            <View style={styles.cardInfoCol}>
              <ThemedText style={styles.medText}>{getLastDonationText()}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">ago</ThemedText>
            </View>
          </ThemedView>
        </View>

        {/* Urgent Nearby Requests Section */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Urgent Nearby Requests</ThemedText>
          <TouchableOpacity onPress={() => router.push('/(app)/requests' as any)}>
            <ThemedText style={{ color: theme.primary, fontWeight: '600' }}>View All</ThemedText>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={theme.primary} size="large" style={styles.loader} />
        ) : requests.length === 0 ? (
          <ThemedView type="surface" style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color={theme.tertiary} />
            <ThemedText style={styles.emptyText}>No urgent requests in your area matching your profile.</ThemedText>
          </ThemedView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {requests.map((req) => (
              <ThemedView
                key={req.id}
                type="surface"
                style={[
                  styles.requestCard,
                  { borderLeftColor: req.urgency === 'HIGH' ? theme.error : theme.primary }
                ]}
              >
                {/* Urgency Badge */}
                {req.urgency === 'HIGH' && (
                  <View style={[styles.urgencyBadge, { backgroundColor: theme.error + '1A' }]}>
                    <Ionicons name="warning-outline" size={14} color={theme.error} style={styles.urgencyIcon} />
                    <ThemedText type="smallBold" style={{ color: theme.error, fontSize: 11 }}>
                      CRITICAL
                    </ThemedText>
                  </View>
                )}

                {/* Hospital Header */}
                <View style={styles.hospitalRow}>
                  <View style={[styles.hospitalIconBg, { backgroundColor: theme.primary + '10' }]}>
                    <Ionicons name="medical" size={20} color={req.urgency === 'HIGH' ? theme.error : theme.primary} />
                  </View>
                  <View style={styles.hospitalMeta}>
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.hospitalName}>
                      {req.hospitalName}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {req.distanceKm}km away • Emergency Unit
                    </ThemedText>
                  </View>
                </View>

                {/* Details Container */}
                <View style={[styles.detailsBox, { backgroundColor: theme.background }]}>
                  <View>
                    <ThemedText type="small" themeColor="textSecondary">Required Type</ThemedText>
                    <ThemedText style={[styles.detailBloodType, { color: req.urgency === 'HIGH' ? theme.error : theme.primary }]}>
                      {req.bloodType}
                    </ThemedText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText type="small" themeColor="textSecondary">Urgency Level</ThemedText>
                    <ThemedText type="smallBold" style={{ color: req.urgency === 'HIGH' ? theme.error : theme.primary, marginTop: Spacing.half }}>
                      {req.urgency === 'HIGH' ? 'Immediate' : 'High'}
                    </ThemedText>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: theme.primary }]}
                    onPress={() => handleAcceptRequest(req.id, req.hospitalName)}
                  >
                    <ThemedText style={styles.acceptBtnText}>Accept Request</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.dirBtn, { borderColor: theme.border }]}>
                    <Ionicons name="navigate-outline" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </ThemedView>
            ))}
          </ScrollView>
        )}

      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  userName: {
    ...Typography.headlineLG,
    fontWeight: '700',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: Border.radiusDefault,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  bentoCard: {
    width: (Dimensions.get('window').width - Spacing.four * 2 - Spacing.three) / 2,
    borderRadius: Border.radiusMd,
    padding: Spacing.three,
    height: 110,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftAccentCard: {
    borderLeftWidth: 4,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfoCol: {
    justifyContent: 'flex-end',
    flex: 1,
    marginTop: Spacing.one,
  },
  largeText: {
    fontSize: 32,
    fontWeight: '700',
  },
  medText: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Border.radiusFull,
    alignSelf: 'flex-start',
    marginBottom: Spacing.half,
  },
  cardDesc: {
    fontSize: 12,
  },
  availabilityStatus: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  sectionTitle: {
    ...Typography.headlineMD,
    fontSize: 18,
    fontWeight: '700',
  },
  horizontalScroll: {
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  requestCard: {
    width: 320,
    borderRadius: Border.radiusMd,
    padding: Spacing.three,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  urgencyBadge: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Border.radiusFull,
    zIndex: 10,
  },
  urgencyIcon: {
    marginRight: 4,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    paddingRight: 70, // Avoid overlap with urgency badge
  },
  hospitalIconBg: {
    width: 40,
    height: 40,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hospitalMeta: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.two,
    borderRadius: Border.radiusDefault,
    marginBottom: Spacing.three,
  },
  detailBloodType: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: Spacing.half,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  acceptBtn: {
    flex: 1,
    height: 44,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  dirBtn: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: Border.radiusMd,
    padding: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#5b5f61',
  },
  loader: {
    marginVertical: Spacing.four,
  },
});
