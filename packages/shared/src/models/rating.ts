import { UserId } from './value-objects';

export class Rating {
  constructor(
    public readonly id: string,
    public readonly bookingId: string,
    public readonly raterId: UserId,
    public readonly ratedId: UserId,
    public readonly ratedType: RatedType,
    public score: number,
    public review?: string,
    public photos: string[] = [],
    public isVerified: boolean = false,
    public status: RatingStatus = RatingStatus.ACTIVE,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public verifiedAt?: Date,
    public moderatedAt?: Date,
    public moderationReason?: string
  ) {}

  static create(data: CreateRatingData): Rating {
    const rating = new Rating(
      UserId.generate().value,
      data.bookingId,
      data.raterId,
      data.ratedId,
      data.ratedType,
      data.score,
      data.review,
      data.photos || [],
      false,
      RatingStatus.ACTIVE,
      new Date(),
      new Date()
    );

    rating.validateScore();
    return rating;
  }

  private validateScore(): void {
    if (this.score < 1 || this.score > 5) {
      throw new Error('Rating score must be between 1 and 5');
    }
  }

  updateScore(score: number): void {
    if (score < 1 || score > 5) {
      throw new Error('Rating score must be between 1 and 5');
    }

    this.score = score;
    this.updatedAt = new Date();
  }

  updateReview(review: string): void {
    this.review = review;
    this.updatedAt = new Date();
  }

  addPhoto(photoUrl: string): void {
    if (this.photos.length >= 5) {
      throw new Error('Maximum 5 photos allowed per rating');
    }

    this.photos.push(photoUrl);
    this.updatedAt = new Date();
  }

  removePhoto(photoUrl: string): void {
    this.photos = this.photos.filter(photo => photo !== photoUrl);
    this.updatedAt = new Date();
  }

  verify(): void {
    this.isVerified = true;
    this.verifiedAt = new Date();
    this.updatedAt = new Date();
  }

  unverify(): void {
    this.isVerified = false;
    this.verifiedAt = undefined;
    this.updatedAt = new Date();
  }

  hide(reason?: string): void {
    this.status = RatingStatus.HIDDEN;
    this.moderatedAt = new Date();
    this.moderationReason = reason;
    this.updatedAt = new Date();
  }

  flag(reason?: string): void {
    this.status = RatingStatus.FLAGGED;
    this.moderatedAt = new Date();
    this.moderationReason = reason;
    this.updatedAt = new Date();
  }

  restore(): void {
    this.status = RatingStatus.ACTIVE;
    this.moderatedAt = undefined;
    this.moderationReason = undefined;
    this.updatedAt = new Date();
  }

  isPositive(): boolean {
    return this.score >= 4;
  }

  isNeutral(): boolean {
    return this.score === 3;
  }

  isNegative(): boolean {
    return this.score <= 2;
  }

  isActive(): boolean {
    return this.status === RatingStatus.ACTIVE;
  }

  isHidden(): boolean {
    return this.status === RatingStatus.HIDDEN;
  }

  isFlagged(): boolean {
    return this.status === RatingStatus.FLAGGED;
  }

  hasReview(): boolean {
    return this.review !== undefined && this.review.trim().length > 0;
  }

  hasPhotos(): boolean {
    return this.photos.length > 0;
  }

  canBeEditedBy(userId: UserId): boolean {
    return this.raterId.equals(userId) && this.isActive();
  }

  getStarDisplay(): string {
    return '★'.repeat(this.score) + '☆'.repeat(5 - this.score);
  }

  toJSON() {
    return {
      id: this.id,
      bookingId: this.bookingId,
      raterId: this.raterId.value,
      ratedId: this.ratedId.value,
      ratedType: this.ratedType,
      score: this.score,
      review: this.review,
      photos: this.photos,
      isVerified: this.isVerified,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      verifiedAt: this.verifiedAt,
      moderatedAt: this.moderatedAt,
      moderationReason: this.moderationReason,
      starDisplay: this.getStarDisplay(),
      isPositive: this.isPositive(),
      isNeutral: this.isNeutral(),
      isNegative: this.isNegative(),
    };
  }
}

