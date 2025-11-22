import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import razorpayService from '../services/razorpayService';
import analyticsService from '../services/analyticsService';

export default function PaymentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { amount, type, analysisId, imageUri, userId } = route.params;

  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: 'qrcode-scan', popular: true },
    { id: 'card', name: 'Credit/Debit Card', icon: 'credit-card' },
    { id: 'netbanking', name: 'Net Banking', icon: 'bank' },
    { id: 'wallet', name: 'Wallet', icon: 'wallet' },
  ];

  const getServiceDetails = () => {
    if (type === 'detailed_report') {
      return {
        title: 'Detailed Analysis Report',
        description: 'Comprehensive diagnosis with treatment plan',
        features: [
          'Complete disease analysis',
          'Step-by-step treatment guide',
          'Preventive measures',
          'Organic remedy suggestions',
          'PDF report download',
          'Email delivery',
        ],
      };
    } else {
      return {
        title: 'Agronomist Consultation',
        description: 'Live chat with certified expert',
        features: [
          'Real-time chat with agronomist',
          'Personalized treatment advice',
          'Follow-up support (24 hours)',
          'Regional solutions',
          'Image sharing in chat',
          'AI assistant available 24/7',
        ],
      };
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please choose a payment method');
      return;
    }

    try {
      setProcessing(true);

      // Track payment attempt
      if (type === 'detailed_report') {
        await analyticsService.logPaidAnalysis(analysisId, amount, userId);
      } else {
        await analyticsService.logConsultationRequest(analysisId, userId);
      }

      // Initialize Razorpay payment
      const result = await razorpayService.initializePayment(amount, type, {
        analysisId,
        paymentMethod: selectedMethod,
      });

      if (result.success) {
        // Track successful payment
        await analyticsService.logPaymentCompleted(
          result.orderId,
          amount,
          type,
          userId
        );

        // Navigate based on service type
        if (type === 'detailed_report') {
          navigation.replace('ReportDetail', {
            reportId: result.reportId || analysisId,
          });
          
          Alert.alert(
            'Payment Successful!',
            'Your detailed report is ready to download. Check your email for a copy.',
            [{ text: 'View Report', onPress: () => {} }]
          );
        } else {
          navigation.replace('ConsultationChat', {
            consultationId: result.consultationId,
          });
          
          Alert.alert(
            'Payment Successful!',
            'You can now start chatting with your agronomist.',
            [{ text: 'Start Chat', onPress: () => {} }]
          );
        }
      } else if (result.cancelled) {
        Alert.alert(
          'Payment Cancelled',
          'You cancelled the payment. You can try again when ready.'
        );
      } else {
        // Track failed payment
        await analyticsService.logPaymentFailed(
          result.orderId || 'unknown',
          result.error,
          userId
        );
        
        Alert.alert(
          'Payment Failed',
          result.message || 'Unable to process payment. Please try again.',
          [
            { text: 'Try Again', onPress: handlePayment },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Payment error:', error);
      
      await analyticsService.logPaymentFailed(
        'unknown',
        error.message,
        userId
      );
      
      Alert.alert(
        'Payment Error',
        'Something went wrong. Please try again or contact support.',
        [
          { text: 'Retry', onPress: handlePayment },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  const serviceDetails = getServiceDetails();
  const gstAmount = Math.round(amount * 0.18);
  const totalAmount = amount + gstAmount;

  return (
    <ScrollView style={styles.container}>
      {/* Preview Image */}
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      )}

      {/* Service Details */}
      <View style={styles.serviceCard}>
        <Text style={styles.serviceTitle}>{serviceDetails.title}</Text>
        <Text style={styles.serviceDescription}>
          {serviceDetails.description}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.featuresTitle}>What's included:</Text>
        {serviceDetails.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Icon name="check-circle" size={18} color="#4CAF50" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Payment Methods */}
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id && styles.methodCardSelected,
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View style={styles.methodLeft}>
              <View
                style={[
                  styles.methodIcon,
                  selectedMethod === method.id && styles.methodIconSelected,
                ]}
              >
                <Icon
                  name={method.icon}
                  size={24}
                  color={selectedMethod === method.id ? '#4CAF50' : '#666'}
                />
              </View>
              <View>
                <Text style={styles.methodName}>{method.name}</Text>
                {method.popular && (
                  <Text style={styles.popularBadge}>Most Popular</Text>
                )}
              </View>
            </View>
            <View
              style={[
                styles.radioCircle,
                selectedMethod === method.id && styles.radioCircleSelected,
              ]}
            >
              {selectedMethod === method.id && (
                <View style={styles.radioDot} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Price Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Service Charge</Text>
          <Text style={styles.summaryValue}>₹{amount}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>GST (18%)</Text>
          <Text style={styles.summaryValue}>₹{gstAmount}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>₹{totalAmount}</Text>
        </View>
      </View>

      {/* Pay Button */}
      <TouchableOpacity
        style={[
          styles.payButton,
          (!selectedMethod || processing) && styles.payButtonDisabled,
        ]}
        onPress={handlePayment}
        disabled={!selectedMethod || processing}
      >
        {processing ? (
          <>
            <ActivityIndicator color="#fff" />
            <Text style={styles.payButtonText}>Processing...</Text>
          </>
        ) : (
          <>
            <Icon name="lock" size={20} color="#fff" />
            <Text style={styles.payButtonText}>Pay ₹{totalAmount}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Secure Payment Info */}
      <View style={styles.secureInfo}>
        <Icon name="shield-check" size={16} color="#4CAF50" />
        <Text style={styles.secureText}>
          100% secure payment powered by Razorpay
        </Text>
      </View>

      {/* Trust Indicators */}
      <View style={styles.trustBadges}>
        <View style={styles.trustBadge}>
          <Icon name="lock-outline" size={20} color="#666" />
          <Text style={styles.trustBadgeText}>SSL Encrypted</Text>
        </View>
        <View style={styles.trustBadge}>
          <Icon name="shield-check-outline" size={20} color="#666" />
          <Text style={styles.trustBadgeText}>PCI Compliant</Text>
        </View>
        <View style={styles.trustBadge}>
          <Icon name="bank" size={20} color="#666" />
          <Text style={styles.trustBadgeText}>Bank Grade Security</Text>
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
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  serviceCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  paymentSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIconSelected: {
    backgroundColor: '#E8F5E9',
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  popularBadge: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#4CAF50',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
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
  payButton: {
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
    shadowRadius: 8,
    elevation: 6,
  },
  payButtonDisabled: {
    backgroundColor: '#CCC',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  secureText: {
    fontSize: 12,
    color: '#666',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  trustBadge: {
    alignItems: 'center',
    gap: 6,
  },
  trustBadgeText: {
    fontSize: 11,
    color: '#666',
  },
});