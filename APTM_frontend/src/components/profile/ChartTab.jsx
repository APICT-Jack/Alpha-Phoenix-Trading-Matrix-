// components/profile/ChartTab.jsx - Chart upload and sharing component
import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './UserProfileView.module.css';
import { 
  FaChartLine, 
  FaPlus, 
  FaTimes, 
  FaSpinner, 
  FaExternalLinkAlt,
  FaCopy,
  FaCheck,
  FaShareAlt,
  FaEye,
  FaTrash,
  FaEdit,
  FaSync,
  FaCog
} from 'react-icons/fa';
import ChartWidget from './ChartWidget';
import AvatarWithFallback from './AvatarWithFallback';

// Chart types and symbols
const CHART_SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' },
  { value: 'SOLUSDT', label: 'SOL/USDT' },
  { value: 'ADAUSDT', label: 'ADA/USDT' },
  { value: 'DOTUSDT', label: 'DOT/USDT' },
  { value: 'LINKUSDT', label: 'LINK/USDT' },
  { value: 'AVAXUSDT', label: 'AVAX/USDT' },
  { value: 'MATICUSDT', label: 'MATIC/USDT' },
  { value: 'UNIUSDT', label: 'UNI/USDT' },
  { value: 'XRPUSDT', label: 'XRP/USDT' },
  { value: 'DOGEUSDT', label: 'DOGE/USDT' },
  { value: 'SHIBUSDT', label: 'SHIB/USDT' },
  { value: 'LTCUSDT', label: 'LTC/USDT' },
  { value: 'BCHUSDT', label: 'BCH/USDT' },
  { value: 'ETCUSDT', label: 'ETC/USDT' },
  { value: 'FILUSDT', label: 'FIL/USDT' },
  { value: 'ATOMUSDT', label: 'ATOM/USDT' },
  { value: 'NEARUSDT', label: 'NEAR/USDT' },
  { value: 'APTUSDT', label: 'APT/USDT' }
];

const CHART_INTERVALS = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: 'D', label: '1d' },
  { value: 'W', label: '1w' },
  { value: 'M', label: '1M' }
];

