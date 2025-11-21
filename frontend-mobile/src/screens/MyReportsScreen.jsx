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

export default function MyReportsScreen() {
  const navigation = useNavigation();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, paid, free

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports', {
        params: { filter },
      });
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const renderReport = ({ item }) => {
    const isPaid = item.type === 'detailed';
    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() =>
          navigation.navigate('ReportDetail', { reportId: item._id })
        }
      >
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.reportImage} />
        )}
        <View style={styles.reportContent}>
          <View style={styles.reportHeader}>
            <Text style={styles.reportDisease}>
              {item.diagnosis || 'Unknown Issue'}
            </Text>
            {isPaid && (
              <View style={styles.paidBadge}>
                <Icon name="star" size={12} color="#FFD700" />
                <Text style={styles.paidText}>Detailed</Text>
              </View>
            )}
          </View>
          <View style={styles.reportMeta}>
            <View style={styles.metaItem}>
              <Icon name="calendar" size={14} color="#666" />
              <Text style={styles.metaText}>
                {new Date(item.createdAt).toLocaleDateString('en-IN')}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="gauge" size={14} color="#666" />
              <Text style={styles.metaText}>
                {((item.confidence || 0) * 100).toFixed(0)}% confidence
              </Text>
            </View>
          </View>
          {item.plantSpecies && (
            <Text style={styles.plantSpecies}>{item.plantSpecies}</Text>
          )}
        </View>
        <Icon name="chevron-right" size={24} color="#CCC" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            All Reports
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'paid' && styles.filterTabActive]}
          onPress={() => setFilter('paid')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'paid' && styles.filterTextActive,
            ]}
          >
            Detailed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'free' && styles.filterTabActive]}
          onPress={() => setFilter('free')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'free' && styles.filterTextActive,
            ]}
          >
            Basic
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="file-document-outline" size={80} color="#CCC" />
              <Text style={styles.emptyText}>No reports yet</Text>
              <Text style={styles.emptySubtext}>
                Upload a plant photo to get started
              </Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Icon name="camera" size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>Upload Photo</Text>
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  filterTabActive: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  reportContent: {
    flex: 1,
    marginLeft: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reportDisease: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F57C00',
  },
  reportMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
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
  plantSpecies: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
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
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
