import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';

export default function ConsultationListScreen() {
  const navigation = useNavigation();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consultations');
      setConsultations(response.data.consultations || []);
    } catch (error) {
      console.error('Failed to fetch consultations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConsultations();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'completed':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return 'chat';
      case 'pending':
        return 'clock-outline';
      case 'completed':
        return 'check-circle';
      default:
        return 'help-circle';
    }
  };

  const renderConsultation = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.consultationCard}
        onPress={() =>
          navigation.navigate('Chat', { consultationId: item._id })
        }
        disabled={item.status === 'pending'}
      >
        <View style={styles.cardHeader}>
          <View style={styles.agronomistInfo}>
            {item.agronomist?.profilePicture ? (
              <Image
                source={{ uri: item.agronomist.profilePicture }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="account" size={32} color="#fff" />
              </View>
            )}
            <View style={styles.agronomistDetails}>
              <Text style={styles.agronomistName}>
                {item.agronomist?.name || 'Assigning Expert...'}
              </Text>
              {item.agronomist?.specialization && (
                <Text style={styles.specialization}>
                  {item.agronomist.specialization}
                </Text>
              )}
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Icon
              name={getStatusIcon(item.status)}
              size={14}
              color="#fff"
            />
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {item.plantImage && (
          <Image source={{ uri: item.plantImage }} style={styles.plantImage} />
        )}

        <View style={styles.cardContent}>
          {item.diagnosis && (
            <View style={styles.infoRow}>
              <Icon name="leaf" size={16} color="#4CAF50" />
              <Text style={styles.infoText}>{item.diagnosis}</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="calendar" size={14} color="#666" />
              <Text style={styles.metaText}>
                {new Date(item.createdAt).toLocaleDateString('en-IN')}
              </Text>
            </View>
            {item.lastMessageTime && (
              <View style={styles.metaItem}>
                <Icon name="clock-outline" size={14} color="#666" />
                <Text style={styles.metaText}>
                  Last message:{' '}
                  {new Date(item.lastMessageTime).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
          </View>

          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount} new message{item.unreadCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.amountText}>₹{item.amount}</Text>
          {item.status === 'active' && (
            <View style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Continue Chat</Text>
              <Icon name="arrow-right" size={16} color="#4CAF50" />
            </View>
          )}
          {item.status === 'pending' && (
            <Text style={styles.pendingText}>Waiting for expert...</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          data={consultations}
          renderItem={renderConsultation}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="chat-outline" size={80} color="#CCC" />
              <Text style={styles.emptyText}>No consultations yet</Text>
              <Text style={styles.emptySubtext}>
                Connect with an agronomist for expert advice
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Icon name="plus" size={20} color="#fff" />
                <Text style={styles.startButtonText}>Start Consultation</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
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
  },
  listContent: {
    padding: 16,
  },
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  agronomistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agronomistDetails: {
    marginLeft: 12,
    flex: 1,
  },
  agronomistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  specialization: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  plantImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  pendingText: {
    fontSize: 13,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
