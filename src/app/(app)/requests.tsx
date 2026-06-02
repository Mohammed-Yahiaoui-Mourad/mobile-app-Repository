import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  FlatList,
  Modal,
  Alert,
  TextInput,
  Dimensions,
} from 'react-native';
import { useBlood } from '@/hooks/useBlood';
import { BloodRequest } from '@/stores/blood';
import { useAuth } from '@/hooks/useAuth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Border, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from 'react-native-paper';

export default function RequestsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { user } = useAuth();
  const { requests, allRequests, respondToInvitation, createBloodRequest } = useBlood();
  
  const [filterType, setFilterType] = useState<'LIVE' | 'CREATE' | 'MY'>('LIVE');
  
  // Create Request Form State
  const [patientName, setPatientName] = useState('');
  const [bloodType, setBloodType] = useState('O-');
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('Mustapha Pacha University Hospital');
  const [urgencyLevel, setUrgencyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal confirm RSVP State
  const [selectedReq, setSelectedReq] = useState<BloodRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 180s TTL countdown

  const hospitals = [
    { name: 'Mustapha Pacha University Hospital', address: 'Place du 1er Mai, Sidi M\'Hamed, Algiers', lat: 36.7562, lon: 3.0564 },
    { name: 'Nafissa Hamoud Hospital (Parnet)', address: 'Hussein Dey, Algiers', lat: 36.7389, lon: 3.0894 },
    { name: 'Bologhine Hospital', address: 'Bologhine, Algiers', lat: 36.8012, lon: 3.0392 },
  ];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(hospitalSearch.toLowerCase())
  );

  // Live compatible matches list
  const liveMatches = requests;

  // Requests created by the user (simulated)
  const myRequests = allRequests.filter(
    (r) => r.patientCondition === 'Emergency Case (Broadcasted)' || r.id.startsWith('user_req_')
  );

  // Countdown timer for invitation lock
  useEffect(() => {
    let timer: any;
    if (modalVisible && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && modalVisible) {
      setModalVisible(false);
      Alert.alert(
        'Invitation Expired',
        'The reservation lock has expired. The request has been cascaded to the next eligible donor.'
      );
    }
    return () => clearInterval(timer);
  }, [modalVisible, timeLeft]);

  const openAcceptModal = (req: BloodRequest) => {
    setSelectedReq(req);
    setTimeLeft(180); // Reset timer
    setModalVisible(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedReq) return;
    
    setModalVisible(false);
    const success = await respondToInvitation('inv_001', true);
    if (success) {
      Alert.alert(
        'RSVP Successful!',
        `Your reservation at ${selectedReq.hospitalName} is secured. The medical team is expecting you.`,
        [{ text: 'Go to Directions', onPress: () => router.push('/(app)/schedule' as any) }]
      );
    } else {
      Alert.alert('Error', 'This invitation has already expired or been claimed.');
    }
  };

  const handleDeclineRequest = async (reqId: string) => {
    Alert.alert(
      'Decline Request',
      'Declining this request will immediately dispatch notifications to the next compatible donors in the queue. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline & Cascade',
          style: 'destructive',
          onPress: async () => {
            await respondToInvitation('inv_001', false);
            Alert.alert('Request Declined', 'Notification has cascaded to the next donor.');
          }
        }
      ]
    );
  };

  const handleBroadcast = async () => {
    if (!patientName.trim()) {
      Alert.alert('Validation Error', 'Please enter the patient legal name');
      return;
    }

    const hospitalObj = hospitals.find(h => h.name === selectedHospital);
    if (!hospitalObj) return;

    setIsSubmitting(true);
    try {
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
          `Emergency request for ${bloodType} has been broadcasted to all matching donors.`,
          [{ text: 'View Matches', onPress: () => {
            setFilterType('MY');
            // reset form
            setPatientName('');
            setHospitalSearch('');
          }}]
        );
      }
    } catch {
      Alert.alert('Error', 'Unable to broadcast request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return theme.error;
      case 'MEDIUM':
        return theme.primary;
      default:
        return theme.secondary;
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* 3-Tab Filter Bar */}
      <View style={[styles.filterBar, { borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'LIVE' && { borderBottomColor: theme.primary }]}
          onPress={() => setFilterType('LIVE')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filterType === 'LIVE' ? { color: theme.primary, fontWeight: '700' } : { color: theme.textSecondary }
            ]}
          >
            Live Matches
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'CREATE' && { borderBottomColor: theme.primary }]}
          onPress={() => setFilterType('CREATE')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filterType === 'CREATE' ? { color: theme.primary, fontWeight: '700' } : { color: theme.textSecondary }
            ]}
          >
            Create Request
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'MY' && { borderBottomColor: theme.primary }]}
          onPress={() => setFilterType('MY')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filterType === 'MY' ? { color: theme.primary, fontWeight: '700' } : { color: theme.textSecondary }
            ]}
          >
            My Requests
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Screen Views */}
      {filterType === 'CREATE' ? (
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <ThemedView type="surface" style={styles.formCard}>
            <ThemedText style={styles.formTitle}>Broadcast New Emergency Request</ThemedText>
            
            {/* Patient Name */}
            <View style={styles.formGroup}>
              <ThemedText type="smallBold" style={styles.formLabel}>Patient Name</ThemedText>
              <TextInput
                style={[styles.formInput, { borderColor: theme.border, color: theme.text }]}
                placeholder="Full legal name"
                placeholderTextColor={theme.textSecondary}
                value={patientName}
                onChangeText={setPatientName}
              />
            </View>

            {/* Blood Type Grid Selection */}
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

            {/* Units counter */}
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

            {/* Location Selector */}
            <View style={styles.formGroup}>
              <ThemedText type="smallBold" style={styles.formLabel}>Hospital Location</ThemedText>
              <TextInput
                style={[styles.formInput, { borderColor: theme.border, color: theme.text }]}
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

            {/* Banner */}
            <View style={[styles.infoBanner, { backgroundColor: theme.error + '0D', borderColor: theme.error }]}>
              <Ionicons name="information-circle-outline" size={20} color={theme.error} style={{ marginRight: 8 }} />
              <ThemedText type="small" style={{ color: theme.error, flex: 1, lineHeight: 16 }}>
                Lives depend on speed. Broadcasting your request alerts 50+ compatible donors in your area within 30 seconds.
              </ThemedText>
            </View>

            {/* Submit */}
            <Button
              mode="contained"
              onPress={handleBroadcast}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={[styles.submitRequestBtn, { backgroundColor: theme.primary }]}
              contentStyle={{ height: 48 }}
            >
              Broadcast Request
            </Button>
          </ThemedView>
        </ScrollView>
      ) : (
        /* Requests Lists (Live compatible or My requests) */
        <FlatList
          data={filterType === 'LIVE' ? liveMatches : myRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-dislike-outline" size={48} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.two, textAlign: 'center' }}>
                {filterType === 'LIVE' 
                  ? 'No active matching requests in your area.' 
                  : 'You have not created any emergency requests yet.'}
              </ThemedText>
            </View>
          }
          renderItem={({ item }) => (
            <ThemedView
              type="surface"
              style={[
                styles.card,
                { borderLeftColor: getUrgencyColor(item.urgency) }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.hospitalInfo}>
                  <ThemedText type="smallBold">{item.hospitalName}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.distanceKm}km away • {item.hospitalAddress.split(',')[1]?.trim() || 'Algiers'}
                  </ThemedText>
                </View>
                <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) + '1A' }]}>
                  <ThemedText type="smallBold" style={{ color: getUrgencyColor(item.urgency), fontSize: 10 }}>
                    {item.urgency}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.cardBody}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.conditionLabel}>
                  Patient Condition / Details:
                </ThemedText>
                <ThemedText type="small" style={styles.conditionText}>
                  {item.patientCondition}
                </ThemedText>

                <View style={[styles.progressSection, { backgroundColor: theme.background }]}>
                  <View style={styles.progressTextRow}>
                    <ThemedText type="smallBold">
                      Required Type: <ThemedText type="smallBold" style={{ color: theme.primary }}>{item.bloodType}</ThemedText>
                    </ThemedText>
                    <ThemedText type="small">
                      {item.unitsCollected}/{item.unitsRequired} Units
                    </ThemedText>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.border }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: getUrgencyColor(item.urgency),
                          width: `${(item.unitsCollected / item.unitsRequired) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {filterType === 'LIVE' && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.declineBtn, { borderColor: theme.border }]}
                    onPress={() => handleDeclineRequest(item.id)}
                  >
                    <ThemedText type="smallBold" themeColor="textSecondary">Decline</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.acceptBtn, { backgroundColor: theme.primary }]}
                    onPress={() => openAcceptModal(item)}
                  >
                    <ThemedText style={styles.acceptBtnText}>Accept RSVP</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </ThemedView>
          )}
        />
      )}

      {/* Accept & RSVP Modal with countdown */}
      {selectedReq && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <ThemedView type="surface" style={styles.modalCard}>
              <View style={styles.modalCardHeader}>
                <ThemedText style={[styles.modalTitle, { color: theme.error }]}>
                  Emergency RSVP Confirmation
                </ThemedText>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.timerContainer}>
                <Ionicons name="alarm-outline" size={20} color={theme.error} />
                <ThemedText type="smallBold" style={{ color: theme.error }}>
                  Reservation Lock active: {timeLeft}s remaining
                </ThemedText>
              </View>

              <View style={[styles.modalInfoBox, { borderColor: theme.border }]}>
                <ThemedText type="smallBold">{selectedReq.hospitalName}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.half }}>
                  {selectedReq.hospitalAddress}
                </ThemedText>
                
                <View style={styles.modalSpecs}>
                  <View>
                    <ThemedText type="small" themeColor="textSecondary">Required Blood</ThemedText>
                    <ThemedText style={[styles.modalBloodType, { color: theme.primary }]}>
                      {selectedReq.bloodType}
                    </ThemedText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <ThemedText type="small" themeColor="textSecondary">Urgency</ThemedText>
                    <ThemedText type="smallBold" style={{ color: theme.error, marginTop: Spacing.half }}>
                      Immediate Action
                    </ThemedText>
                  </View>
                </View>
              </View>

              <ThemedText type="small" themeColor="textSecondary" style={styles.modalNotice}>
                By accepting this RSVP, you commit to arriving at the facility. If you do not arrive or confirm, the request will immediately recycle to the next closest match.
              </ThemedText>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: theme.border }]}
                  onPress={() => setModalVisible(false)}
                >
                  <ThemedText type="smallBold" themeColor="textSecondary">Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, { backgroundColor: theme.primary }]}
                  onPress={handleConfirmAccept}
                >
                  <ThemedText style={styles.modalConfirmBtnText}>Confirm Commitment</ThemedText>
                </TouchableOpacity>
              </View>
            </ThemedView>
          </View>
        </Modal>
      )}

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 50,
    backgroundColor: '#ffffff',
  },
  filterTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContainer: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
  },
  card: {
    borderRadius: Border.radiusMd,
    padding: Spacing.three,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  hospitalInfo: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Border.radiusFull,
  },
  cardBody: {
    marginBottom: Spacing.three,
  },
  conditionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  conditionText: {
    marginTop: 2,
    fontSize: 13,
  },
  progressSection: {
    marginTop: Spacing.two,
    padding: Spacing.two,
    borderRadius: Border.radiusDefault,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressBarBg: {
    height: 6,
    borderRadius: Border.radiusFull,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Border.radiusFull,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  declineBtn: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Border.radiusLg,
    padding: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  modalInfoBox: {
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  modalSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    paddingTop: Spacing.two,
  },
  modalBloodType: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  modalNotice: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.four,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  // Form Scroll & styling
  formScroll: {
    padding: Spacing.three,
  },
  formCard: {
    padding: Spacing.four,
    borderRadius: Border.radiusMd,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: Spacing.three,
  },
  formTitle: {
    ...Typography.headlineMD,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  formGroup: {
    gap: Spacing.one,
  },
  formLabel: {
    fontSize: 14,
  },
  formInput: {
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
  submitRequestBtn: {
    marginTop: Spacing.two,
    borderRadius: Border.radiusDefault,
  },
});
