import { supabase } from '../lib/supabase';
import { 
  Rating, 
  RatingAggregate,
  CreateRatingData,
  RatingFilter
} from '../models/rating';
import { RatedType, RatingStatus, ReputationLevel, RATING_STATUS } from '../types/common';
import { UserId } from '../models/value-objects';

export class RatingService {
  /**
   * Create a new rating
   */
  async createRating(data: CreateRatingData): Promise<Rating> {
    try {
      const rating = Rating.create(data);
      
      const { data: ratingData, error } = await supabase
        .from('ratings')
        .insert({
          id: rating.id,
          booking_id: rating.bookingId,
          rater_id: rating.raterId.value,
          rated_id: rating.ratedId.value,
          rated_type: rating.ratedType,
          score: rating.score,
          review: rating.review,
          photos: rating.photos,
          created_at: rating.createdAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create rating: ${error.message}`);
      }

      // Update rating aggregate
      await this.updateRatingAggregate(rating.ratedId.value, rating.ratedType);

      return rating;
    } catch (error) {
      console.error('Error creating rating:', error);
      throw error;
    }
  }

  /**
   * Get rating by ID
   */
  async getRating(ratingId: string): Promise<Rating | null> {
    try {
      const { data: ratingData, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('id', ratingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to get rating: ${error.message}`);
      }

      return this.mapToRating(ratingData);
    } catch (error) {
      console.error('Error getting rating:', error);
      throw error;
    }
  }

