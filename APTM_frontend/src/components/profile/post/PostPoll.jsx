// PostPoll.jsx
// Renders interactive poll with voting functionality
// Shows results after voting or when poll has ended

import React from 'react';
import styles from '../styles/post.module.css';

const PostPoll = ({
  pollData,
  hasVoted,
  selectedOption,
  isVoting,
  onVote
}) => {
  if (!pollData) return null;
  
  const now = new Date();
  const endsAt = new Date(pollData.endsAt);
  const hasExpired = now > endsAt;
  const totalVotes = pollData.totalVotes || 0;
  
  return (
    <div className={styles.pollContainer}>
      <div className={styles.pollHeader}>
        <h4 className={styles.pollQuestion}>{pollData.question}</h4>
        {hasExpired && <span className={styles.pollExpired}>Ended</span>}
        {hasVoted && !hasExpired && <span className={styles.pollVoted}>✓ You voted</span>}
      </div>
      
      <div className={styles.pollOptions}>
        {pollData.options.map((option, index) => {
          const voteCount = option.voteCount || 0;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const isSelected = selectedOption === index;
          
          const canVote = !hasVoted && !hasExpired && !isVoting;
          
          return (
            <div key={index} className={styles.pollOptionWrapper}>
              <button
                className={`${styles.pollOptionButton} ${
                  hasVoted || hasExpired ? styles.pollOptionResults : ''
                } ${isSelected ? styles.pollOptionSelected : ''} ${
                  isVoting ? styles.voting : ''
                }`}
                onClick={() => canVote && onVote(index)}
                disabled={!canVote}
                data-selected={isSelected}
              >
                <span className={styles.pollOptionText}>{option.text}</span>
                <span className={styles.pollPercentage}>
                  {Math.round(percentage)}% ({voteCount} vote{voteCount !== 1 ? 's' : ''})
                </span>
              </button>
              
              <div 
                className={styles.pollProgressBar}
                style={{ width: `${percentage}%` }}
              />
            </div>
          );
        })}
      </div>
      
      <div className={styles.pollFooter}>
        <span className={styles.pollTotalVotes}>
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
        </span>
        <span className={styles.pollDot}>•</span>
        <span className={styles.pollEnds}>
          {hasExpired ? ' Ended' : ` Ends ${endsAt.toLocaleDateString()}`}
        </span>
        {pollData.multipleChoice && (
          <>
            <span className={styles.pollDot}>•</span>
            <span className={styles.pollMultipleChoice}>Multiple choices allowed</span>
          </>
        )}
      </div>
    </div>
  );
};

export default PostPoll;