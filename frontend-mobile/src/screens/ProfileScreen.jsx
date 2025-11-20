import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [payoutInfo, setPayoutInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/profile/info');
      setProfile(response.data);
      
      if (response.data.role === 'agronomist') {
        const payoutResponse = await API.get('/api/profile/payout-status');
        setPayoutInfo(payoutResponse.data);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProfile().then(() => setRefreshing(false));
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await API.post('/api/auth/logout');
            logout();
          } catch (error) {
            console.error('Logout error:', error);
            logout();
          }
        }
      }
    ]);
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Profile Header */}
      <View style={styles.headerSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.full_name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.nameText}>{profile.full_name}</Text>
        <Text style={styles.emailText}>{profile.email}</Text>
        <Text style={styles.roleText}>{profile.role === 'agronomist' ? 'Agricultural Expert' : 'Farmer'}</Text>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{profile.phone_number}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Region:</Text>
          <Text style={styles.value}>{profile.region}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Account Status:</Text>
          <Text style={[styles.value, { color: profile.is_verified ? '#27ae60' : '#e74c3c' }]}>
            {profile.is_verified ? 'Verified' : 'Pending Verification'}
          </Text>
        </View>
      </View>

      {/* Agronomist Stats */}
      {profile.role === 'agronomist' && payoutInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Performance</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Effectiveness Rating:</Text>
            <Text style={styles.value}>{payoutInfo.effectiveness_rating?.toFixed(1) || '0'}%</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Total Consultations:</Text>
            <Text style={styles.value}>{payoutInfo.total_consultations || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Earned Points:</Text>
            <Text style={styles.value}>₹{payoutInfo.earned_points?.toLocaleString('en-IN') || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Collection Status:</Text>
            <Text style={[styles.value, { color: payoutInfo.collection_status === 'collected' ? '#27ae60' : '#f39c12' }]}>
              {payoutInfo.collection_status === 'collected' ? 'Collected' : 'Pending Collection'}
            </Text>
          </View>
        </View>
      )}

      {/* Farmer Stats */}
      {profile.role === 'farmer' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Active Consultations:</Text>
            <Text style={styles.value}>{profile.active_consultations_count || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Completed Consultations:</Text>
            <Text style={styles.value}>{profile.completed_consultations_count || 0}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  headerSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  actionSection: {
    padding: 16,
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