const ChartTab = ({ currentUserId, profileUserId, isOwnProfile }) => {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showChartCreator, setShowChartCreator] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChart, setSelectedChart] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState({});
  
  // Chart form state
  const [chartForm, setChartForm] = useState({
    symbol: 'BTCUSDT',
    interval: '30',
    content: '',
    visibility: 'public'
  });

  // Load user's charts
  useEffect(() => {
    loadCharts();
  }, [profileUserId]);

  const loadCharts = async () => {
    if (!profileUserId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/user/${profileUserId}?type=charts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load charts');
      
      const data = await response.json();
      setCharts(data.posts || []);
    } catch (err) {
      console.error('Error loading charts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChartForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateChart = async () => {
    if (!currentUserId) {
      alert('Please login to create charts');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      
      // Add content if exists
      if (chartForm.content.trim()) {
        formData.append('content', chartForm.content);
      }
      
      // Add visibility
      formData.append('visibility', chartForm.visibility);
      
      // Add chart data
      const chartJson = JSON.stringify({
        symbol: chartForm.symbol,
        interval: chartForm.interval,
        theme: 'dark',
        hideToolbar: true,
        hideSideToolbar: true
      });
      formData.append('chart', chartJson);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create chart');
      }

      const data = await response.json();
      
      // Reset form
      setChartForm({
        symbol: 'BTCUSDT',
        interval: '30',
        content: '',
        visibility: 'public'
      });
      setShowChartCreator(false);
      
      // Reload charts
      await loadCharts();
      
      alert('Chart shared successfully!');
    } catch (err) {
      console.error('Error creating chart:', err);
      alert(err.message || 'Failed to create chart');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChart = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this chart?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete chart');

      // Remove from state
      setCharts(prev => prev.filter(chart => chart._id !== postId));
      alert('Chart deleted successfully');
    } catch (err) {
      console.error('Error deleting chart:', err);
      alert(err.message || 'Failed to delete chart');
    }
  };

  const handleCopyLink = (postId, url) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopySuccess({ [postId]: true });
        setTimeout(() => {
          setCopySuccess({});
        }, 2000);
      })
      .catch(() => {
        alert('Failed to copy link');
      });
  };

  const handleShare = (postId) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Trading Chart',
        text: 'Check out this trading chart',
        url: shareUrl
      }).catch(console.error);
    } else {
      handleCopyLink(postId, shareUrl);
    }
  };

  const renderChartCreator = () => (
    <div className={styles.chartCreatorModal}>
      <div className={styles.chartCreatorContent}>
        <div className={styles.chartCreatorHeader}>
          <h3>
            <FaChartLine /> Share New Chart
          </h3>
          <button 
            className={styles.closeBtn}
            onClick={() => setShowChartCreator(false)}
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.chartCreatorBody}>
          <div className={styles.formGroup}>
            <label>Trading Pair</label>
            <select
              name="symbol"
              value={chartForm.symbol}
              onChange={handleInputChange}
              className={styles.select}
              disabled={isSubmitting}
            >
              {CHART_SYMBOLS.map(symbol => (
                <option key={symbol.value} value={symbol.value}>
                  {symbol.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Time Interval</label>
            <select
              name="interval"
              value={chartForm.interval}
              onChange={handleInputChange}
              className={styles.select}
              disabled={isSubmitting}
            >
              {CHART_INTERVALS.map(interval => (
                <option key={interval.value} value={interval.value}>
                  {interval.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Comment (optional)</label>
            <textarea
              name="content"
              value={chartForm.content}
              onChange={handleInputChange}
              placeholder="Add a comment about this chart..."
              className={styles.textarea}
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Visibility</label>
            <select
              name="visibility"
              value={chartForm.visibility}
              onChange={handleInputChange}
              className={styles.select}
              disabled={isSubmitting}
            >
              <option value="public">Public</option>
              <option value="followers_only">Followers Only</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Preview */}
          <div className={styles.previewSection}>
            <label>Preview</label>
            <ChartWidget 
              chartData={{
                symbol: chartForm.symbol,
                interval: chartForm.interval
              }}
            />
          </div>
        </div>

        <div className={styles.chartCreatorFooter}>
          <button 
            className={styles.cancelBtn}
            onClick={() => setShowChartCreator(false)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className={styles.submitBtn}
            onClick={handleCreateChart}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className={styles.spinning} />
                Sharing...
              </>
            ) : (
              <>
                <FaChartLine />
                Share Chart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderChartItem = (post) => {
    const chartMedia = post.media?.find(m => m.type === 'chart');
    if (!chartMedia) return null;

    return (
      <div key={post._id} className={styles.chartItem}>
        <div className={styles.chartItemHeader}>
          <div className={styles.chartUserInfo}>
            <AvatarWithFallback 
              user={post.userId} 
              size="small"
              className={styles.chartAvatar}
            />
            <div>
              <strong>{post.userId?.name}</strong>
              <span className={styles.chartTime}>
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {isOwnProfile && (
            <button 
              className={styles.deleteChartBtn}
              onClick={() => handleDeleteChart(post._id)}
              title="Delete chart"
            >
              <FaTrash />
            </button>
          )}
        </div>

        {post.content && (
          <p className={styles.chartComment}>{post.content}</p>
        )}

        <div className={styles.chartPreviewContainer}>
          <ChartWidget chartData={chartMedia.chartData} />
        </div>

        <div className={styles.chartItemFooter}>
          <div className={styles.chartStats}>
            <span>
              <FaEye /> {post.likes?.length || 0}
            </span>
            <span>
              <FaShareAlt /> {post.shares || 0}
            </span>
          </div>
          
          <div className={styles.chartActions}>
            <button 
              className={styles.chartActionBtn}
              onClick={() => handleCopyLink(post._id)}
              title="Copy link"
            >
              {copySuccess[post._id] ? <FaCheck /> : <FaCopy />}
            </button>
            <button 
              className={styles.chartActionBtn}
              onClick={() => handleShare(post._id)}
              title="Share"
            >
              <FaShareAlt />
            </button>
            <button 
              className={styles.chartActionBtn}
              onClick={() => window.open(`/post/${post._id}`, '_blank')}
              title="Open post"
            >
              <FaExternalLinkAlt />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.chartsTab}>
      {/* Header */}
      <div className={styles.chartsHeader}>
        <h2>
          <FaChartLine /> Trading Charts
        </h2>
        {isOwnProfile && (
          <button 
            className={styles.createChartBtn}
            onClick={() => setShowChartCreator(true)}
          >
            <FaPlus /> Share Chart
          </button>
        )}
      </div>

      {/* Chart Creator Modal */}
      {showChartCreator && renderChartCreator()}

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {loading ? (
          <div className={styles.loadingState}>
            <FaSpinner className={styles.spinning} />
            <p>Loading charts...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>Error: {error}</p>
            <button onClick={loadCharts}>Retry</button>
          </div>
        ) : charts.length === 0 ? (
          <div className={styles.emptyState}>
            <FaChartLine className={styles.emptyIcon} />
            <h3>No Charts Yet</h3>
            <p>
              {isOwnProfile 
                ? "Share your first trading chart with the community!"
                : "This user hasn't shared any charts yet."}
            </p>
            {isOwnProfile && (
              <button 
                className={styles.createFirstChartBtn}
                onClick={() => setShowChartCreator(true)}
              >
                <FaPlus /> Share Your First Chart
              </button>
            )}
          </div>
        ) : (
          <div className={styles.chartsList}>
            {charts.map(post => renderChartItem(post))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartTab;