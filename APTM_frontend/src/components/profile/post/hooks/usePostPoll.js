// usePostPoll.js
// Manages poll data and voting functionality
// Handles API calls and state updates for polls

import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../../../../services/notificationService';

const usePostPoll = ({ post, currentUserId, onPostUpdate }) => {
  const [pollData, setPollData] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);

  // Initialize poll data from post
  useEffect(() => {
    if (post?.poll) {
      setPollData(post.poll);
      
      // Check if user has already voted
      if (post.poll.userVotes && post.poll.userVotes.length > 0) {
        setHasVoted(true);
        setSelectedOption(post.poll.userVotes[0]);
      } else {
        setHasVoted(false);
        setSelectedOption(null);
      }
    } else {
      setPollData(null);
      setHasVoted(false);
      setSelectedOption(null);
    }
  }, [post]);

  // Vote handler
  const handleVote = useCallback(async (optionIndex) => {
    if (!currentUserId) {
      notificationService.warning('Please login to vote');
      return;
    }

    if (!pollData) {
      notificationService.error('Poll data not found');
      return;
    }

    if (hasVoted) {
      notificationService.info('You have already voted in this poll');
      return;
    }

    // Check if poll has expired
    const now = new Date();
    const endsAt = new Date(pollData.endsAt);
    if (now > endsAt) {
      notificationService.info('This poll has ended');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/polls/${pollData._id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ optionIndices: [optionIndex] })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to vote');
      }

      // Update poll data with new results
      if (data.poll) {
        setPollData(data.poll);
        setHasVoted(true);
        setSelectedOption(optionIndex);
        
        if (onPostUpdate) {
          onPostUpdate({ poll: data.poll });
        }
      }

      notificationService.success('Your vote has been recorded');
      
    } catch (error) {
      console.error('Failed to vote:', error);
      notificationService.error(error.message || 'Could not vote on poll');
    } finally {
      setIsVoting(false);
    }
  }, [currentUserId, pollData, hasVoted, isVoting, onPostUpdate]);

  return {
    pollData,
    hasVoted,
    selectedOption,
    isVoting,
    handleVote
  };
};

export default usePostPoll;