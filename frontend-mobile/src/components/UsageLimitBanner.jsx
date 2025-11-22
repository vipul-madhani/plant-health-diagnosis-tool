import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const UsageLimitBanner = ({ remaining, total = 3, used = 0 }) => {
  const percentage = ((total - remaining) / total) * 100;
  
  // Determine color based on remaining
  let color, bgColor, icon;
  
  if (remaining === 0) {
    color = '#F44336'; // Red
    bgColor = '#FFEBEE';
    icon = 'alert-circle';
  } else if (remaining === 1) {
    color = '#FF9800'; // Orange
    bgColor = '#FFF3E0';
    icon = 'alert';
  } else {
    color = '#4CAF50'; // Green
    bgColor = '#E8F5E9';
    icon = 'check-circle';
  }

  const getMessage = () => {
    if (remaining === 0) {
      return 'Free limit reached. Upgrade to continue';
    } else if (remaining === 1) {
      return 'This is your last free analysis';
    } else {
      return `${remaining} free ${remaining === 1 ? 'analysis' : 'analyses'} remaining`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={24} color={color} />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.message, { color }]}>
          {getMessage()}
        </Text>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        
        <Text style={styles.subtext}>
          {used} of {total} used • Lifetime limit
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  subtext: {
    fontSize: 12,
    color: '#666',
  },
});

export default UsageLimitBanner;
