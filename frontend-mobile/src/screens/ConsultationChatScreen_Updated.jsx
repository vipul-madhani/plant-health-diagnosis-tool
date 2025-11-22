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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute } from '@react-navigation/native';
import api from '../api/api';
import analyticsService from '../services/analyticsService';

export default function ConsultationChatScreen() {
  const route = useRoute();
  const { consultationId } = route.params;
  const flatListRef = useRef();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [consultation, setConsultation] = useState(null);
  const [isAIActive, setIsAIActive] = useState(false);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [consultationId]);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/consultation/${consultationId}/messages`);
      setMessages(response.data.messages || []);
      setConsultation(response.data.consultation);
      
      // Check if AI bot is active
      const hasAIMessages = response.data.messages?.some(m => m.isFromBot);
      if (hasAIMessages && !isAIActive) {
        setIsAIActive(true);
        await analyticsService.logAIBotEngaged(consultationId, response.data.consultation.userId);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      setLoading(true);
      const tempMessage = {
        _id: Date.now(),
        text: inputText,
        senderId: 'me',
        timestamp: new Date(),
        sending: true,
      };

      setMessages(prev => [...prev, tempMessage]);
      setInputText('');

      await api.post(`/consultation/${consultationId}/messages`, {
        text: inputText,
      });

      // Refresh messages to get AI/agronomist response
      await loadMessages();
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isFromMe = item.senderId === 'me' || !item.isFromBot;
    const isBot = item.isFromBot || item.senderId === 'ai-bot-system';
    const isAgronomist = !isBot && !isFromMe;

    return (
      <View
        style={[
          styles.messageContainer,
          isFromMe ? styles.myMessage : styles.theirMessage,
        ]}
      >
        {/* Bot/Agronomist Identifier */}
        {!isFromMe && (
          <View style={styles.senderInfo}>
            {isBot ? (
              <View style={styles.botBadge}>
                <Icon name="robot" size={14} color="#FF9800" />
                <Text style={styles.botBadgeText}>AI Assistant</Text>
              </View>
            ) : (
              <View style={styles.agronomistBadge}>
                <Icon name="account-tie" size={14} color="#4CAF50" />
                <Text style={styles.agronomistBadgeText}>Agronomist</Text>
              </View>
            )}
          </View>
        )}

        {/* Message Bubble */}
        <View
          style={[
            styles.messageBubble,
            isFromMe && styles.myMessageBubble,
            isBot && styles.botMessageBubble,
            isAgronomist && styles.agronomistMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isFromMe && styles.myMessageText,
              isBot && styles.botMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isFromMe && styles.myTimestamp,
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header Info */}
      {isAIActive && consultation?.status === 'pending' && (
        <View style={styles.aiActiveBar}>
          <Icon name="robot" size={20} color="#FF9800" />
          <Text style={styles.aiActiveText}>
            AI Assistant is helping you. An agronomist will join soon.
          </Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
        >
          <Icon
            name={loading ? 'loading' : 'send'}
            size={24}
            color="#fff"
          />
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
  aiActiveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  aiActiveText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  senderInfo: {
    marginBottom: 4,
  },
  botBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  botBadgeText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
  },
  agronomistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  agronomistBadgeText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF9800',
    borderBottomLeftRadius: 4,
  },
  agronomistMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: '#E0E0E0',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});