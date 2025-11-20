import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Image, TextInput } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';

const REGIONS = ['North India', 'South India', 'East India', 'West India', 'Central India', 'North-East India'];
const SEASONS = ['Kharif', 'Rabi', 'Summer', 'Year-Round'];

const SubmitConsultationScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    plant_name: '',
    symptoms: '',
    region: 'North India',
    season: 'Kharif',
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
      },
      (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert('Error', 'Failed to pick image');
          return;
        }
        setImage(response.assets[0]);
      }
    );
  };

  const validateForm = () => {
    if (!formData.plant_name.trim()) {
      Alert.alert('Validation', 'Please enter plant name');
      return false;
    }
    if (!formData.symptoms.trim()) {
      Alert.alert('Validation', 'Please describe symptoms');
      return false;
    }
    if (!image) {
      Alert.alert('Validation', 'Please select plant image');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const formPayload = new FormData();
      formPayload.append('plant_name', formData.plant_name);
      formPayload.append('symptoms', formData.symptoms);
      formPayload.append('region', formData.region);
      formPayload.append('season', formData.season);
      
      if (image) {
        formPayload.append('image', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || 'plant_image.jpg',
        });
      }

      const response = await API.post('/api/consultation/submit', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Consultation submitted! An agronomist will be assigned soon.');
      setFormData({ plant_name: '', symptoms: '', region: 'North India', season: 'Kharif' });
      setImage(null);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit consultation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Plant Image *</Text>
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
                <Text style={styles.buttonText}>Change Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              <Text style={styles.pickerText}>Tap to select plant image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Plant Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Plant Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Tomato, Wheat, Rice"
            value={formData.plant_name}
            onChangeText={(text) => setFormData({ ...formData, plant_name: text })}
          />
        </View>

        {/* Symptoms */}
        <View style={styles.section}>
          <Text style={styles.label}>Describe Symptoms *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe what you observe on the plant..."
            value={formData.symptoms}
            onChangeText={(text) => setFormData({ ...formData, symptoms: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Region */}
        <View style={styles.section}>
          <Text style={styles.label}>Region</Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={formData.region}
              onValueChange={(value) => setFormData({ ...formData, region: value })}
            >
              {REGIONS.map((region) => (
                <Picker.Item key={region} label={region} value={region} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Season */}
        <View style={styles.section}>
          <Text style={styles.label}>Current Season</Text>
          <View style={styles.picker}>
            <Picker
              selectedValue={formData.season}
              onValueChange={(value) => setFormData({ ...formData, season: value })}
            >
              {SEASONS.map((season) => (
                <Picker.Item key={season} label={season} value={season} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>{loading ? 'Submitting...' : 'Submit Consultation'}</Text>
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
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 10,
  },
  imagePicker: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  changeButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    overflow: 'hidden',
  },
  submitButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SubmitConsultationScreen;