  /**
   * Get ratings for a specific entity (spot, host, operator, user)
   */
  async getRatingsForEntity(
    ratedId: string, 
    ratedType: RatedType,
    filter?: RatingFilter,
    limit: number = 20,
    offset: number = 0
  ): Promise<Rating[]> {
    try {
      let query = supabase
        .from('ratings')
        .select(`
          *,
          rater:users!ratings_rater_id_fkey(
            id,
            user_profiles(first_name, last_name, avatar_url)
          )
        `)
        .eq('rated_id', ratedId)
        .eq('rated_type', ratedType);

      // Apply filters
      if (filter) {
        if (filter.minScore) {
          query = query.gte('score', filter.minScore);
        }
        if (filter.maxScore) {
          query = query.lte('score', filter.maxScore);
        }
        if (filter.hasReview !== undefined) {
          if (filter.hasReview) {
            query = query.not('review', 'is', null);
          } else {
            query = query.is('review', null);
          }
        }
        if (filter.dateFrom) {
          query = query.gte('created_at', filter.dateFrom.toISOString());
        }
        if (filter.dateTo) {
          query = query.lte('created_at', filter.dateTo.toISOString());
        }
      }

      const { data: ratingsData, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get ratings: ${error.message}`);
      }

      return ratingsData?.map(rating => this.mapToRating(rating)) || [];
    } catch (error) {
      console.error('Error getting ratings for entity:', error);
      throw error;
    }
  }

  /**
   * Get ratings by a specific user
   */
  async getRatingsByUser(
    raterId: UserId,
    limit: number = 20,
    offset: number = 0
  ): Promise<Rating[]> {
    try {
      const { data: ratingsData, error } = await supabase
        .from('ratings')
        .select(`
          *,
          rated:users!ratings_rated_id_fkey(
            id,
            user_profiles(first_name, last_name, avatar_url)
          )
        `)
        .eq('rater_id', raterId.value)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get ratings by user: ${error.message}`);
      }

      return ratingsData?.map(rating => this.mapToRating(rating)) || [];
    } catch (error) {
      console.error('Error getting ratings by user:', error);
      throw error;
    }
  }

  /**
   * Update a rating
   */
  async updateRating(
    ratingId: string, 
    userId: UserId, 
    updates: { score?: number; review?: string; photos?: string[] }
  ): Promise<Rating> {
    try {
      // First verify the user owns the rating
      const existingRating = await this.getRating(ratingId);
      if (!existingRating) {
        throw new Error('Rating not found');
      }

      if (!existingRating.canBeEditedBy(userId)) {
        throw new Error('Unauthorized: Cannot edit this rating');
      }

      const { data: ratingData, error } = await supabase
        .from('ratings')
        .update({
          score: updates.score,
          review: updates.review,
          photos: updates.photos,
          updated_at: new Date().toISOString()
        })
        .eq('id', ratingId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update rating: ${error.message}`);
      }

      const updatedRating = this.mapToRating(ratingData);

      // Update rating aggregate if score changed
      if (updates.score && updates.score !== existingRating.score) {
        await this.updateRatingAggregate(
          existingRating.ratedId.value, 
          existingRating.ratedType
        );
      }

      return updatedRating;
    } catch (error) {
      console.error('Error updating rating:', error);
      throw error;
    }
  }

  /**
   * Flag a rating for moderation
   */
  async flagRating(ratingId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ratings')
        .update({
          status: RATING_STATUS.FLAGGED,
          moderated_at: new Date().toISOString(),
          moderation_reason: reason
        })
        .eq('id', ratingId);

      if (error) {
        throw new Error(`Failed to flag rating: ${error.message}`);
      }
    } catch (error) {
      console.error('Error flagging rating:', error);
      throw error;
    }
  }

  /**
   * Hide a rating (admin action)
   */
  async hideRating(ratingId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ratings')
        .update({
          status: RATING_STATUS.HIDDEN,
          moderated_at: new Date().toISOString(),
          moderation_reason: reason
        })
        .eq('id', ratingId);

      if (error) {
        throw new Error(`Failed to hide rating: ${error.message}`);
      }

      // Update rating aggregate to exclude hidden rating
      const rating = await this.getRating(ratingId);
      if (rating) {
        await this.updateRatingAggregate(rating.ratedId.value, rating.ratedType);
      }
    } catch (error) {
      console.error('Error hiding rating:', error);
      throw error;
    }
  }

  /**
   * Restore a hidden/flagged rating
   */
  async restoreRating(ratingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ratings')
        .update({
          status: RATING_STATUS.ACTIVE,
          moderated_at: null,
          moderation_reason: null
        })
        .eq('id', ratingId);

      if (error) {
        throw new Error(`Failed to restore rating: ${error.message}`);
      }

      // Update rating aggregate to include restored rating
      const rating = await this.getRating(ratingId);
      if (rating) {
        await this.updateRatingAggregate(rating.ratedId.value, rating.ratedType);
      }
    } catch (error) {
      console.error('Error restoring rating:', error);
      throw error;
    }
  }

  /**
   * Get rating aggregate for an entity
   */
  async getRatingAggregate(ratedId: string, ratedType: RatedType): Promise<RatingAggregate> {
    try {
      const { data: aggregateData, error } = await supabase
        .from('rating_aggregates')
        .select('*')
        .eq('rated_id', ratedId)
        .eq('rated_type', ratedType)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No aggregate exists, create one
          return await this.createRatingAggregate(ratedId, ratedType);
        }
        throw new Error(`Failed to get rating aggregate: ${error.message}`);
      }

      return this.mapToRatingAggregate(aggregateData);
    } catch (error) {
      console.error('Error getting rating aggregate:', error);
      throw error;
    }
  }

  /**
   * Get top rated entities by type
   */
  async getTopRated(
    ratedType: RatedType,
    limit: number = 10,
    minRatings: number = 5
  ): Promise<RatingAggregate[]> {
    try {
      const { data: aggregatesData, error } = await supabase
        .from('rating_aggregates')
        .select('*')
        .eq('rated_type', ratedType)
        .gte('total_ratings', minRatings)
        .order('average_score', { ascending: false })
        .order('total_ratings', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to get top rated: ${error.message}`);
      }

      return aggregatesData?.map(agg => this.mapToRatingAggregate(agg)) || [];
    } catch (error) {
      console.error('Error getting top rated:', error);
      throw error;
    }
  }

  /**
   * Check if user can rate an entity (based on booking)
   */
  async canUserRate(
    userId: UserId, 
    bookingId: string, 
    ratedId: string, 
    ratedType: RatedType
  ): Promise<boolean> {
    try {
      // Check if booking exists and is completed
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('status, user_id')
        .eq('id', bookingId)
        .eq('user_id', userId.value)
        .eq('status', 'completed')
        .single();

      if (bookingError || !booking) {
        return false;
      }

      // Check if user has already rated this entity for this booking
      const { data: existingRating, error: ratingError } = await supabase
        .from('ratings')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('rater_id', userId.value)
        .eq('rated_id', ratedId)
        .single();

      if (ratingError && ratingError.code !== 'PGRST116') {
        throw new Error(`Failed to check existing rating: ${ratingError.message}`);
      }

      return !existingRating; // Can rate if no existing rating
    } catch (error) {
      console.error('Error checking if user can rate:', error);
      return false;
    }
  }

  /**
   * Get mutual ratings between two users (for host-guest relationships)
   */
  async getMutualRatings(userId1: UserId, userId2: UserId): Promise<{
    user1RatingUser2?: Rating;
    user2RatingUser1?: Rating;
  }> {
    try {
      const { data: ratingsData, error } = await supabase
        .from('ratings')
        .select('*')
        .or(`and(rater_id.eq.${userId1.value},rated_id.eq.${userId2.value}),and(rater_id.eq.${userId2.value},rated_id.eq.${userId1.value})`);

      if (error) {
        throw new Error(`Failed to get mutual ratings: ${error.message}`);
      }

      const ratings = ratingsData?.map(rating => this.mapToRating(rating)) || [];
      
      const user1RatingUser2 = ratings.find(r => 
        r.raterId.equals(userId1) && r.ratedId.equals(userId2)
      );
      
      const user2RatingUser1 = ratings.find(r => 
        r.raterId.equals(userId2) && r.ratedId.equals(userId1)
      );

      return {
        user1RatingUser2,
        user2RatingUser1
      };
    } catch (error) {
      console.error('Error getting mutual ratings:', error);
      throw error;
    }
  }

  /**
   * Get rating statistics for reporting
   */
  async getRatingStatistics(
    ratedType?: RatedType,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{
    totalRatings: number;
    averageScore: number;
    scoreDistribution: { [score: number]: number };
    ratingsByType: { [type: string]: number };
  }> {
    try {
      let query = supabase
        .from('ratings')
        .select('score, rated_type');

      if (ratedType) {
        query = query.eq('rated_type', ratedType);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom.toISOString());
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo.toISOString());
      }

      const { data: ratingsData, error } = await query;

      if (error) {
        throw new Error(`Failed to get rating statistics: ${error.message}`);
      }

      const ratings = ratingsData || [];
      const totalRatings = ratings.length;
      const averageScore = totalRatings > 0 
        ? ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings 
        : 0;

      const scoreDistribution: { [score: number]: number } = {};
      const ratingsByType: { [type: string]: number } = {};

      ratings.forEach(rating => {
        // Score distribution
        scoreDistribution[rating.score] = (scoreDistribution[rating.score] || 0) + 1;
        
        // Ratings by type
        ratingsByType[rating.rated_type] = (ratingsByType[rating.rated_type] || 0) + 1;
      });

      return {
        totalRatings,
        averageScore: Math.round(averageScore * 10) / 10,
        scoreDistribution,
        ratingsByType
      };
    } catch (error) {
      console.error('Error getting rating statistics:', error);
      throw error;
    }
  }

  /**
   * Create rating aggregate for an entity
   */
  private async createRatingAggregate(ratedId: string, ratedType: RatedType): Promise<RatingAggregate> {
    try {
      const aggregate = RatingAggregate.create(ratedId, ratedType);
      
      const { data: aggregateData, error } = await supabase
        .from('rating_aggregates')
        .insert({
          average_score: aggregate.averageScore as unknown as any,
          score_distribution: aggregate.scoreDistribution.toJSON() as any,
          created_at: aggregate.createdAt,
          updated_at: aggregate.updatedAt
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create rating aggregate: ${error.message}`);
      }

      return aggregate;
    } catch (error) {
      console.error('Error creating rating aggregate:', error);
      throw error;
    }
  }

  /**
   * Update rating aggregate for an entity
   */
  private async updateRatingAggregate(ratedId: string, ratedType: RatedType): Promise<void> {
    try {
      // Get all active ratings for this entity
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select('score')
        .eq('rated_id', ratedId)
        .eq('rated_type', ratedType)
        .eq('status', RATING_STATUS.ACTIVE);

      if (ratingsError) {
        throw new Error(`Failed to get ratings for aggregate: ${ratingsError.message}`);
      }

      const ratings = ratingsData || [];
      const aggregate = RatingAggregate.create(ratedId, ratedType);

      // Recalculate aggregate
      ratings.forEach(rating => {
        const ratingObj = new Rating(
          '', '', new UserId(''), new UserId(''), ratedType, rating.score
        );
        aggregate.addRating(ratingObj);
      });

      // Update or insert aggregate
      const { error } = await supabase
        .from('rating_aggregates')
        .upsert({
          rated_id: aggregate.ratedId,
          rated_type: aggregate.ratedType,
          total_ratings: aggregate.totalRatings,
          average_score: aggregate.averageScore,
          score_distribution: aggregate.scoreDistribution.toJSON(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to update rating aggregate: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating rating aggregate:', error);
      throw error;
    }
  }

  /**
   * Map database row to Rating model
   */
  private mapToRating(data: any): Rating {
    return new Rating(
      data.id,
      data.booking_id,
      new UserId(data.rater_id),
      new UserId(data.rated_id),
      data.rated_type as RatedType,
      data.score,
      data.review,
      data.photos || [],
      data.is_verified || false,
      (data.status as RatingStatus) || RATING_STATUS.ACTIVE,
      new Date(data.created_at),
      new Date(data.updated_at || data.created_at),
      data.verified_at ? new Date(data.verified_at) : undefined,
      data.moderated_at ? new Date(data.moderated_at) : undefined,
      data.moderation_reason
    );
  }

  /**
   * Map database row to RatingAggregate model
   */
  private mapToRatingAggregate(data: any): RatingAggregate {
    const aggregate = new RatingAggregate(
      data.rated_id,
      data.rated_type as RatedType,
      data.total_ratings,
      data.average_score,
      undefined,
      new Date(data.created_at),
      new Date(data.updated_at)
    );

    // Restore score distribution from JSON
    if (data.score_distribution) {
      const dist = data.score_distribution;
      aggregate.scoreDistribution.oneStar = dist.oneStar || 0;
      aggregate.scoreDistribution.twoStar = dist.twoStar || 0;
      aggregate.scoreDistribution.threeStar = dist.threeStar || 0;
      aggregate.scoreDistribution.fourStar = dist.fourStar || 0;
      aggregate.scoreDistribution.fiveStar = dist.fiveStar || 0;
    }

    return aggregate;
  }
}

export const ratingService = new RatingService();