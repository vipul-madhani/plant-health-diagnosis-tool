import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const BlogFeedScreen = ({ navigation }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const CROPS = ['Rice', 'Wheat', 'Tomato', 'Onion', 'Potato', 'Cotton'];
  const REGIONS = ['North', 'South', 'East', 'West'];
  const SEASONS = ['Monsoon', 'Summer', 'Winter', 'Spring'];

  // Fetch blogs based on filters
  useEffect(() => {
    fetchBlogs();
  }, [selectedCrop, selectedRegion, selectedSeason]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:5000/api/community/blogs';
      const params = [];

      if (selectedCrop) params.push(`crop=${selectedCrop}`);
      if (selectedRegion) params.push(`region=${selectedRegion}`);
      if (selectedSeason) params.push(`season=${selectedSeason}`);

      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await axios.get(url);
      setBlogs(response.data.blogs || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlogPress = (blog) => {
    navigation.navigate('BlogDetail', { blog });
  };

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.disease.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const BlogCard = ({ blog }) => (
    <TouchableOpacity
      style={styles.blogCard}
      onPress={() => handleBlogPress(blog)}
    >
      <View style={styles.blogHeader}>
        <View>
          <Text style={styles.blogTitle}>{blog.title}</Text>
          <Text style={styles.blogSubtitle}>
            {blog.crop_type} • {blog.disease}
          </Text>
        </View>
        <MaterialIcons name="arrow-forward" size={20} color="#4CAF50" />
      </View>

      <Text style={styles.blogPreview} numberOfLines={2}>
        {blog.content.substring(0, 100)}...
      </Text>

      <View style={styles.blogFooter}>
        <View style={styles.stats}>
          <MaterialIcons name="verified" size={16} color="#2196F3" />
          <Text style={styles.statText}>{blog.effectiveness_rating}%</Text>
        </View>
        <View style={styles.stats}>
          <MaterialIcons name="people" size={16} color="#FF9800" />
          <Text style={styles.statText}>{blog.supporting_consultations} cases</Text>
        </View>
        <View style={styles.stats}>
          <MaterialIcons name="calendar-today" size={16} color="#9C27B0" />
          <Text style={styles.statText}>{new Date(blog.generated_date).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.tagContainer}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{blog.region}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{blog.season}</Text>
        </View>
        {blog.confidence_score >= 0.8 && (
          <View style={[styles.tag, styles.highConfidenceTag]}>
            <Text style={styles.tagText}>Verified</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Knowledge Base</Text>
        <Text style={styles.headerSubtitle}>Expert-verified solutions</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search blogs or diseases..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {/* Crop Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipGroup}>
          {CROPS.map((crop) => (
            <TouchableOpacity
              key={crop}
              style={[
                styles.filterChip,
                selectedCrop === crop && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCrop(selectedCrop === crop ? null : crop)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCrop === crop && styles.filterChipTextActive,
                ]}
              >
                {crop}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Region Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipGroup}>
          {REGIONS.map((region) => (
            <TouchableOpacity
              key={region}
              style={[
                styles.filterChip,
                selectedRegion === region && styles.filterChipActive,
              ]}
              onPress={() => setSelectedRegion(selectedRegion === region ? null : region)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedRegion === region && styles.filterChipTextActive,
                ]}
              >
                {region}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Season Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipGroup}>
          {SEASONS.map((season) => (
            <TouchableOpacity
              key={season}
              style={[
                styles.filterChip,
                selectedSeason === season && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSeason(selectedSeason === season ? null : season)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSeason === season && styles.filterChipTextActive,
                ]}
              >
                {season}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Blog Feed */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : filteredBlogs.length > 0 ? (
        <FlatList
          data={filteredBlogs}
          renderItem={({ item }) => <BlogCard blog={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="article" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No blogs found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  filterScroll: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChipGroup: {
    paddingHorizontal: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  blogCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  blogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  blogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: '85%',
  },
  blogSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  blogPreview: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  blogFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highConfidenceTag: {
    backgroundColor: '#c8e6c9',
  },
  tagText: {
    fontSize: 10,
    color: '#555',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 8,
  },
});

export default BlogFeedScreen;
