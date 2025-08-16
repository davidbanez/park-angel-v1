import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ratingService } from '@park-angel/shared/src/services/rating';
import { 
  Rating, 
  RatingAggregate,
  RatedType, 
  RatingFilter 
} from '@park-angel/shared/src/models/rating';
import { useAuth } from '../../hooks/useAuth';

interface RatingDisplayProps {
  ratedId: string;
  ratedType: RatedType;
  showAddRating?: boolean;
  onAddRating?: () => void;
}

export const RatingDisplay: React.FC<RatingDisplayProps> = ({
  ratedId,
  ratedType,
  showAddRating = false,
  onAddRating,
}) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [aggregate, setAggregate] = useState<RatingAggregate | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<RatingFilter | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadRatings();
    loadAggregate();
  }, [ratedId, ratedType, filter]);

  const loadRatings = async () => {
    try {
      setLoading(true);
      const ratingList = await ratingService.getRatingsForEntity(
        ratedId,
        ratedType,
        filter,
        20,
        0
      );
      setRatings(ratingList);
    } catch (error) {
      console.error('Error loading ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAggregate = async () => {
    try {
      const ratingAggregate = await ratingService.getRatingAggregate(ratedId, ratedType);
      setAggregate(ratingAggregate);
    } catch (error) {
      console.error('Error loading rating aggregate:', error);
    }
  };

  const flagRating = async (rating: Rating) => {
    Alert.alert(
      'Report Review',
      'Why are you reporting this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Inappropriate Content', 
          onPress: () => submitFlag(rating, 'Inappropriate content') 
        },
        { 
          text: 'Spam', 
          onPress: () => submitFlag(rating, 'Spam') 
        },
        { 
          text: 'Fake Review', 
          onPress: () => submitFlag(rating, 'Fake review') 
        },
      ]
    );
  };

  const submitFlag = async (rating: Rating, reason: string) => {
    try {
      await ratingService.flagRating(rating.id, reason);
      Alert.alert('Reported', 'Thank you for reporting this review. We will investigate.');
    } catch (error) {
      console.error('Error flagging rating:', error);
      Alert.alert('Error', 'Failed to report review. Please try again.');
    }
  };

  const renderStars = (score: number, size: number = 16) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= score ? 'star' : 'star-outline'}
            size={size}
            color={star <= score ? '#F59E0B' : '#D1D5DB'}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  const renderScoreDistribution = () => {
    if (!aggregate || aggregate.totalRatings === 0) return null;

    return (
      <View style={styles.distributionContainer}>
        {[5, 4, 3, 2, 1].map((score) => {
          const count = aggregate.scoreDistribution.getPercentageForScore(score);
          return (
            <View key={score} style={styles.distributionRow}>
              <Text style={styles.distributionScore}>{score}</Text>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <View style={styles.distributionBar}>
                <View 
                  style={[
                    styles.distributionFill,
                    { width: `${count}%` }
                  ]} 
                />
              </View>
              <Text style={styles.distributionPercent}>{count}%</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRatingItem = ({ item: rating }: { item: Rating }) => {
    const canFlag = user && rating.raterId.value !== user.id;

    return (
      <View style={styles.ratingItem}>
        <View style={styles.ratingHeader}>
          <View style={styles.ratingUserInfo}>
            <View style={styles.ratingAvatar}>
              <Ionicons name="person" size={20} color="#9CA3AF" />
            </View>
            <View style={styles.ratingUserDetails}>
              <Text style={styles.ratingUserName}>Anonymous User</Text>
              <View style={styles.ratingMeta}>
                {renderStars(rating.score, 14)}
                <Text style={styles.ratingDate}>
                  {rating.createdAt.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
          
          {canFlag && (
            <TouchableOpacity
              style={styles.flagButton}
              onPress={() => flagRating(rating)}
            >
              <Ionicons name="flag-outline" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {rating.review && (
          <Text style={styles.ratingReview}>{rating.review}</Text>
        )}

        {rating.photos.length > 0 && (
          <FlatList
            data={rating.photos}
            horizontal
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item: photo }) => (
              <Image source={{ uri: photo }} style={styles.ratingPhoto} />
            )}
            style={styles.ratingPhotos}
            showsHorizontalScrollIndicator={false}
          />
        )}

        {rating.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Overall Rating */}
      <View style={styles.overallRating}>
        <View style={styles.scoreContainer}>
          <Text style={styles.overallScore}>
            {aggregate?.averageScore.toFixed(1) || '0.0'}
          </Text>
          {renderStars(aggregate?.getAverageScoreRounded() || 0, 20)}
        </View>
        <Text style={styles.totalRatings}>
          {aggregate?.totalRatings || 0} reviews
        </Text>
        <Text style={styles.reputationLevel}>
          {aggregate?.getReputationLevel() || 'No ratings yet'}
        </Text>
      </View>

      {/* Score Distribution */}
      {aggregate && aggregate.totalRatings > 0 && renderScoreDistribution()}

      {/* Add Rating Button */}
      {showAddRating && onAddRating && (
        <TouchableOpacity style={styles.addRatingButton} onPress={onAddRating}>
          <Ionicons name="star-outline" size={20} color="#7C3AED" />
          <Text style={styles.addRatingText}>Write a Review</Text>
        </TouchableOpacity>
      )}

      {/* Filter Options */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter-outline" size={16} color="#6B7280" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterOptions}>
          <TouchableOpacity
            style={[styles.filterOption, !filter && styles.filterOptionActive]}
            onPress={() => setFilter(undefined)}
          >
            <Text style={[styles.filterOptionText, !filter && styles.filterOptionTextActive]}>
              All Reviews
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterOption, filter?.hasReview && styles.filterOptionActive]}
            onPress={() => setFilter(RatingFilter.create({ hasReview: true }))}
          >
            <Text style={[styles.filterOptionText, filter?.hasReview && styles.filterOptionTextActive]}>
              With Comments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterOption, filter?.hasPhotos && styles.filterOptionActive]}
            onPress={() => setFilter(RatingFilter.create({ hasPhotos: true }))}
          >
            <Text style={[styles.filterOptionText, filter?.hasPhotos && styles.filterOptionTextActive]}>
              With Photos
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="star-outline" size={48} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No reviews yet</Text>
      <Text style={styles.emptyStateText}>
        Be the first to share your experience!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={ratings}
        keyExtractor={(item) => item.id}
        renderItem={renderRatingItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={ratings.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  overallRating: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  overallScore: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalRatings: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  reputationLevel: {
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  distributionContainer: {
    marginBottom: 20,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distributionScore: {
    fontSize: 12,
    color: '#6B7280',
    width: 12,
  },
  distributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  distributionFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  distributionPercent: {
    fontSize: 12,
    color: '#6B7280',
    width: 32,
    textAlign: 'right',
  },
  addRatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 20,
  },
  addRatingText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
    marginLeft: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  filterOptions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  filterOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterOptionActive: {
    backgroundColor: '#7C3AED',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  ratingItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ratingUserInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  ratingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingUserDetails: {
    flex: 1,
  },
  ratingUserName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  ratingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  flagButton: {
    padding: 8,
  },
  ratingReview: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  ratingPhotos: {
    marginBottom: 12,
  },
  ratingPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});