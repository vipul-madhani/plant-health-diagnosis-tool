import React, { useState } from 'react';
import { View, Text, Button, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function DiagnoseScreen() {
  const [pickedImage, setPickedImage] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Allow access to camera roll to upload images');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4,3], quality: 1 });
    if (!result.cancelled) {
      setPickedImage(result.uri);
      setResult('');
    }
  };

  const diagnoseImage = async () => {
    if (!pickedImage) {
      Alert.alert('No image', 'Select an image before diagnosis.');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: pickedImage,
        type: 'image/jpeg',
        name: 'photo.jpg'
      });
      const response = await fetch('http://localhost:8000/predict/', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = await response.json();
      setResult(`Prediction: Class ${data.class_index}, Confidence: ${(data.confidence * 100).toFixed(2)}%`);
    } catch (err) {
      Alert.alert('Error', 'Could not perform diagnosis.');
    }
    setLoading(false);
  };

  return (
    <View style={{ padding: 30 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Plant Health Diagnosis</Text>
      <Button title="Pick Image" onPress={pickImage} />
      {pickedImage && <Image source={{ uri: pickedImage }} style={{ width: 200, height: 200, marginVertical: 10 }} />}
      <Button title={loading ? "Diagnosing..." : "Diagnose"} onPress={diagnoseImage} disabled={loading} />
      {result ? <Text style={{ color: 'green', marginTop: 12 }}>{result}</Text> : null}
      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
    </View>
  );
}
