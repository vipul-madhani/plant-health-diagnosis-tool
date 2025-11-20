import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './BlogPage.css';

const BlogPage = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');

  const regions = ['All', 'North', 'South', 'East', 'West', 'Central', 'Northeast'];
  const seasons = ['All', 'Summer', 'Monsoon', 'Winter', 'Spring', 'Autumn'];

  useEffect(() => {
    fetchBlogs();
  }, [selectedRegion, selectedSeason]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedRegion !== 'All') params.region = selectedRegion;
      if (selectedSeason !== 'All') params.season = selectedSeason;
      
      const response = await api.get('/blog', { params });
      setBlogs(response.data);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (blogId) => {
    try {
      await api.post(`/blog/${blogId}/like`);
      fetchBlogs();
    } catch (error) {
      console.error('Error liking blog:', error);
    }
  };

  const handleComment = async (blogId, commentText) => {
    try {
      await api.post(`/blog/${blogId}/comment`, { text: commentText });
      fetchBlogs();
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="blog-page">
      <div className="blog-header">
        <h1>Community Blog & Knowledge Base</h1>
        <p>Regional crop insights and plant health tips from our community</p>
      </div>

      <div className="blog-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search blogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Region:</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Season:</label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
          >
            {seasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading blogs...</div>
      ) : (
        <div className="blog-list">
          {filteredBlogs.length === 0 ? (
            <p className="no-blogs">No blogs found for this filter combination.</p>
          ) : (
            filteredBlogs.map(blog => (
              <BlogCard
                key={blog._id}
                blog={blog}
                onLike={handleLike}
                onComment={handleComment}
                user={user}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const BlogCard = ({ blog, onLike, onComment, user }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(blog._id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="blog-card">
      <div className="blog-card-header">
        <h3>{blog.title}</h3>
        {blog.effectivenessScore >= 80 && (
          <span className="effectiveness-badge">
            ✓ {blog.effectivenessScore}% Effective
          </span>
        )}
      </div>

      <div className="blog-meta">
        <span className="author">By {blog.author?.name || 'Anonymous'}</span>
        <span className="region">📍 {blog.region}</span>
        <span className="season">🌱 {blog.season}</span>
        <span className="date">{new Date(blog.createdAt).toLocaleDateString('en-IN')}</span>
      </div>

      <div className="blog-content">
        <p>{blog.content}</p>
      </div>

      {blog.images && blog.images.length > 0 && (
        <div className="blog-images">
          {blog.images.map((img, index) => (
            <img key={index} src={img} alt={`Blog ${index + 1}`} />
          ))}
        </div>
      )}

      <div className="blog-actions">
        <button
          className={`like-btn ${blog.likes?.includes(user?._id) ? 'liked' : ''}`}
          onClick={() => onLike(blog._id)}
          disabled={!user}
        >
          ❤️ {blog.likes?.length || 0} Likes
        </button>

        <button
          className="comment-btn"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {blog.comments?.length || 0} Comments
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <div className="comments-list">
            {blog.comments?.map((comment, index) => (
              <div key={index} className="comment">
                <strong>{comment.user?.name || 'Anonymous'}:</strong>
                <span>{comment.text}</span>
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {user && (
            <form onSubmit={handleSubmitComment} className="comment-form">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit">Post</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogPage;
