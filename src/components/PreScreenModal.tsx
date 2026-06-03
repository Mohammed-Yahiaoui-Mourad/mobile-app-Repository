import React, { useState } from 'react';
import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, Border, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

interface PreScreenModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PreScreenModal({ visible, onClose }: PreScreenModalProps) {
  const theme = useTheme();
  const { submitPreScreen } = useAuth();
  
  // Questionnaire Answers State
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  const questions = [
    {
      id: 1,
      text: 'Have you donated whole blood or platelets in the last 56 days?',
    },
    {
      id: 2,
      text: 'Are you feeling unwell, currently running a fever, or taking antibiotics?',
    },
    {
      id: 3,
      text: 'Have you gotten a tattoo, body piercing, or acupuncture in the last 4 months?',
    },
    {
      id: 4,
      text: 'Do you weigh less than 50 kg (110 lbs)?',
    },
  ];

  const handleAnswer = (questionId: number, answer: boolean) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    // Check if all questions are answered
    if (Object.keys(answers).length < questions.length) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }

    try {
      // Map frontend question IDs to backend schema
      const response = await submitPreScreen({
        has_recent_tattoo_or_piercing: answers[3] || false,
        has_infectious_diseases: false,
        is_taking_antibiotics: answers[2] || false,
        has_traveled_malaria_zone_recently: false,
        is_feeling_unwell: answers[2] || answers[4] || false,
      });

      if (response && response.cleared) {
        Alert.alert(
          'Clearance Approved!',
          `Congratulations! You have passed the questionnaire clearance. Your Clearance Code is: ${response.health_clearance_token}`,
          [{ text: 'Great!', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Clearance Denied',
          'Based on your responses, you do not meet the safety requirements to donate blood at this time. Your donor availability has been paused.',
          [{ text: 'Understand', onPress: onClose }]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit pre-screening questionnaire.');
    }
    
    // Reset answers
    setAnswers({});
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView type="surface" style={styles.card}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Donor Pre-Screening</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
              Please answer these preliminary health clearance questions accurately. This helps eliminate walk-in clinic rejection rates.
            </ThemedText>

            {questions.map((q) => (
              <View key={q.id} style={[styles.questionBox, { borderColor: theme.border }]}>
                <ThemedText style={styles.questionText}>{q.text}</ThemedText>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[
                      styles.choiceBtn,
                      { borderColor: theme.border },
                      answers[q.id] === true && { borderColor: theme.error, backgroundColor: theme.error + '0D' },
                    ]}
                    onPress={() => handleAnswer(q.id, true)}
                  >
                    <ThemedText
                      type="smallBold"
                      style={answers[q.id] === true ? { color: theme.error } : { color: theme.textSecondary }}
                    >
                      Yes
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.choiceBtn,
                      { borderColor: theme.border },
                      answers[q.id] === false && { borderColor: theme.tertiary, backgroundColor: theme.tertiary + '0D' },
                    ]}
                    onPress={() => handleAnswer(q.id, false)}
                  >
                    <ThemedText
                      type="smallBold"
                      style={answers[q.id] === false ? { color: theme.tertiary } : { color: theme.textSecondary }}
                    >
                      No
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
            >
              <ThemedText style={styles.submitBtnText}>Submit Clearance Questionnaire</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 28, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    borderTopLeftRadius: Border.radiusXl,
    borderTopRightRadius: Border.radiusXl,
    padding: Spacing.four,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    ...Typography.headlineMD,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  intro: {
    marginBottom: Spacing.three,
    lineHeight: 18,
  },
  questionBox: {
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  questionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: Spacing.two,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  choiceBtn: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    height: 48,
    borderRadius: Border.radiusDefault,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