export class RatingAggregate {
  constructor(
    public readonly ratedId: string,
    public readonly ratedType: RatedType,
    public totalRatings: number = 0,
    public averageScore: number = 0,
    public scoreDistribution: ScoreDistribution = new ScoreDistribution(),
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(ratedId: string, ratedType: RatedType): RatingAggregate {
    return new RatingAggregate(
      ratedId,
      ratedType,
      0,
      0,
      new ScoreDistribution(),
      new Date(),
      new Date()
    );
  }

  addRating(rating: Rating): void {
    if (!rating.isActive()) {
      return; // Don't include inactive ratings in aggregates
    }

    this.totalRatings++;
    this.scoreDistribution.addScore(rating.score);
    this.recalculateAverage();
    this.updatedAt = new Date();
  }

  removeRating(rating: Rating): void {
    if (this.totalRatings > 0) {
      this.totalRatings--;
      this.scoreDistribution.removeScore(rating.score);
      this.recalculateAverage();
      this.updatedAt = new Date();
    }
  }

  updateRating(oldScore: number, newScore: number): void {
    this.scoreDistribution.removeScore(oldScore);
    this.scoreDistribution.addScore(newScore);
    this.recalculateAverage();
    this.updatedAt = new Date();
  }

  private recalculateAverage(): void {
    if (this.totalRatings === 0) {
      this.averageScore = 0;
      return;
    }

    const totalScore =
      this.scoreDistribution.oneStar * 1 +
      this.scoreDistribution.twoStar * 2 +
      this.scoreDistribution.threeStar * 3 +
      this.scoreDistribution.fourStar * 4 +
      this.scoreDistribution.fiveStar * 5;

    this.averageScore = Math.round((totalScore / this.totalRatings) * 10) / 10;
  }

  getAverageScoreRounded(): number {
    return Math.round(this.averageScore);
  }

  getPositiveRatingPercentage(): number {
    if (this.totalRatings === 0) return 0;

    const positiveRatings =
      this.scoreDistribution.fourStar + this.scoreDistribution.fiveStar;
    return Math.round((positiveRatings / this.totalRatings) * 100);
  }

  getNegativeRatingPercentage(): number {
    if (this.totalRatings === 0) return 0;

    const negativeRatings =
      this.scoreDistribution.oneStar + this.scoreDistribution.twoStar;
    return Math.round((negativeRatings / this.totalRatings) * 100);
  }

  getReputationLevel(): ReputationLevel {
    if (this.totalRatings < 5) return ReputationLevel.NEW;
    if (this.averageScore >= 4.5) return ReputationLevel.EXCELLENT;
    if (this.averageScore >= 4.0) return ReputationLevel.VERY_GOOD;
    if (this.averageScore >= 3.5) return ReputationLevel.GOOD;
    if (this.averageScore >= 3.0) return ReputationLevel.AVERAGE;
    return ReputationLevel.POOR;
  }

  toJSON() {
    return {
      ratedId: this.ratedId,
      ratedType: this.ratedType,
      totalRatings: this.totalRatings,
      averageScore: this.averageScore,
      averageScoreRounded: this.getAverageScoreRounded(),
      scoreDistribution: this.scoreDistribution.toJSON(),
      positiveRatingPercentage: this.getPositiveRatingPercentage(),
      negativeRatingPercentage: this.getNegativeRatingPercentage(),
      reputationLevel: this.getReputationLevel(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export class ScoreDistribution {
  constructor(
    public oneStar: number = 0,
    public twoStar: number = 0,
    public threeStar: number = 0,
    public fourStar: number = 0,
    public fiveStar: number = 0
  ) {}

  addScore(score: number): void {
    switch (score) {
      case 1:
        this.oneStar++;
        break;
      case 2:
        this.twoStar++;
        break;
      case 3:
        this.threeStar++;
        break;
      case 4:
        this.fourStar++;
        break;
      case 5:
        this.fiveStar++;
        break;
      default:
        throw new Error('Invalid score');
    }
  }

  removeScore(score: number): void {
    switch (score) {
      case 1:
        this.oneStar = Math.max(0, this.oneStar - 1);
        break;
      case 2:
        this.twoStar = Math.max(0, this.twoStar - 1);
        break;
      case 3:
        this.threeStar = Math.max(0, this.threeStar - 1);
        break;
      case 4:
        this.fourStar = Math.max(0, this.fourStar - 1);
        break;
      case 5:
        this.fiveStar = Math.max(0, this.fiveStar - 1);
        break;
      default:
        throw new Error('Invalid score');
    }
  }

  getTotalRatings(): number {
    return (
      this.oneStar +
      this.twoStar +
      this.threeStar +
      this.fourStar +
      this.fiveStar
    );
  }

  getPercentageForScore(score: number): number {
    const total = this.getTotalRatings();
    if (total === 0) return 0;

    let count = 0;
    switch (score) {
      case 1:
        count = this.oneStar;
        break;
      case 2:
        count = this.twoStar;
        break;
      case 3:
        count = this.threeStar;
        break;
      case 4:
        count = this.fourStar;
        break;
      case 5:
        count = this.fiveStar;
        break;
      default:
        return 0;
    }

    return Math.round((count / total) * 100);
  }

  toJSON() {
    return {
      oneStar: this.oneStar,
      twoStar: this.twoStar,
      threeStar: this.threeStar,
      fourStar: this.fourStar,
      fiveStar: this.fiveStar,
      total: this.getTotalRatings(),
      percentages: {
        oneStar: this.getPercentageForScore(1),
        twoStar: this.getPercentageForScore(2),
        threeStar: this.getPercentageForScore(3),
        fourStar: this.getPercentageForScore(4),
        fiveStar: this.getPercentageForScore(5),
      },
    };
  }
}

export class RatingFilter {
  constructor(
    public ratedType?: RatedType,
    public minScore?: number,
    public maxScore?: number,
    public hasReview?: boolean,
    public hasPhotos?: boolean,
    public isVerified?: boolean,
    public status?: RatingStatus,
    public dateFrom?: Date,
    public dateTo?: Date
  ) {}

  static create(data: CreateRatingFilterData): RatingFilter {
    return new RatingFilter(
      data.ratedType,
      data.minScore,
      data.maxScore,
      data.hasReview,
      data.hasPhotos,
      data.isVerified,
      data.status,
      data.dateFrom,
      data.dateTo
    );
  }

  matches(rating: Rating): boolean {
    if (this.ratedType && rating.ratedType !== this.ratedType) {
      return false;
    }

    if (this.minScore && rating.score < this.minScore) {
      return false;
    }

    if (this.maxScore && rating.score > this.maxScore) {
      return false;
    }

    if (this.hasReview !== undefined && rating.hasReview() !== this.hasReview) {
      return false;
    }

    if (this.hasPhotos !== undefined && rating.hasPhotos() !== this.hasPhotos) {
      return false;
    }

    if (
      this.isVerified !== undefined &&
      rating.isVerified !== this.isVerified
    ) {
      return false;
    }

    if (this.status && rating.status !== this.status) {
      return false;
    }

    if (this.dateFrom && rating.createdAt < this.dateFrom) {
      return false;
    }

    if (this.dateTo && rating.createdAt > this.dateTo) {
      return false;
    }

    return true;
  }

  toJSON() {
    return {
      ratedType: this.ratedType,
      minScore: this.minScore,
      maxScore: this.maxScore,
      hasReview: this.hasReview,
      hasPhotos: this.hasPhotos,
      isVerified: this.isVerified,
      status: this.status,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
    };
  }
}

// Enums
export enum RatedType {
  SPOT = 'spot',
  HOST = 'host',
  OPERATOR = 'operator',
  USER = 'user',
}

export enum RatingStatus {
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  FLAGGED = 'flagged',
}

export enum ReputationLevel {
  NEW = 'new',
  POOR = 'poor',
  AVERAGE = 'average',
  GOOD = 'good',
  VERY_GOOD = 'very_good',
  EXCELLENT = 'excellent',
}

// Data Transfer Objects
export interface CreateRatingData {
  bookingId: string;
  raterId: UserId;
  ratedId: UserId;
  ratedType: RatedType;
  score: number;
  review?: string;
  photos?: string[];
}

export interface CreateRatingFilterData {
  ratedType?: RatedType;
  minScore?: number;
  maxScore?: number;
  hasReview?: boolean;
  hasPhotos?: boolean;
  isVerified?: boolean;
  status?: RatingStatus;
  dateFrom?: Date;
  dateTo?: Date;
}
