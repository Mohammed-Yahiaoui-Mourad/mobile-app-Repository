import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useBlood } from '@/hooks/useBlood';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Border, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';

export default function ScheduleScreen() {
  const theme = useTheme();
  const { mySchedules, scheduleAppointment, cancelAppointment, isLoading } = useBlood();

  // Booking Form State
  const [hospital, setHospital] = useState('Mustapha Pacha University Hospital');
  const [date, setDate] = useState('2026-06-15');
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [bookingMode, setBookingMode] = useState(false);

  const hospitalsList = [
    { name: 'Mustapha Pacha University Hospital', address: 'Place du 1er Mai, Sidi M\'Hamed, Algiers' },
    { name: 'Nafissa Hamoud Hospital (Parnet)', address: 'Hussein Dey, Algiers' },
    { name: 'Bologhine Hospital', address: 'Bologhine, Algiers' },
  ];

  const timeSlotsList = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'];

  const handleBookAppointment = async () => {
    const selectedHospitalObj = hospitalsList.find((h) => h.name === hospital);
    if (!selectedHospitalObj) return;

    try {
      const success = await scheduleAppointment({
        scheduled_date: new Date(`${date}T${timeSlot}`).toISOString(),
        notes: `Appointment at ${selectedHospitalObj.name}`,
      });

      if (success) {
        Alert.alert(
          'Appointment Booked!',
          `Your appointment at ${selectedHospitalObj.name} on ${date} at ${timeSlot} has been confirmed.`,
          [{ text: 'OK', onPress: () => setBookingMode(false) }]
        );
      }
    } catch {
      Alert.alert('Error', 'Unable to book appointment.');
    }
  };

  const handleCancelAppointment = (id: string, hospitalName: string) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your donation appointment at ${hospitalName}?`,
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: async () => {
            await cancelAppointment(id);
            Alert.alert('Cancelled', 'Your donation appointment has been cancelled successfully.');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return theme.primary;
      case 'COMPLETED':
        return theme.tertiary;
      case 'CANCELLED':
        return theme.secondary;
      default:
        return theme.text;
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* View/Book Toggle */}
      <View style={styles.bookingToggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, !bookingMode && { backgroundColor: theme.primary }]}
          onPress={() => setBookingMode(false)}
        >
          <ThemedText style={{ color: !bookingMode ? '#ffffff' : theme.textSecondary, fontWeight: '700' }}>
            Appointments
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, bookingMode && { backgroundColor: theme.primary }]}
          onPress={() => setBookingMode(true)}
        >
          <ThemedText style={{ color: bookingMode ? '#ffffff' : theme.textSecondary, fontWeight: '700' }}>
            Book Slot
          </ThemedText>
        </TouchableOpacity>
      </View>

      {bookingMode ? (
        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
          <ThemedView type="surface" style={styles.formCard}>
            <ThemedText style={styles.formTitle}>Book a Donation Appointment</ThemedText>

            {/* Select Hospital */}
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" style={styles.label}>Select Blood Center / Hospital</ThemedText>
              {hospitalsList.map((h) => (
                <TouchableOpacity
                  key={h.name}
                  style={[
                    styles.radioBtn,
                    { borderColor: theme.border },
                    hospital === h.name && { borderColor: theme.primary, backgroundColor: theme.primary + '0D' },
                  ]}
                  onPress={() => setHospital(h.name)}
                >
                  <Ionicons
                    name={hospital === h.name ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={hospital === h.name ? theme.primary : theme.textSecondary}
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.two }}>
                    <ThemedText type="smallBold">{h.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{h.address}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Choose Date */}
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" style={styles.label}>Preferred Date (YYYY-MM-DD)</ThemedText>
              <TextInput
                style={[styles.textInput, { borderColor: theme.border, color: theme.text }]}
                value={date}
                onChangeText={setDate}
                placeholder="2026-06-15"
              />
            </View>

            {/* Choose Time Slot */}
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold" style={styles.label}>Select Time Slot</ThemedText>
              <View style={styles.slotsGrid}>
                {timeSlotsList.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.slotBtn,
                      { borderColor: theme.border },
                      timeSlot === s && { borderColor: theme.primary, backgroundColor: theme.primary + '1A' },
                    ]}
                    onPress={() => setTimeSlot(s)}
                  >
                    <ThemedText
                      type="small"
                      style={timeSlot === s ? { color: theme.primary, fontWeight: '700' } : {}}
                    >
                      {s}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              onPress={handleBookAppointment}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <ThemedText style={styles.submitBtnText}>Confirm Booking</ThemedText>
              )}
            </TouchableOpacity>
          </ThemedView>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {mySchedules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={theme.textSecondary} />
              <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.two }}>
                No donation appointments scheduled.
              </ThemedText>
            </View>
          ) : (
            mySchedules.map((item) => (
              <ThemedView key={item.id} type="surface" style={styles.scheduleCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerInfo}>
                    <ThemedText type="smallBold">{item.hospitalName}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>
                      {item.hospitalAddress}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '1A' }]}>
                    <ThemedText type="smallBold" style={{ color: getStatusColor(item.status), fontSize: 10 }}>
                      {item.status}
                    </ThemedText>
                  </View>
                </View>

                <View style={[styles.cardMetaRow, { borderColor: theme.border }]}>
                  <View style={styles.metaCol}>
                    <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ marginLeft: 6 }}>{item.date}</ThemedText>
                  </View>
                  <View style={styles.metaCol}>
                    <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                    <ThemedText type="small" style={{ marginLeft: 6 }}>{item.timeSlot}</ThemedText>
                  </View>
                </View>

                {item.status === 'SCHEDULED' && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={[styles.cardActionBtn, { borderColor: theme.border }]}>
                      <Ionicons name="navigate-outline" size={18} color={theme.textSecondary} />
                      <ThemedText type="smallBold" themeColor="textSecondary" style={{ marginLeft: 6 }}>
                        Navigate
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cardActionBtn, { borderColor: theme.border }]}
                      onPress={() => handleCancelAppointment(item.id, item.hospitalName)}
                    >
                      <Ionicons name="close-circle-outline" size={18} color={theme.error} />
                      <ThemedText type="smallBold" style={{ color: theme.error, marginLeft: 6 }}>
                        Cancel
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === 'COMPLETED' && item.unitsDonated && (
                  <View style={[styles.completedBanner, { backgroundColor: theme.tertiary + '0D' }]}>
                    <Ionicons name="ribbon-outline" size={18} color={theme.tertiary} />
                    <ThemedText type="small" style={{ color: theme.tertiary, marginLeft: 6 }}>
                      Donated {item.unitsDonated} units successfully!
                    </ThemedText>
                  </View>
                )}
              </ThemedView>
            ))
          )}
        </ScrollView>
      )}

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bookingToggle: {
    flexDirection: 'row',
    padding: Spacing.three,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    gap: Spacing.two,
  },
  toggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
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
  },
  formTitle: {
    ...Typography.headlineMD,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.four,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.two,
  },
  radioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Border.radiusDefault,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  slotBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
  },
  submitBtn: {
    height: 48,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  listContainer: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  scheduleCard: {
    borderRadius: Border.radiusMd,
    padding: Spacing.three,
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
  headerInfo: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Border.radiusFull,
  },
  cardMetaRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
    gap: Spacing.four,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: '#f8f8f8',
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  cardActionBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
    padding: Spacing.two,
    borderRadius: Border.radiusDefault,
  },
});
