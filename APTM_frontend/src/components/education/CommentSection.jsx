import React, { useState } from 'react';
import { FaHeart, FaReply, FaShare } from 'react-icons/fa';
import { formatRelativeTime } from '../../utils/educationHelpers';
import '../../styles/education/CommentSection.css';

const CommentSection = ({ academy }) => {
  const [comments, setComments] = useState(academy.comments || []);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      userId: 'currentUser',
      userName: 'You',
      userAvatar: '👤',
      text: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      replies: []
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const handleSubmitReply = (e, commentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const reply = {
      id: Date.now(),
      userId: 'currentUser',
      userName: 'You',
      userAvatar: '👤',
      text: replyText,
      timestamp: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };

    setComments(prev => prev.map(comment => 
      comment.id === commentId 
        ? { ...comment, replies: [...comment.replies, reply] }
        : comment
    ));
    setReplyText('');
    setReplyingTo(null);
  };

  const handleLikeComment = (commentId, isReply = false, replyId = null) => {
    setComments(prev => prev.map(comment => {
      if (isReply && comment.id === commentId) {
        return {
          ...comment,
          replies: comment.replies.map(reply =>
            reply.id === replyId
              ? { 
                  ...reply, 
                  likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                  isLiked: !reply.isLiked 
                }
              : reply
          )
        };
      }
      
      if (!isReply && comment.id === commentId) {
        return { 
          ...comment, 
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked 
        };
      }
      
      return comment;
    }));
  };

  return (
    <div className="edu-comments">
      <div className="edu-comments__header">
        <h3 className="edu-comments__title">Community Discussion</h3>
        <span className="edu-comments__count">{comments.length} comments</span>
      </div>

      {/* Comment Form */}
      <form className="edu-comment-form" onSubmit={handleSubmitComment}>
        <textarea
          className="edu-comment-form__textarea"
          placeholder="Share your thoughts about this academy..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={500}
        />
        <div className="edu-comment-form__actions">
          <div className={`edu-comment-form__chars ${newComment.length > 400 ? 'edu-comment-form__chars--warning' : ''} ${newComment.length >= 500 ? 'edu-comment-form__chars--error' : ''}`}>
            {newComment.length}/500
          </div>
          <button 
            type="submit" 
            className="edu-btn edu-btn--primary"
            disabled={!newComment.trim()}
          >
            Post Comment
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="edu-comments-list">
        {comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="edu-comment">
              {/* Comment Header */}
              <div className="edu-comment__header">
                <div className="edu-comment__author">
                  <div className="edu-comment__avatar">
                    {comment.userAvatar}
                  </div>
                  <div className="edu-comment__info">
                    <div className="edu-comment__name">{comment.userName}</div>
                    <div className="edu-comment__time">
                      {formatRelativeTime(comment.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="edu-comment__actions">
                  <button 
                    className="edu-comment__action"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    <FaReply /> Reply
                  </button>
                  <button className="edu-comment__action">
                    <FaShare /> Share
                  </button>
                </div>
              </div>

              {/* Comment Content */}
              <div className="edu-comment__content">
                {comment.text}
              </div>

              {/* Comment Footer */}
              <div className="edu-comment__footer">
                <div className="edu-comment__likes">
                  <button 
                    className={`edu-comment__like-btn ${comment.isLiked ? 'edu-comment__like-btn--active' : ''}`}
                    onClick={() => handleLikeComment(comment.id)}
                  >
                    <FaHeart />
                  </button>
                  <span>{comment.likes}</span>
                </div>
              </div>

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <form 
                  className="edu-reply-form"
                  onSubmit={(e) => handleSubmitReply(e, comment.id)}
                >
                  <textarea
                    className="edu-comment-form__textarea"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ minHeight: '80px', marginBottom: 'var(--space-sm)' }}
                  />
                  <div className="edu-comment-form__actions">
                    <button 
                      type="button" 
                      className="edu-btn edu-btn--secondary"
                      onClick={() => setReplyingTo(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="edu-btn edu-btn--primary"
                      disabled={!replyText.trim()}
                    >
                      Post Reply
                    </button>
                  </div>
                </form>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="edu-replies">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="edu-comment">
                      <div className="edu-comment__header">
                        <div className="edu-comment__author">
                          <div className="edu-comment__avatar" style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}>
                            {reply.userAvatar}
                          </div>
                          <div className="edu-comment__info">
                            <div className="edu-comment__name">{reply.userName}</div>
                            <div className="edu-comment__time">
                              {formatRelativeTime(reply.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="edu-comment__content">
                        {reply.text}
                      </div>
                      <div className="edu-comment__footer">
                        <div className="edu-comment__likes">
                          <button 
                            className={`edu-comment__like-btn ${reply.isLiked ? 'edu-comment__like-btn--active' : ''}`}
                            onClick={() => handleLikeComment(comment.id, true, reply.id)}
                          >
                            <FaHeart />
                          </button>
                          <span>{reply.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="edu-comments-empty">
            <div className="edu-empty-state__icon">💭</div>
            <div className="edu-empty-state__text">No comments yet</div>
            <p style={{ color: 'var(--color-text-tertiary)' }}>Be the first to start the discussion!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;