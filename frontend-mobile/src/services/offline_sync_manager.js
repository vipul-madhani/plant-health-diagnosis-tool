/**
 * Offline Sync Manager for React Native
 * Handles local data storage, sync queue, and automatic background sync
 * Uses SQLite for persistent storage and AsyncStorage for lightweight data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import BackgroundFetch from 'react-native-background-fetch';

class OfflineSyncManager {
  constructor() {
    this.db = null;
    this.syncQueue = [];
    this.isSyncing = false;
    this.isOnline = true;
    
    this.init();
  }

  async init() {
    // Initialize SQLite database
    this.db = await SQLite.openDatabaseAsync('plant_health_offline.db');
    
    // Create tables
    await this.createTables();
    
    // Load sync queue from storage
    await this.loadSyncQueue();
    
    // Setup network listener
    this.setupNetworkListener();
    
    // Setup background sync
    this.setupBackgroundSync();
  }

  async createTables() {
    // Analysis results table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        image_uri TEXT NOT NULL,
        predicted_class TEXT,
        confidence REAL,
        all_predictions TEXT,
        timestamp INTEGER,
        synced INTEGER DEFAULT 0,
        metadata TEXT
      );
    `);

    // Consultations table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS consultations (
        id TEXT PRIMARY KEY,
        farmer_id TEXT,
        agronomist_id TEXT,
        status TEXT,
        amount REAL,
        created_at INTEGER,
        synced INTEGER DEFAULT 0,
        data TEXT
      );
    `);

    // Messages table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        consultation_id TEXT,
        sender_id TEXT,
        content TEXT,
        media_uri TEXT,
        media_type TEXT,
        timestamp INTEGER,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id)
      );
    `);

    // Sync queue table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        data TEXT,
        created_at INTEGER,
        retry_count INTEGER DEFAULT 0,
        last_error TEXT
      );
    `);

    // User preferences
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS preferences (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      // Trigger sync when coming back online
      if (wasOffline && this.isOnline) {
        console.log('Network restored. Starting sync...');
        this.syncAll();
      }
    });
  }

  setupBackgroundSync() {
    BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // Minutes
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
      },
      async (taskId) => {
        console.log('[BackgroundFetch] Task started:', taskId);
        
        // Perform sync
        await this.syncAll();
        
        // Required: Signal completion
        BackgroundFetch.finish(taskId);
      },
      (error) => {
        console.error('[BackgroundFetch] Failed to start:', error);
      }
    );
  }

  // ==================== ANALYSIS STORAGE ====================

  async saveAnalysisOffline(analysisData) {
    const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await this.db.runAsync(
      `INSERT INTO analyses (id, image_uri, predicted_class, confidence, all_predictions, timestamp, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        analysisData.imageUri,
        analysisData.predictedClass,
        analysisData.confidence,
        JSON.stringify(analysisData.allPredictions),
        Date.now(),
        JSON.stringify(analysisData.metadata || {})
      ]
    );

    // Add to sync queue
    await this.addToSyncQueue({
      action: 'upload_analysis',
      endpoint: '/api/analysis/upload',
      method: 'POST',
      data: analysisData
    });

    return { id, success: true, offline: true };
  }

  async getOfflineAnalyses(userId) {
    const analyses = await this.db.getAllAsync(
      'SELECT * FROM analyses WHERE synced = 0 ORDER BY timestamp DESC'
    );

    return analyses.map(row => ({
      id: row.id,
      imageUri: row.image_uri,
      predictedClass: row.predicted_class,
      confidence: row.confidence,
      allPredictions: JSON.parse(row.all_predictions),
      timestamp: row.timestamp,
      metadata: JSON.parse(row.metadata),
      offline: true
    }));
  }

  async markAnalysisSynced(id) {
    await this.db.runAsync(
      'UPDATE analyses SET synced = 1 WHERE id = ?',
      [id]
    );
  }

  // ==================== CONSULTATION STORAGE ====================

  async saveConsultationOffline(consultationData) {
    const id = `consultation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.runAsync(
      `INSERT INTO consultations (id, farmer_id, agronomist_id, status, amount, created_at, data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        consultationData.farmerId,
        consultationData.agronomistId || null,
        consultationData.status || 'pending',
        consultationData.amount || 0,
        Date.now(),
        JSON.stringify(consultationData)
      ]
    );

    await this.addToSyncQueue({
      action: 'create_consultation',
      endpoint: '/api/consultations',
      method: 'POST',
      data: consultationData
    });

    return { id, success: true, offline: true };
  }

  async getOfflineConsultations(userId) {
    const consultations = await this.db.getAllAsync(
      'SELECT * FROM consultations WHERE synced = 0 AND (farmer_id = ? OR agronomist_id = ?) ORDER BY created_at DESC',
      [userId, userId]
    );

    return consultations.map(row => ({
      ...JSON.parse(row.data),
      id: row.id,
      offline: true
    }));
  }

  // ==================== MESSAGE STORAGE ====================

  async saveMessageOffline(messageData) {
    const id = `message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.runAsync(
      `INSERT INTO messages (id, consultation_id, sender_id, content, media_uri, media_type, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        messageData.consultationId,
        messageData.senderId,
        messageData.content || '',
        messageData.mediaUri || null,
        messageData.mediaType || null,
        Date.now()
      ]
    );

    await this.addToSyncQueue({
      action: 'send_message',
      endpoint: `/api/consultations/${messageData.consultationId}/messages`,
      method: 'POST',
      data: messageData
    });

    return { id, success: true, offline: true };
  }

  async getOfflineMessages(consultationId) {
    const messages = await this.db.getAllAsync(
      'SELECT * FROM messages WHERE consultation_id = ? ORDER BY timestamp ASC',
      [consultationId]
    );

    return messages.map(row => ({
      id: row.id,
      consultationId: row.consultation_id,
      senderId: row.sender_id,
      content: row.content,
      mediaUri: row.media_uri,
      mediaType: row.media_type,
      timestamp: row.timestamp,
      synced: row.synced === 1,
      offline: row.synced === 0
    }));
  }

  // ==================== SYNC QUEUE MANAGEMENT ====================

  async addToSyncQueue(item) {
    await this.db.runAsync(
      `INSERT INTO sync_queue (action, endpoint, method, data, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        item.action,
        item.endpoint,
        item.method,
        JSON.stringify(item.data),
        Date.now()
      ]
    );

    // Trigger immediate sync if online
    if (this.isOnline && !this.isSyncing) {
      setTimeout(() => this.syncAll(), 100);
    }
  }

  async loadSyncQueue() {
    const items = await this.db.getAllAsync(
      'SELECT * FROM sync_queue ORDER BY created_at ASC'
    );

    this.syncQueue = items.map(row => ({
      id: row.id,
      action: row.action,
      endpoint: row.endpoint,
      method: row.method,
      data: JSON.parse(row.data),
      retryCount: row.retry_count,
      lastError: row.last_error
    }));
  }

  async syncAll() {
    if (!this.isOnline || this.isSyncing) {
      return { success: false, reason: 'offline or already syncing' };
    }

    this.isSyncing = true;
    const results = {
      synced: 0,
      failed: 0,
      errors: []
    };

    try {
      await this.loadSyncQueue();

      for (const item of this.syncQueue) {
        try {
          const result = await this.syncItem(item);
          
          if (result.success) {
            results.synced++;
            await this.removeSyncQueueItem(item.id);
            
            // Mark related records as synced
            if (item.action === 'upload_analysis') {
              await this.markAnalysisSynced(item.data.id);
            }
          } else {
            results.failed++;
            results.errors.push({ item: item.action, error: result.error });
            
            // Update retry count
            await this.updateSyncQueueRetry(item.id, result.error);
            
            // Remove if too many retries
            if (item.retryCount >= 5) {
              await this.removeSyncQueueItem(item.id);
              console.error(`Max retries reached for ${item.action}. Removing from queue.`);
            }
          }
        } catch (error) {
          results.failed++;
          results.errors.push({ item: item.action, error: error.message });
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  async syncItem(item) {
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('authToken');
      
      // Prepare request
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(item.data)
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateSyncQueueRetry(id, error) {
    await this.db.runAsync(
      'UPDATE sync_queue SET retry_count = retry_count + 1, last_error = ? WHERE id = ?',
      [error, id]
    );
  }

  async removeSyncQueueItem(id) {
    await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  async clearSyncQueue() {
    await this.db.runAsync('DELETE FROM sync_queue');
    this.syncQueue = [];
  }

  // ==================== PREFERENCES ====================

  async savePreference(key, value) {
    await this.db.runAsync(
      'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)',
      [key, JSON.stringify(value)]
    );
  }

  async getPreference(key) {
    const result = await this.db.getFirstAsync(
      'SELECT value FROM preferences WHERE key = ?',
      [key]
    );
    return result ? JSON.parse(result.value) : null;
  }

  // ==================== CACHE MANAGEMENT ====================

  async cacheData(key, data, expiryMinutes = 60) {
    const expiryTime = Date.now() + (expiryMinutes * 60 * 1000);
    await AsyncStorage.setItem(
      `cache_${key}`,
      JSON.stringify({
        data,
        expiry: expiryTime
      })
    );
  }

  async getCachedData(key) {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const { data, expiry } = JSON.parse(cached);
      
      if (Date.now() > expiry) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  async clearCache() {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  // ==================== STATUS & STATS ====================

  async getSyncStatus() {
    const queueCount = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM sync_queue'
    );

    const unsyncedAnalyses = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM analyses WHERE synced = 0'
    );

    const unsyncedMessages = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM messages WHERE synced = 0'
    );

    return {
      online: this.isOnline,
      syncing: this.isSyncing,
      queueSize: queueCount.count,
      pendingAnalyses: unsyncedAnalyses.count,
      pendingMessages: unsyncedMessages.count,
      lastSync: await this.getPreference('lastSyncTime')
    };
  }

  async clearAllOfflineData() {
    await this.db.execAsync('DELETE FROM analyses');
    await this.db.execAsync('DELETE FROM consultations');
    await this.db.execAsync('DELETE FROM messages');
    await this.db.execAsync('DELETE FROM sync_queue');
    await this.clearCache();
  }
}

// Singleton instance
let offlineSyncManager = null;

export const getOfflineSyncManager = () => {
  if (!offlineSyncManager) {
    offlineSyncManager = new OfflineSyncManager();
  }
  return offlineSyncManager;
};

export default OfflineSyncManager;
