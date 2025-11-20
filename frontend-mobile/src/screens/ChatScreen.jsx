import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import API from '../api/api';

const ChatScreen = ({ route }) => {
  const { consultationId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMessages();
    // In production, integrate with WebSocket for real-time updates
    // For now, poll every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const response = await API.get(`/api/consultation/${consultationId}/messages`);
      setMessages(response.data.messages || []);
      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      setSending(true);
      const response = await API.post(`/api/consultation/${consultationId}/message`, {
        message: messageText,
      });

      setMessageText('');
      // Add optimistic message
      setMessages([...messages, {
        id: Date.now(),
        sender_id: user.id,
        sender_name: user.full_name,
        message: messageText,
        created_at: new Date().toISOString(),
        is_agronomist: user.role === 'agronomist',
      }]);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender_id === user.id;
    
    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        <View style={[styles.messageBubble, isOwnMessage && styles.ownMessageBubble]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>{item.sender_name}</Text>
          )}
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {item.message}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id?.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (sending || !messageText.trim()) && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={sending || !messageText.trim()}
        >
          <Text style={styles.sendButtonText}>{sending ? '...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ownMessageBubble: {
    backgroundColor: '#3498db',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  ownMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#27ae60',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChatScreen;
