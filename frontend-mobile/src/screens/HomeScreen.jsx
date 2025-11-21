import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../api/api';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    fetchUserProfile();
    fetchRecentAnalyses();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUserName(response.data.name || 'Farmer');
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchRecentAnalyses = async () => {
    try {
      const response = await api.get('/analysis/recent');
      setRecentAnalyses(response.data.analyses || []);
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
    }
  };

  const pickImageAndAnalyze = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Denied', 'Camera access is required');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Denied', 'Gallery access is required');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        navigation.navigate('Analysis', { imageUri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const showImageSourceOptions = () => {
    Alert.alert(
      'Upload Plant Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => pickImageAndAnalyze('camera'),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImageAndAnalyze('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userName}! 👋</Text>
          <Text style={styles.subtitle}>Let's diagnose your plant health</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Icon name="account-circle" size={40} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Main Upload Card */}
      <View style={styles.uploadCard}>
        <Icon name="camera-plus" size={60} color="#4CAF50" />
        <Text style={styles.uploadTitle}>Analyze Your Plant</Text>
        <Text style={styles.uploadSubtitle}>
          Upload a photo to get instant AI diagnosis
        </Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={showImageSourceOptions}
        >
          <Icon name="camera" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Features Grid */}
      <View style={styles.featuresGrid}>
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('MyReports')}
        >
          <Icon name="file-document" size={32} color="#2196F3" />
          <Text style={styles.featureTitle}>My Reports</Text>
          <Text style={styles.featureSubtitle}>View all analyses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('ConsultationList')}
        >
          <Icon name="chat" size={32} color="#FF9800" />
          <Text style={styles.featureTitle}>Chat</Text>
          <Text style={styles.featureSubtitle}>Talk to experts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('BlogFeed')}
        >
          <Icon name="book-open-variant" size={32} color="#9C27B0" />
          <Text style={styles.featureTitle}>Knowledge</Text>
          <Text style={styles.featureSubtitle}>Learn more</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Profile')}
        >
          <Icon name="cog" size={32} color="#607D8B" />
          <Text style={styles.featureTitle}>Settings</Text>
          <Text style={styles.featureSubtitle}>Manage account</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Analyses</Text>
          {recentAnalyses.slice(0, 3).map((analysis, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recentCard}
              onPress={() =>
                navigation.navigate('ReportDetail', { reportId: analysis._id })
              }
            >
              {analysis.imageUrl && (
                <Image
                  source={{ uri: analysis.imageUrl }}
                  style={styles.recentImage}
                />
              )}
              <View style={styles.recentInfo}>
                <Text style={styles.recentDisease}>
                  {analysis.diagnosis || 'Unknown Issue'}
                </Text>
                <Text style={styles.recentDate}>
                  {new Date(analysis.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Help Card */}
      <View style={styles.helpCard}>
        <Icon name="help-circle" size={24} color="#4CAF50" />
        <Text style={styles.helpText}>
          Need help? Our agronomists are available 24/7
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  uploadCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  featureSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  recentSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recentImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  recentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  recentDisease: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recentDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    margin: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
  },
});
