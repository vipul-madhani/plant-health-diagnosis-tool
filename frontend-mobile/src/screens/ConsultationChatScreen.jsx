import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/api';

export default function ConsultationChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { consultationId } = route.params;
  const flatListRef = useRef();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [consultation, setConsultation] = useState(null);
  const [agronomist, setAgronomist] = useState(null);

  useEffect(() => {
    fetchConsultationDetails();
    fetchMessages();

    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchConsultationDetails = async () => {
    try {
      const response = await api.get(`/consultations/${consultationId}`);
      setConsultation(response.data.consultation);
      setAgronomist(response.data.agronomist);
    } catch (error) {
      console.error('Failed to fetch consultation:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/consultations/${consultationId}/messages`);
      setMessages(response.data.messages || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    try {
      setSending(true);
      const tempMessage = {
        _id: Date.now().toString(),
        text: inputText,
        sender: 'farmer',
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);
      setInputText('');

      await api.post(`/consultations/${consultationId}/messages`, {
        text: inputText,
      });

      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isFarmer = item.sender === 'farmer';
    return (
      <View
        style={[
          styles.messageContainer,
          isFarmer ? styles.farmerMessage : styles.agronomistMessage,
        ]}
      >
        {!isFarmer && agronomist?.profilePicture && (
          <Image
            source={{ uri: agronomist.profilePicture }}
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isFarmer ? styles.farmerBubble : styles.agronomistBubble,
          ]}
        >
          {!isFarmer && (
            <Text style={styles.senderName}>
              {agronomist?.name || 'Agronomist'}
            </Text>
          )}
          <Text
            style={[
              styles.messageText,
              isFarmer ? styles.farmerText : styles.agronomistText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isFarmer ? styles.farmerTimestamp : styles.agronomistTimestamp,
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Header Info */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {agronomist?.profilePicture && (
            <Image
              source={{ uri: agronomist.profilePicture }}
              style={styles.headerAvatar}
            />
          )}
          <View>
            <Text style={styles.headerName}>
              {agronomist?.name || 'Agronomist'}
            </Text>
            <Text style={styles.headerStatus}>
              {agronomist?.specialization || 'Certified Expert'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('AgronomistProfile', {
              agronomistId: agronomist?._id,
            })
          }
        >
          <Icon name="information" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Consultation Info Card */}
      {consultation && (
        <View style={styles.infoCard}>
          <Icon name="clock-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {consultation.status === 'active'
              ? '24-hour support active'
              : 'Consultation ended'}
          </Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chat-outline" size={60} color="#CCC" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start the conversation with your agronomist
            </Text>
          </View>
        }
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Icon name="camera" size={24} color="#666" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  farmerMessage: {
    justifyContent: 'flex-end',
  },
  agronomistMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#E0E0E0',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  farmerBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  agronomistBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  farmerText: {
    color: '#fff',
  },
  agronomistText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  farmerTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  agronomistTimestamp: {
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});
