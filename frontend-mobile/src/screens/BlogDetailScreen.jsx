import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const BlogDetailScreen = ({ route, navigation }) => {
  const { blog } = route.params;
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(0);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this solution: ${blog.title}\n\n${blog.content}\n\nEffectiveness: ${blog.effectiveness_rating}%`,
        title: blog.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const toggleSave = () => {
    setIsSaved(!isSaved);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solution Guide</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main Title & Meta */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{blog.title}</Text>
          <Text style={styles.subtitle}>
            {blog.crop_type} • {blog.disease}
          </Text>
          <Text style={styles.publishDate}>
            Published: {new Date(blog.generated_date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Key Metrics - ALL 5 POINTS */}
        <View style={styles.metricsContainer}>
          {/* 1. Effectiveness Rating */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <MaterialIcons name="verified-user" size={24} color="#4CAF50" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Effectiveness</Text>
              <Text style={styles.metricValue}>{blog.effectiveness_rating}%</Text>
              <Text style={styles.metricDesc}>Proven effective in tests</Text>
            </View>
          </View>

          {/* 2. Supporting Cases */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <MaterialIcons name="people" size={24} color="#FF9800" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Success Stories</Text>
              <Text style={styles.metricValue}>{blog.supporting_consultations}</Text>
              <Text style={styles.metricDesc}>Farmers reported success</Text>
            </View>
          </View>

          {/* 3. Region & Season */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <MaterialIcons name="public" size={24} color="#2196F3" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Recommended For</Text>
              <Text style={styles.metricValue}>{blog.region}</Text>
              <Text style={styles.metricDesc}>During {blog.season} season</Text>
            </View>
          </View>

          {/* 4. Publication Date/Time */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconContainer}>
              <MaterialIcons name="calendar-today" size={24} color="#9C27B0" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Added To Knowledge Base</Text>
              <Text style={styles.metricValue}>
                {new Date(blog.generated_date).toLocaleDateString('en-IN')}
              </Text>
              <Text style={styles.metricDesc}>
                {new Date(blog.generated_date).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          {/* 5. Verification Status */}
          <View style={[
            styles.metricCard,
            blog.confidence_score >= 0.8 && styles.verifiedCard,
          ]}>
            <View style={[
              styles.metricIconContainer,
              blog.confidence_score >= 0.8 && styles.verifiedIconContainer,
            ]}>
              <MaterialIcons
                name={blog.confidence_score >= 0.8 ? 'check-circle' : 'info'}
                size={24}
                color={blog.confidence_score >= 0.8 ? '#4CAF50' : '#999'}
              />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>
                {blog.confidence_score >= 0.8 ? 'Expert Verified' : 'Under Review'}
              </Text>
              <Text style={styles.metricValue}>
                {Math.round(blog.confidence_score * 100)}% Confidence
              </Text>
              <Text style={styles.metricDesc}>
                {blog.confidence_score >= 0.8
                  ? 'Approved by agronomists'
                  : 'Pending expert review'}
              </Text>
            </View>
          </View>
        </View>

        {/* Full Content */}
        <View style={styles.contentSection}>
          <Text style={styles.contentTitle}>Complete Guide</Text>
          <Text style={styles.contentText}>{blog.content}</Text>
        </View>

        {/* Engagement Section */}
        <View style={styles.engagementSection}>
          <View style={styles.engagementRow}>
            <TouchableOpacity style={styles.engagementButton}>
              <MaterialIcons name="thumb-up" size={20} color="#2196F3" />
              <Text style={styles.engagementLabel}>Helpful</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.engagementButton}>
              <MaterialIcons name="thumb-down" size={20} color="#F44336" />
              <Text style={styles.engagementLabel}>Not Helpful</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.engagementButton}
              onPress={toggleSave}
            >
              <MaterialIcons
                name={isSaved ? 'bookmark' : 'bookmark-border'}
                size={20}
                color={isSaved ? '#FF9800' : '#999'}
              />
              <Text style={styles.engagementLabel}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.engagementButton}
              onPress={handleShare}
            >
              <MaterialIcons name="share" size={20} color="#4CAF50" />
              <Text style={styles.engagementLabel}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footerInfo}>
          <MaterialIcons name="info" size={16} color="#999" />
          <Text style={styles.footerText}>
            This solution is based on {blog.supporting_consultations} successful
            farmer consultations with {blog.effectiveness_rating}% effectiveness.
            Report if this didn't work for you.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  titleSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  publishDate: {
    fontSize: 12,
    color: '#999',
  },
  metricsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metricCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#eee',
  },
  verifiedCard: {
    backgroundColor: '#f1f8f5',
    borderColor: '#4CAF50',
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verifiedIconContainer: {
    backgroundColor: '#e8f5e9',
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  metricDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  contentSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  engagementSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  engagementButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  engagementLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  footerInfo: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});

export default BlogDetailScreen;
