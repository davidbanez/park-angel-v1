import { UserId } from './value-objects';
import { RatedType, RatingStatus, ReputationLevel } from '../types/common';
export declare class Rating {
    readonly id: string;
    readonly bookingId: string;
    readonly raterId: UserId;
    readonly ratedId: UserId;
    readonly ratedType: RatedType;
    score: number;
    review?: string | undefined;
    photos: string[];
    isVerified: boolean;
    status: RatingStatus;
    readonly createdAt: Date;
    updatedAt: Date;
    verifiedAt?: Date | undefined;
    moderatedAt?: Date | undefined;
    moderationReason?: string | undefined;
    constructor(id: string, bookingId: string, raterId: UserId, ratedId: UserId, ratedType: RatedType, score: number, review?: string | undefined, photos?: string[], isVerified?: boolean, status?: RatingStatus, createdAt?: Date, updatedAt?: Date, verifiedAt?: Date | undefined, moderatedAt?: Date | undefined, moderationReason?: string | undefined);
    static create(data: CreateRatingData): Rating;
    private validateScore;
    updateScore(score: number): void;
    updateReview(review: string): void;
    addPhoto(photoUrl: string): void;
    removePhoto(photoUrl: string): void;
    verify(): void;
    unverify(): void;
    hide(reason?: string): void;
    flag(reason?: string): void;
    restore(): void;
    isPositive(): boolean;
    isNeutral(): boolean;
    isNegative(): boolean;
    isActive(): boolean;
    isHidden(): boolean;
    isFlagged(): boolean;
    hasReview(): boolean;
    hasPhotos(): boolean;
    canBeEditedBy(userId: UserId): boolean;
    getStarDisplay(): string;
    toJSON(): {
        id: string;
        bookingId: string;
        raterId: string;
        ratedId: string;
        ratedType: RatedType;
        score: number;
        review: string | undefined;
        photos: string[];
        isVerified: boolean;
        status: RatingStatus;
        createdAt: Date;
        updatedAt: Date;
        verifiedAt: Date | undefined;
        moderatedAt: Date | undefined;
        moderationReason: string | undefined;
        starDisplay: string;
        isPositive: boolean;
        isNeutral: boolean;
        isNegative: boolean;
    };
}
export declare class RatingAggregate {
    readonly ratedId: string;
    readonly ratedType: RatedType;
    totalRatings: number;
    averageScore: number;
    scoreDistribution: ScoreDistribution;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(ratedId: string, ratedType: RatedType, totalRatings?: number, averageScore?: number, scoreDistribution?: ScoreDistribution, createdAt?: Date, updatedAt?: Date);
    static create(ratedId: string, ratedType: RatedType): RatingAggregate;
    addRating(rating: Rating): void;
    removeRating(rating: Rating): void;
    updateRating(oldScore: number, newScore: number): void;
    private recalculateAverage;
    getAverageScoreRounded(): number;
    getPositiveRatingPercentage(): number;
    getNegativeRatingPercentage(): number;
    getReputationLevel(): ReputationLevel;
    toJSON(): {
        ratedId: string;
        ratedType: RatedType;
        totalRatings: number;
        averageScore: number;
        averageScoreRounded: number;
        scoreDistribution: {
            oneStar: number;
            twoStar: number;
            threeStar: number;
            fourStar: number;
            fiveStar: number;
            total: number;
            percentages: {
                oneStar: number;
                twoStar: number;
                threeStar: number;
                fourStar: number;
                fiveStar: number;
            };
        };
        positiveRatingPercentage: number;
        negativeRatingPercentage: number;
        reputationLevel: ReputationLevel;
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare class ScoreDistribution {
    oneStar: number;
    twoStar: number;
    threeStar: number;
    fourStar: number;
    fiveStar: number;
    constructor(oneStar?: number, twoStar?: number, threeStar?: number, fourStar?: number, fiveStar?: number);
    addScore(score: number): void;
    removeScore(score: number): void;
    getTotalRatings(): number;
    getPercentageForScore(score: number): number;
    toJSON(): {
        oneStar: number;
        twoStar: number;
        threeStar: number;
        fourStar: number;
        fiveStar: number;
        total: number;
        percentages: {
            oneStar: number;
            twoStar: number;
            threeStar: number;
            fourStar: number;
            fiveStar: number;
        };
    };
}
export declare class RatingFilter {
    ratedType?: RatedType | undefined;
    minScore?: number | undefined;
    maxScore?: number | undefined;
    hasReview?: boolean | undefined;
    hasPhotos?: boolean | undefined;
    isVerified?: boolean | undefined;
    status?: RatingStatus | undefined;
    dateFrom?: Date | undefined;
    dateTo?: Date | undefined;
    constructor(ratedType?: RatedType | undefined, minScore?: number | undefined, maxScore?: number | undefined, hasReview?: boolean | undefined, hasPhotos?: boolean | undefined, isVerified?: boolean | undefined, status?: RatingStatus | undefined, dateFrom?: Date | undefined, dateTo?: Date | undefined);
    static create(data: CreateRatingFilterData): RatingFilter;
    matches(rating: Rating): boolean;
    toJSON(): {
        ratedType: RatedType | undefined;
        minScore: number | undefined;
        maxScore: number | undefined;
        hasReview: boolean | undefined;
        hasPhotos: boolean | undefined;
        isVerified: boolean | undefined;
        status: RatingStatus | undefined;
        dateFrom: Date | undefined;
        dateTo: Date | undefined;
    };
}
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
