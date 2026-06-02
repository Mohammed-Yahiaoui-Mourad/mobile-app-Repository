import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { useBlood } from '@/hooks/useBlood';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Border, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RequestsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { requests, allRequests, respondToInvitation } = useBlood();
  
  const [filterType, setFilterType] = useState<'MATCHED' | 'ALL'>('MATCHED');
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 180s TTL countdown

  const currentRequests = filterType === 'MATCHED' ? requests : allRequests;

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

  const openAcceptModal = (req: any) => {
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

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Filter Tabs */}
      <View style={[styles.filterBar, { borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'MATCHED' && { borderBottomColor: theme.primary }]}
          onPress={() => setFilterType('MATCHED')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filterType === 'MATCHED' ? { color: theme.primary, fontWeight: '700' } : { color: theme.textSecondary }
            ]}
          >
            Compatible Matches
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'ALL' && { borderBottomColor: theme.primary }]}
          onPress={() => setFilterType('ALL')}
        >
          <ThemedText
            style={[
              styles.filterText,
              filterType === 'ALL' ? { color: theme.primary, fontWeight: '700' } : { color: theme.textSecondary }
            ]}
          >
            All Live Requests
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* List */}
      {currentRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-dislike-outline" size={48} color={theme.textSecondary} />
          <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.two, textAlign: 'center' }}>
            No active blood requests found.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={currentRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <ThemedView
              type="surface"
              style={[
                styles.card,
                { borderLeftColor: item.urgency === 'HIGH' ? theme.error : theme.primary }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.hospitalInfo}>
                  <ThemedText type="smallBold">{item.hospitalName}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.distanceKm}km away • {item.hospitalAddress.split(',')[1]?.trim() || 'Algiers'}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.urgencyBadge,
                    {
                      backgroundColor:
                        item.urgency === 'HIGH'
                          ? theme.error + '1A'
                          : item.urgency === 'MEDIUM'
                          ? theme.primary + '1A'
                          : theme.secondary + '1A',
                    },
                  ]}
                >
                  <ThemedText
                    type="smallBold"
                    style={{
                      color:
                        item.urgency === 'HIGH'
                          ? theme.error
                          : item.urgency === 'MEDIUM'
                          ? theme.primary
                          : theme.secondary,
                      fontSize: 10,
                    }}
                  >
                    {item.urgency}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.cardBody}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.conditionLabel}>
                  Patient Condition:
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
                          backgroundColor: item.urgency === 'HIGH' ? theme.error : theme.primary,
                          width: `${(item.unitsCollected / item.unitsRequired) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

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
              <View style={styles.modalHeader}>
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
  },
  filterTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
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
  modalHeader: {
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
});
