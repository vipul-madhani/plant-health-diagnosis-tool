import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Image, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';

const AgronomistDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [payoutInfo, setPayoutInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role === 'agronomist') {
      loadPendingConsultations();
      loadPayoutInfo();
    }
  }, []);

  const loadPendingConsultations = async () => {
    try {
      setLoading(true);
      // FIFO: Backend returns consultations sorted by created_at ASC
      const response = await API.get('/api/consultation/agronomist/pending');
      setConsultations(response.data.consultations || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const loadPayoutInfo = async () => {
    try {
      const response = await API.get('/api/profile/payout-status');
      setPayoutInfo(response.data);
    } catch (error) {
      console.error('Failed to load payout info:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([loadPendingConsultations(), loadPayoutInfo()]).then(() => setRefreshing(false));
  }, []);

  const handleAcceptConsultation = async (consultationId) => {
    Alert.alert(
      'Accept Consultation',
      'Do you want to accept this consultation? You will be assigned based on FIFO (First In, First Out) order.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await API.post(`/api/consultation/${consultationId}/accept`);
              Alert.alert('Success', 'Consultation accepted! You can now chat with the farmer.');
              loadPendingConsultations();
              navigation.navigate('Chat', { consultationId });
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to accept consultation');
            }
          }
        }
      ]
    );
  };

  const renderConsultation = ({ item }) => (
    <View style={styles.consultationCard}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.plant_image_url || 'https://via.placeholder.com/150' }}
          style={styles.plantImage}
        />
      </View>
      <View style={styles.consultationInfo}>
        <Text style={styles.plantName}>{item.plant_name}</Text>
        <Text style={styles.symptoms} numberOfLines={2}>{item.symptoms}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Region: {item.region}</Text>
          <Text style={styles.metaText}>Season: {item.season}</Text>
        </View>
        <Text style={styles.farmerName}>Farmer: {item.farmer_name}</Text>
        <Text style={styles.timestamp}>
          Submitted: {new Date(item.created_at).toLocaleString('en-IN')}
        </Text>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptConsultation(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept Consultation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (user?.role !== 'agronomist') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>This dashboard is only for agronomists</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Earnings Summary */}
      {payoutInfo && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Earnings</Text>
          <Text style={styles.earningsAmount}>₹{payoutInfo.earned_points?.toLocaleString('en-IN') || 0}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{payoutInfo.total_consultations || 0}</Text>
              <Text style={styles.statLabel}>Consultations</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{payoutInfo.effectiveness_rating?.toFixed(1) || 0}%</Text>
              <Text style={styles.statLabel}>Effectiveness</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: payoutInfo.collection_status === 'collected' ? '#27ae60' : '#f39c12' }]}>
                {payoutInfo.collection_status === 'collected' ? 'Collected' : 'Pending'}
              </Text>
              <Text style={styles.statLabel}>Collection</Text>
            </View>
          </View>
        </View>
      )}

      {/* Pending Consultations - FIFO Order */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pending Consultations (FIFO Order)</Text>
        <Text style={styles.sectionSubtitle}>First In, First Out - No rating discrimination</Text>
      </View>

      <FlatList
        data={consultations}
        renderItem={renderConsultation}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending consultations</Text>
            <Text style={styles.emptySubtext}>New consultations will appear here in FIFO order</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionHeader: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  consultationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  plantImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  consultationInfo: {
    padding: 12,
  },
  plantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  symptoms: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  farmerName: {
    fontSize: 13,
    color: '#3498db',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginBottom: 12,
  },
  acceptButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default AgronomistDashboardScreen;
