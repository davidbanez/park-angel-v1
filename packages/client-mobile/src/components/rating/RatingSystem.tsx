import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ratingService } from '@park-angel/shared/src/services/rating';
import { 
  Rating, 
  RatedType, 
  CreateRatingData 
} from '@park-angel/shared/src/models/rating';
import { UserId } from '@park-angel/shared/src/models/value-objects';
import { useAuth } from '../../hooks/useAuth';

interface RatingSystemProps {
  bookingId: string;
  ratedId: string;
  ratedType: RatedType;
  ratedName: string;
  onRatingSubmitted?: (rating: Rating) => void;
  onClose?: () => void;
}

export const RatingSystem: React.FC<RatingSystemProps> = ({
  bookingId,
  ratedId,
  ratedType,
  ratedName,
  onRatingSubmitted,
  onClose,
}) => {
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [review, setReview] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [existingRating, setExistingRating] = useState<Rating | null>(null);

  useEffect(() => {
    if (user) {
      checkCanRate();
    }
  }, [user, bookingId, ratedId, ratedType]);

  const checkCanRate = async () => {
    if (!user) return;

    try {
      const canUserRate = await ratingService.canUserRate(
        new UserId(user.id),
        bookingId,
        ratedId,
        ratedType
      );
      setCanRate(canUserRate);

      // If user can't rate, check if they have an existing rating
      if (!canUserRate) {
        // This would require a method to get existing rating by booking and user
        // For now, we'll assume they can't rate because they already have one
        Alert.alert(
          'Already Rated',
          'You have already rated this ' + ratedType.toLowerCase(),
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Error checking if user can rate:', error);
      Alert.alert('Error', 'Unable to verify rating eligibility');
    }
  };

  const submitRating = async () => {
    if (!user || !canRate || score === 0) return;

    try {
      setSubmitting(true);

      const ratingData: CreateRatingData = {
        bookingId,
        raterId: new UserId(user.id),
        ratedId: new UserId(ratedId),
        ratedType,
        score,
        review: review.trim() || undefined,
        photos,
      };

      const newRating = await ratingService.createRating(ratingData);
      
      Alert.alert(
        'Rating Submitted',
        'Thank you for your feedback!',
        [{ text: 'OK', onPress: () => {
          onRatingSubmitted?.(newRating);
          onClose?.();
        }}]
      );
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setScore(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= score ? 'star' : 'star-outline'}
              size={32}
              color={star <= score ? '#F59E0B' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getScoreDescription = () => {
    switch (score) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
  };

  const getRatedTypeDisplayName = () => {
    switch (ratedType) {
      case RatedType.SPOT:
        return 'parking spot';
      case RatedType.HOST:
        return 'host';
      case RatedType.OPERATOR:
        return 'operator';
      case RatedType.USER:
        return 'user';
      default:
        return 'experience';
    }
  };

  if (!canRate) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rating</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.message}>
            You cannot rate this {getRatedTypeDisplayName()} at this time.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Rating Target */}
        <View style={styles.ratingTarget}>
          <Text style={styles.ratingTargetTitle}>
            How was your experience with
          </Text>
          <Text style={styles.ratedName}>{ratedName}</Text>
          <Text style={styles.ratedType}>
            ({getRatedTypeDisplayName()})
          </Text>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          {renderStars()}
          <Text style={styles.scoreDescription}>
            {getScoreDescription()}
          </Text>
        </View>

        {/* Review Text */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>
            Tell us more about your experience (optional)
          </Text>
          <TextInput
            style={styles.reviewInput}
            value={review}
            onChangeText={setReview}
            placeholder="Share your thoughts..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {review.length}/500
          </Text>
        </View>

        {/* Photo Upload Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>
            Add photos (optional)
          </Text>
          <TouchableOpacity style={styles.addPhotoButton}>
            <Ionicons name="camera-outline" size={24} color="#7C3AED" />
            <Text style={styles.addPhotoText}>Add Photos</Text>
          </TouchableOpacity>
          
          {photos.length > 0 && (
            <ScrollView horizontal style={styles.photosContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (score === 0 || submitting) && styles.submitButtonDisabled
          ]}
          onPress={submitRating}
          disabled={score === 0 || submitting}
        >
          <Text style={[
            styles.submitButtonText,
            (score === 0 || submitting) && styles.submitButtonTextDisabled
          ]}>
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </Text>
        </TouchableOpacity>

        {/* Rating Guidelines */}
        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Rating Guidelines</Text>
          <Text style={styles.guidelinesText}>
            • Be honest and constructive in your feedback{'\n'}
            • Focus on your actual experience{'\n'}
            • Avoid personal attacks or inappropriate content{'\n'}
            • Your rating helps improve the service for everyone
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  ratingTarget: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  ratingTargetTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  ratedName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  ratedType: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  ratingSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  scoreDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7C3AED',
  },
  reviewSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  photoSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
  },
  addPhotoText: {
    fontSize: 16,
    color: '#7C3AED',
    marginLeft: 8,
  },
  photosContainer: {
    flexDirection: 'row',
  },
  photoItem: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  submitButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: '#9CA3AF',
  },
  guidelines: {
    paddingVertical: 16,
    marginBottom: 24,
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
});