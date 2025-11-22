import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/api';

export default function ConsultationRequestScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { analysisId, imageUri, disease, confidence } = route.params;

  const [loading, setLoading] = useState(true);
  const [availableAgronomists, setAvailableAgronomists] = useState(0);
  const [queuePosition, setQueuePosition] = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);

  useEffect(() => {
    checkAgronomistAvailability();
  }, []);

  const checkAgronomistAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consultation/agronomists/available');
      
      setAvailableAgronomists(response.data.count || 0);
      setQueuePosition(response.data.queuePosition || null);
      
      // Calculate estimated wait time based on queue
      if (response.data.queuePosition) {
        setEstimatedWaitTime(response.data.queuePosition * 5); // 5 min per position
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      Alert.alert(
        'Error',
        'Unable to check agronomist availability. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = () => {
    navigation.navigate('Payment', {
      amount: 199,
      type: 'consultation',
      analysisId,
      imageUri,
    });
  };

  const getAvailabilityMessage = () => {
    if (availableAgronomists === 0) {
      return {
        icon: 'robot',
        color: '#FF9800',
        title: 'AI Assistant Available',
        message: 'Our AI assistant is ready to help you immediately. If an agronomist becomes available, they will join your consultation.',
      };
    } else if (availableAgronomists <= 3) {
      return {
        icon: 'account-check',
        color: '#4CAF50',
        title: `${availableAgronomists} Agronomist${availableAgronomists > 1 ? 's' : ''} Available`,
        message: 'Connect with a certified expert now for personalized advice.',
      };
    } else {
      return {
        icon: 'account-multiple',
        color: '#2196F3',
        title: 'Multiple Agronomists Ready',
        message: `${availableAgronomists} agronomists are online and ready to assist you.`,
      };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Checking availability...</Text>
      </View>
    );
  }

  const availability = getAvailabilityMessage();

  return (
    <ScrollView style={styles.container}>
      {/* Preview Image */}
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      )}

      {/* Diagnosis Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Your Diagnosis</Text>
        <View style={styles.diagnosisRow}>
          <Text style={styles.diagnosisLabel}>Detected Issue:</Text>
          <Text style={styles.diagnosisValue}>{disease || 'Plant Health Issue'}</Text>
        </View>
        <View style={styles.diagnosisRow}>
          <Text style={styles.diagnosisLabel}>Confidence:</Text>
          <Text style={styles.diagnosisValue}>
            {confidence ? `${(confidence * 100).toFixed(1)}%` : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Availability Status */}
      <View style={styles.availabilityCard}>
        <View style={[styles.availabilityIcon, { backgroundColor: `${availability.color}15` }]}>
          <Icon name={availability.icon} size={40} color={availability.color} />
        </View>
        <Text style={styles.availabilityTitle}>{availability.title}</Text>
        <Text style={styles.availabilityMessage}>{availability.message}</Text>
        
        {queuePosition && queuePosition > 0 && (
          <View style={styles.queueInfo}>
            <Icon name="clock-outline" size={20} color="#666" />
            <Text style={styles.queueText}>
              Queue Position: #{queuePosition} • Est. wait: {estimatedWaitTime} min
            </Text>
          </View>
        )}
      </View>

      {/* Service Features */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>What's Included:</Text>
        
        <View style={styles.featureItem}>
          <Icon name="chat" size={24} color="#4CAF50" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Live Chat</Text>
            <Text style={styles.featureDescription}>
              Real-time messaging with certified agronomist
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Icon name="account-tie" size={24} color="#4CAF50" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Expert Guidance</Text>
            <Text style={styles.featureDescription}>
              Personalized treatment recommendations
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Icon name="calendar-clock" size={24} color="#4CAF50" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>24-Hour Support</Text>
            <Text style={styles.featureDescription}>
              Follow-up questions within 24 hours
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Icon name="map-marker" size={24} color="#4CAF50" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Regional Solutions</Text>
            <Text style={styles.featureDescription}>
              Context-aware advice for your location
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Icon name="robot" size={24} color="#4CAF50" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>AI Assistance</Text>
            <Text style={styles.featureDescription}>
              Instant AI support available 24/7
            </Text>
          </View>
        </View>
      </View>

      {/* Pricing Card */}
      <View style={styles.pricingCard}>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Consultation Fee</Text>
          <Text style={styles.pricingValue}>₹199</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>GST (18%)</Text>
          <Text style={styles.pricingValue}>₹36</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.pricingRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹235</Text>
        </View>
      </View>

      {/* Proceed Button */}
      <TouchableOpacity
        style={styles.proceedButton}
        onPress={handleProceedToPayment}
      >
        <Icon name="check-circle" size={24} color="#fff" />
        <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
      </TouchableOpacity>

      {/* Trust Indicators */}
      <View style={styles.trustIndicators}>
        <View style={styles.trustItem}>
          <Icon name="shield-check" size={20} color="#4CAF50" />
          <Text style={styles.trustText}>Certified Experts</Text>
        </View>
        <View style={styles.trustItem}>
          <Icon name="lock" size={20} color="#4CAF50" />
          <Text style={styles.trustText}>Secure Payment</Text>
        </View>
        <View style={styles.trustItem}>
          <Icon name="star" size={20} color="#4CAF50" />
          <Text style={styles.trustText}>4.8 Rating</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  diagnosisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  diagnosisLabel: {
    fontSize: 14,
    color: '#666',
  },
  diagnosisValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  availabilityCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availabilityIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  availabilityTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  availabilityMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  queueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 20,
  },
  queueText: {
    fontSize: 13,
    color: '#666',
  },
  featuresCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  pricingCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#666',
  },
  pricingValue: {
    fontSize: 14,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  proceedButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#666',
  },
});