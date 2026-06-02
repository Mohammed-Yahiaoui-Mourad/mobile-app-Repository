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
  TextInput,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useBlood } from '@/hooks/useBlood';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Border, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Portal, Modal as PaperModal, Card, Button } from 'react-native-paper';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user, updateAvailability } = useAuth();
  const { requests, respondToInvitation, createBloodRequest, isLoading } = useBlood();
  
  // Modal & Form State
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [bloodType, setBloodType] = useState('O-');
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('Mustapha Pacha University Hospital');
  const [urgencyLevel, setUrgencyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hospitals = [
    { name: 'Mustapha Pacha University Hospital', address: 'Place du 1er Mai, Sidi M\'Hamed, Algiers', lat: 36.7562, lon: 3.0564 },
    { name: 'Nafissa Hamoud Hospital (Parnet)', address: 'Hussein Dey, Algiers', lat: 36.7389, lon: 3.0894 },
    { name: 'Bologhine Hospital', address: 'Bologhine, Algiers', lat: 36.8012, lon: 3.0392 },
  ];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(hospitalSearch.toLowerCase())
  );

  const openRequestForm = (forSelf: boolean) => {
    if (forSelf) {
      setPatientName(user?.name || 'Sarah Connor');
      setBloodType(user?.bloodType || 'O-');
    } else {
      setPatientName('');
      setBloodType('O-');
    }
    setUnitsNeeded(1);
    setSelectedHospital('Mustapha Pacha University Hospital');
    setUrgencyLevel('HIGH');
    setRequestModalVisible(true);
  };

  const handleBroadcastRequest = async () => {
    if (!patientName.trim()) {
      Alert.alert('Validation Error', 'Please enter the patient legal name');
      return;
    }

    const hospitalObj = hospitals.find(h => h.name === selectedHospital);
    if (!hospitalObj) return;

    setIsSubmitting(true);
    try {
      // Execute the request creation aligned with backend schema
      const success = await createBloodRequest(
        patientName,
        bloodType,
        unitsNeeded,
        hospitalObj.name,
        hospitalObj.address,
        hospitalObj.lat,
        hospitalObj.lon,
        urgencyLevel
      );

      if (success) {
        Alert.alert(
          'Broadcast Sent! 🚨',
          `Emergency blood request for ${bloodType} has been broadcasted. Compatible donors within 30km are being matching.`,
          [{ text: 'View Requests', onPress: () => {
            setRequestModalVisible(false);
            router.push('/(app)/requests' as any);
          }}]
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to broadcast blood request.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getLastDonationText = () => {
    if (!user || !user.lastDonationDate) return 'Never';
    const lastDate = new Date(user.lastDonationDate);
    const diffTime = Math.abs(Date.now() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    return months > 0 ? `${months} months` : `${diffDays} days`;
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.scrollView, { backgroundColor: theme.background }]}>
        <ThemedView style={styles.container}>
          
          {/* Welcome Header (Without logout action) */}
          <View style={styles.headerRow}>
            <View>
              <ThemedText type="small" themeColor="textSecondary">Welcome back,</ThemedText>
              <ThemedText style={[styles.userName, { color: theme.primary }]}>
                Hello {user?.name || 'Sarah Connor'}
              </ThemedText>
            </View>
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '1A' }]}>
              <Ionicons name="person" size={20} color={theme.primary} />
            </View>
          </View>

          {/* Quick Actions Panel */}
          <Card style={[styles.quickActionsCard, { backgroundColor: theme.surface }]}>
            <Card.Content>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.quickActionsTitle}>
                Quick Actions
              </ThemedText>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity 
                  style={[styles.quickActionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => openRequestForm(true)}
                >
                  <Ionicons name="water-outline" size={24} color="#ffffff" />
                  <ThemedText style={styles.quickActionBtnText}>Request for You</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickActionBtn, { backgroundColor: theme.secondary }]}
                  onPress={() => openRequestForm(false)}
                >
                  <Ionicons name="people-outline" size={24} color="#ffffff" />
                  <ThemedText style={styles.quickActionBtnText}>Request for Another</ThemedText>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>

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

      {/* Broadcast Request Form Modal */}
      <Portal>
        <PaperModal
          visible={requestModalVisible}
          onDismiss={() => setRequestModalVisible(false)}
          contentContainerStyle={[styles.modalStyle, { backgroundColor: theme.surface }]}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Create Blood Request</ThemedText>
              <TouchableOpacity onPress={() => setRequestModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              {/* Patient Name */}
              <View style={styles.formGroup}>
                <ThemedText type="smallBold" style={styles.formLabel}>Patient Name</ThemedText>
                <TextInput
                  style={[styles.modalInput, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Full legal name"
                  placeholderTextColor={theme.textSecondary}
                  value={patientName}
                  onChangeText={setPatientName}
                />
              </View>

              {/* Blood Type Grid Selector */}
              <View style={styles.formGroup}>
                <ThemedText type="smallBold" style={styles.formLabel}>Required Blood Type</ThemedText>
                <View style={styles.bloodTypeGrid}>
                  {bloodTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.bloodTypeGridItem,
                        { borderColor: theme.border },
                        bloodType === type && { borderColor: theme.primary, backgroundColor: theme.primary + '1A' }
                      ]}
                      onPress={() => setBloodType(type)}
                    >
                      <ThemedText
                        type="smallBold"
                        style={bloodType === type ? { color: theme.primary } : { color: theme.textSecondary }}
                      >
                        {type}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Units Needed Counter */}
              <View style={styles.formGroup}>
                <ThemedText type="smallBold" style={styles.formLabel}>Units Needed (Pints)</ThemedText>
                <View style={[styles.counterRow, { borderColor: theme.border }]}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setUnitsNeeded(prev => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="remove" size={20} color={theme.text} />
                  </TouchableOpacity>
                  <ThemedText style={styles.counterText}>{unitsNeeded}</ThemedText>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setUnitsNeeded(prev => prev + 1)}
                  >
                    <Ionicons name="add" size={20} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Hospital Location Chip Selector */}
              <View style={styles.formGroup}>
                <ThemedText type="smallBold" style={styles.formLabel}>Hospital Location</ThemedText>
                <TextInput
                  style={[styles.modalInput, { borderColor: theme.border, color: theme.text }]}
                  placeholder="Search registered hospitals..."
                  placeholderTextColor={theme.textSecondary}
                  value={hospitalSearch}
                  onChangeText={setHospitalSearch}
                />
                
                <View style={styles.chipsContainer}>
                  {filteredHospitals.map((h) => (
                    <TouchableOpacity
                      key={h.name}
                      style={[
                        styles.hospitalChip,
                        { borderColor: theme.border },
                        selectedHospital === h.name && { borderColor: theme.primary, backgroundColor: theme.primary + '1A' }
                      ]}
                      onPress={() => setSelectedHospital(h.name)}
                    >
                      <ThemedText
                        type="small"
                        numberOfLines={1}
                        style={[
                          styles.chipText,
                          selectedHospital === h.name ? { color: theme.primary, fontWeight: '700' } : { color: theme.textSecondary }
                        ]}
                      >
                        {h.name.split(' ')[0]} {h.name.split(' ')[1]}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Urgency Selector */}
              <View style={styles.formGroup}>
                <ThemedText type="smallBold" style={styles.formLabel}>Urgency Level</ThemedText>
                <View style={styles.urgencyGrid}>
                  <TouchableOpacity
                    style={[
                      styles.urgencyItem,
                      { borderColor: theme.border },
                      urgencyLevel === 'LOW' && { borderColor: theme.secondary, backgroundColor: theme.secondary + '1A' }
                    ]}
                    onPress={() => setUrgencyLevel('LOW')}
                  >
                    <ThemedText type="smallBold" style={urgencyLevel === 'LOW' ? { color: theme.secondary } : { color: theme.textSecondary }}>LOW</ThemedText>
                    <ThemedText style={styles.urgencyTime}>48h+</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.urgencyItem,
                      { borderColor: theme.border },
                      urgencyLevel === 'MEDIUM' && { borderColor: theme.primary, backgroundColor: theme.primary + '0D' }
                    ]}
                    onPress={() => setUrgencyLevel('MEDIUM')}
                  >
                    <ThemedText type="smallBold" style={urgencyLevel === 'MEDIUM' ? { color: theme.primary } : { color: theme.textSecondary }}>MED</ThemedText>
                    <ThemedText style={styles.urgencyTime}>24h</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.urgencyItem,
                      { borderColor: theme.border },
                      urgencyLevel === 'HIGH' && { borderColor: theme.error, backgroundColor: theme.error + '1A' }
                    ]}
                    onPress={() => setUrgencyLevel('HIGH')}
                  >
                    <ThemedText type="smallBold" style={urgencyLevel === 'HIGH' ? { color: theme.error } : { color: theme.textSecondary }}>HIGH</ThemedText>
                    <ThemedText style={styles.urgencyTime}>6h</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Critical Info Banner */}
              <View style={[styles.infoBanner, { backgroundColor: theme.error + '0D', borderColor: theme.error }]}>
                <Ionicons name="information-circle-outline" size={20} color={theme.error} style={{ marginRight: 8 }} />
                <ThemedText type="small" style={{ color: theme.error, flex: 1, lineHeight: 16 }}>
                  Lives depend on speed. Broadcasting your request alerts 50+ compatible donors in your area within 30 seconds.
                </ThemedText>
              </View>

              {/* Broadcast Submit Button */}
              <Button
                mode="contained"
                onPress={handleBroadcastRequest}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={[styles.broadcastBtn, { backgroundColor: theme.primary }]}
                contentStyle={{ height: 48 }}
                labelStyle={{ fontSize: 14, fontWeight: '700' }}
              >
                Broadcast Request
              </Button>

            </View>
          </ScrollView>
        </PaperModal>
      </Portal>

    </View>
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
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: Border.radiusFull,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e3e6',
  },
  quickActionsCard: {
    borderRadius: Border.radiusMd,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Spacing.one,
  },
  quickActionsTitle: {
    marginBottom: Spacing.two,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  quickActionBtn: {
    flex: 1,
    height: 80,
    borderRadius: Border.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
    marginTop: Spacing.one,
    textAlign: 'center',
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
  // Modal & Form Styling
  modalStyle: {
    margin: Spacing.four,
    padding: Spacing.four,
    borderRadius: Border.radiusMd,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  modalTitle: {
    ...Typography.headlineMD,
    fontSize: 18,
    fontWeight: '700',
  },
  modalForm: {
    gap: Spacing.three,
  },
  formGroup: {
    gap: Spacing.one,
  },
  formLabel: {
    fontSize: 14,
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  bloodTypeGridItem: {
    width: (Dimensions.get('window').width - Spacing.four * 2 - Spacing.four * 2 - Spacing.two * 4) / 4,
    height: 40,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    backgroundColor: '#ffffff',
  },
  counterBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  hospitalChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Border.radiusFull,
    borderWidth: 1,
    maxWidth: 150,
  },
  chipText: {
    fontSize: 11,
  },
  urgencyGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  urgencyItem: {
    flex: 1,
    height: 60,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.one,
  },
  urgencyTime: {
    fontSize: 10,
    color: '#626567',
    marginTop: 2,
  },
  infoBanner: {
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
  },
  broadcastBtn: {
    marginTop: Spacing.two,
    borderRadius: Border.radiusDefault,
  },
});
