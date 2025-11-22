import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/api';
import UsageLimitBanner from '../components/UsageLimitBanner';

export default function AnalysisScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { imageUri } = route.params;

  const [analyzing, setAnalyzing] = useState(true);
  const [basicResult, setBasicResult] = useState(null);
  const [error, setError] = useState(null);
  const [usageLimit, setUsageLimit] = useState(null);

  useEffect(() => {
    checkUsageLimit();
  }, []);

  const checkUsageLimit = async () => {
    try {
      const response = await api.get('/analysis/usage-limit');
      setUsageLimit(response.data);
      
      // If limit reached, show upgrade prompt immediately
      if (response.data.remaining === 0) {
        showUpgradePrompt();
      } else {
        performBasicAnalysis();
      }
    } catch (err) {
      console.error('Usage limit check error:', err);
      // Continue with analysis even if check fails
      performBasicAnalysis();
    }
  };

  const performBasicAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      // Create form data with image
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'plant.jpg',
      });

      // Call ML API for basic diagnosis
      const response = await api.post('/analysis/basic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setBasicResult(response.data);
      
      // Update usage limit after successful analysis
      if (response.data.usageInfo) {
        setUsageLimit(response.data.usageInfo);
      }
    } catch (err) {
      console.error('Analysis error:', err);
      
      // Check if error is due to limit reached
      if (err.response?.status === 403) {
        setError('Free analysis limit reached. Please upgrade to continue.');
        showUpgradePrompt();
      } else {
        setError('Failed to analyze image. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const showUpgradePrompt = () => {
    Alert.alert(
      'Free Limit Reached',
      'You have used all 3 free analyses. Upgrade to continue:',
      [
        {
          text: 'Detailed Report (₹99)',
          onPress: handleGetDetailedReport,
        },
        {
          text: 'Consult Agronomist (₹199)',
          onPress: handleConnectAgronomist,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleGetDetailedReport = () => {
    navigation.navigate('Payment', {
      amount: 99,
      type: 'detailed_report',
      analysisId: basicResult?._id,
      imageUri,
    });
  };

  const handleConnectAgronomist = () => {
    navigation.navigate('Payment', {
      amount: 199,
      type: 'consultation',
      analysisId: basicResult?._id,
      imageUri,
    });
  };

  if (analyzing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Analyzing your plant...</Text>
        <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
      </View>
    );
  }

  if (error && !basicResult) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={60} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        
        {error.includes('limit reached') ? (
          <View style={styles.upgradeButtonsContainer}>
            <TouchableOpacity
              style={[styles.upgradeButton, styles.reportButton]}
              onPress={handleGetDetailedReport}
            >
              <Icon name="file-document" size={24} color="#fff" />
              <Text style={styles.upgradeButtonText}>Detailed Report (₹99)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.upgradeButton, styles.consultButton]}
              onPress={handleConnectAgronomist}
            >
              <Icon name="chat" size={24} color="#fff" />
              <Text style={styles.upgradeButtonText}>Consult Agronomist (₹199)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={performBasicAnalysis}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Usage Limit Banner */}
      {usageLimit && (
        <UsageLimitBanner
          remaining={usageLimit.remaining}
          total={usageLimit.limit}
          used={usageLimit.used}
          isLifetime={true}
        />
      )}

      {/* Image Preview */}
      <Image source={{ uri: imageUri }} style={styles.plantImage} />

      {/* Basic Results Card */}
      <View style={styles.resultCard}>
        <View style={styles.resultHeader}>
          <Icon name="check-circle" size={28} color="#4CAF50" />
          <Text style={styles.resultTitle}>Analysis Complete</Text>
        </View>

        <View style={styles.divider} />

        {/* Disease Detection */}
        <View style={styles.resultSection}>
          <Text style={styles.sectionLabel}>Detected Issue</Text>
          <Text style={styles.sectionValue}>
            {basicResult?.disease || 'Healthy Plant'}
          </Text>
        </View>

        {/* Confidence */}
        <View style={styles.resultSection}>
          <Text style={styles.sectionLabel}>Confidence</Text>
          <View style={styles.confidenceContainer}>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  { width: `${(basicResult?.confidence || 0) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.confidenceText}>
              {((basicResult?.confidence || 0) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Plant Species */}
        {basicResult?.plantSpecies && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionLabel}>Plant Species</Text>
            <Text style={styles.sectionValue}>{basicResult.plantSpecies}</Text>
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles.resultSection}>
          <Text style={styles.sectionLabel}>Quick Suggestions</Text>
          <Text style={styles.quickTips}>
            {basicResult?.quickTips ||
              'For detailed treatment recommendations, get a detailed report.'}
          </Text>
        </View>
      </View>

      {/* Upgrade Options */}
      <View style={styles.upgradeSection}>
        <Text style={styles.upgradeSectionTitle}>
          Want more detailed insights?
        </Text>

        {/* Detailed Report Card */}
        <TouchableOpacity
          style={styles.upgradeCard}
          onPress={handleGetDetailedReport}
        >
          <View style={[styles.upgradeIconContainer, { backgroundColor: '#E3F2FD' }]}>
            <Icon name="file-document" size={32} color="#2196F3" />
          </View>
          <View style={styles.upgradeContent}>
            <Text style={styles.upgradeTitle}>Detailed Report</Text>
            <Text style={styles.upgradeDescription}>
              • Complete diagnosis report{' \n'}
              • Step-by-step treatment plan{' \n'}
              • Preventive measures{' \n'}
              • Organic remedies{' \n'}
              • Download PDF report
            </Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>₹99</Text>
              <Icon name="arrow-right" size={20} color="#2196F3" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Consultation Card */}
        <TouchableOpacity
          style={styles.upgradeCard}
          onPress={handleConnectAgronomist}
        >
          <View style={[styles.upgradeIconContainer, { backgroundColor: '#FFF3E0' }]}>
            <Icon name="chat" size={32} color="#FF9800" />
          </View>
          <View style={styles.upgradeContent}>
            <Text style={styles.upgradeTitle}>Chat with Agronomist</Text>
            <Text style={styles.upgradeDescription}>
              • Live chat with certified expert{' \n'}
              • Personalized advice{' \n'}
              • Follow-up support (24 hours){' \n'}
              • Regional solutions{' \n'}
              • AI assistant available 24/7
            </Text>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>₹199</Text>
              <Icon name="arrow-right" size={20} color="#FF9800" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.secondaryButtonText}>Analyze Another</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('MyReports')}
        >
          <Text style={styles.primaryButtonText}>View All Reports</Text>
        </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  upgradeButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 10,
  },
  reportButton: {
    backgroundColor: '#2196F3',
  },
  consultButton: {
    backgroundColor: '#FF9800',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  plantImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#E0E0E0',
  },
  resultCard: {
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  resultSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  sectionValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  confidenceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  quickTips: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  upgradeSection: {
    padding: 16,
  },
  upgradeSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  upgradeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeContent: {
    flex: 1,
    marginLeft: 16,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});