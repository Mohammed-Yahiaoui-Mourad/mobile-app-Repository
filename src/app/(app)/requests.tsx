import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  FlatList,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { useBlood } from '@/hooks/useBlood';
import { BloodRequest } from '@/stores/blood';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, Border } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RequestsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { requests, allRequests, respondToInvitation } = useBlood();
  
  const [filterType, setFilterType] = useState<'LIVE' | 'MY'>('LIVE');

  // Modal confirm RSVP State
  const [selectedReq, setSelectedReq] = useState<BloodRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 180s TTL countdown

  // Live compatible matches list
  const liveMatches = requests;

  // Requests created by the user (simulated)
  const myRequests = allRequests.filter(
    (r) => r.patientCondition === 'Emergency Case (Broadcasted)' || r.id.startsWith('user_req_')
  );

  // Countdown timer for invitation lock
  useEffect(() => {
    if (!modalVisible) return;

    if (timeLeft === 0) {
      const timeout = setTimeout(() => {
        setModalVisible(false);
        Alert.alert(
          'Invitation Expired',
          'The reservation lock has expired. The request has been cascaded to the next eligible donor.'
        );
      }, 0);

      return () => clearTimeout(timeout);
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
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
      
      {/* 2-Tab Filter Bar */}
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
