import { UserId } from './value-objects';
export class Rating {
    constructor(id, bookingId, raterId, ratedId, ratedType, score, review, photos = [], isVerified = false, status = RatingStatus.ACTIVE, createdAt = new Date(), updatedAt = new Date(), verifiedAt, moderatedAt, moderationReason) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "bookingId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: bookingId
        });
        Object.defineProperty(this, "raterId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: raterId
        });
        Object.defineProperty(this, "ratedId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ratedId
        });
        Object.defineProperty(this, "ratedType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ratedType
        });
        Object.defineProperty(this, "score", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: score
        });
        Object.defineProperty(this, "review", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: review
        });
        Object.defineProperty(this, "photos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: photos
        });
        Object.defineProperty(this, "isVerified", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: isVerified
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: updatedAt
        });
        Object.defineProperty(this, "verifiedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: verifiedAt
        });
        Object.defineProperty(this, "moderatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: moderatedAt
        });
        Object.defineProperty(this, "moderationReason", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: moderationReason
        });
    }
    static create(data) {
        const rating = new Rating(UserId.generate().value, data.bookingId, data.raterId, data.ratedId, data.ratedType, data.score, data.review, data.photos || [], false, RatingStatus.ACTIVE, new Date(), new Date());
        rating.validateScore();
        return rating;
    }
    validateScore() {
        if (this.score < 1 || this.score > 5) {
            throw new Error('Rating score must be between 1 and 5');
        }
    }
    updateScore(score) {
        if (score < 1 || score > 5) {
            throw new Error('Rating score must be between 1 and 5');
        }
        this.score = score;
        this.updatedAt = new Date();
    }
    updateReview(review) {
        this.review = review;
        this.updatedAt = new Date();
    }
    addPhoto(photoUrl) {
        if (this.photos.length >= 5) {
            throw new Error('Maximum 5 photos allowed per rating');
        }
        this.photos.push(photoUrl);
        this.updatedAt = new Date();
    }
    removePhoto(photoUrl) {
        this.photos = this.photos.filter(photo => photo !== photoUrl);
        this.updatedAt = new Date();
    }
    verify() {
        this.isVerified = true;
        this.verifiedAt = new Date();
        this.updatedAt = new Date();
    }
    unverify() {
        this.isVerified = false;
        this.verifiedAt = undefined;
        this.updatedAt = new Date();
    }
    hide(reason) {
        this.status = RatingStatus.HIDDEN;
        this.moderatedAt = new Date();
        this.moderationReason = reason;
        this.updatedAt = new Date();
    }
    flag(reason) {
        this.status = RatingStatus.FLAGGED;
        this.moderatedAt = new Date();
        this.moderationReason = reason;
        this.updatedAt = new Date();
    }
    restore() {
        this.status = RatingStatus.ACTIVE;
        this.moderatedAt = undefined;
        this.moderationReason = undefined;
        this.updatedAt = new Date();
    }
    isPositive() {
        return this.score >= 4;
    }
    isNeutral() {
        return this.score === 3;
    }
    isNegative() {
        return this.score <= 2;
    }
    isActive() {
        return this.status === RatingStatus.ACTIVE;
    }
    isHidden() {
        return this.status === RatingStatus.HIDDEN;
    }
    isFlagged() {
        return this.status === RatingStatus.FLAGGED;
    }
    hasReview() {
        return this.review !== undefined && this.review.trim().length > 0;
    }
    hasPhotos() {
        return this.photos.length > 0;
    }
    canBeEditedBy(userId) {
        return this.raterId.equals(userId) && this.isActive();
    }
    getStarDisplay() {
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
    constructor(ratedId, ratedType, totalRatings = 0, averageScore = 0, scoreDistribution = new ScoreDistribution(), createdAt = new Date(), updatedAt = new Date()) {
        Object.defineProperty(this, "ratedId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ratedId
        });
        Object.defineProperty(this, "ratedType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ratedType
        });
        Object.defineProperty(this, "totalRatings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: totalRatings
        });
        Object.defineProperty(this, "averageScore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: averageScore
        });
        Object.defineProperty(this, "scoreDistribution", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: scoreDistribution
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: updatedAt
        });
    }
    static create(ratedId, ratedType) {
        return new RatingAggregate(ratedId, ratedType, 0, 0, new ScoreDistribution(), new Date(), new Date());
    }
    addRating(rating) {
        if (!rating.isActive()) {
            return; // Don't include inactive ratings in aggregates
        }
        this.totalRatings++;
        this.scoreDistribution.addScore(rating.score);
        this.recalculateAverage();
        this.updatedAt = new Date();
    }
    removeRating(rating) {
        if (this.totalRatings > 0) {
            this.totalRatings--;
            this.scoreDistribution.removeScore(rating.score);
            this.recalculateAverage();
            this.updatedAt = new Date();
        }
    }
    updateRating(oldScore, newScore) {
        this.scoreDistribution.removeScore(oldScore);
        this.scoreDistribution.addScore(newScore);
        this.recalculateAverage();
        this.updatedAt = new Date();
    }
    recalculateAverage() {
        if (this.totalRatings === 0) {
            this.averageScore = 0;
            return;
        }
        const totalScore = this.scoreDistribution.oneStar * 1 +
            this.scoreDistribution.twoStar * 2 +
            this.scoreDistribution.threeStar * 3 +
            this.scoreDistribution.fourStar * 4 +
            this.scoreDistribution.fiveStar * 5;
        this.averageScore = Math.round((totalScore / this.totalRatings) * 10) / 10;
    }
    getAverageScoreRounded() {
        return Math.round(this.averageScore);
    }
    getPositiveRatingPercentage() {
        if (this.totalRatings === 0)
            return 0;
        const positiveRatings = this.scoreDistribution.fourStar + this.scoreDistribution.fiveStar;
        return Math.round((positiveRatings / this.totalRatings) * 100);
    }
    getNegativeRatingPercentage() {
        if (this.totalRatings === 0)
            return 0;
        const negativeRatings = this.scoreDistribution.oneStar + this.scoreDistribution.twoStar;
        return Math.round((negativeRatings / this.totalRatings) * 100);
    }
    getReputationLevel() {
        if (this.totalRatings < 5)
            return ReputationLevel.NEW;
        if (this.averageScore >= 4.5)
            return ReputationLevel.EXCELLENT;
        if (this.averageScore >= 4.0)
            return ReputationLevel.VERY_GOOD;
        if (this.averageScore >= 3.5)
            return ReputationLevel.GOOD;
        if (this.averageScore >= 3.0)
            return ReputationLevel.AVERAGE;
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
    constructor(oneStar = 0, twoStar = 0, threeStar = 0, fourStar = 0, fiveStar = 0) {
        Object.defineProperty(this, "oneStar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: oneStar
        });
        Object.defineProperty(this, "twoStar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: twoStar
        });
        Object.defineProperty(this, "threeStar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: threeStar
        });
        Object.defineProperty(this, "fourStar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: fourStar
        });
        Object.defineProperty(this, "fiveStar", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: fiveStar
        });
    }
    addScore(score) {
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
    removeScore(score) {
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
    getTotalRatings() {
        return (this.oneStar +
            this.twoStar +
            this.threeStar +
            this.fourStar +
            this.fiveStar);
    }
    getPercentageForScore(score) {
        const total = this.getTotalRatings();
        if (total === 0)
            return 0;
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
    constructor(ratedType, minScore, maxScore, hasReview, hasPhotos, isVerified, status, dateFrom, dateTo) {
        Object.defineProperty(this, "ratedType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ratedType
        });
        Object.defineProperty(this, "minScore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: minScore
        });
        Object.defineProperty(this, "maxScore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: maxScore
        });
        Object.defineProperty(this, "hasReview", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: hasReview
        });
        Object.defineProperty(this, "hasPhotos", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: hasPhotos
        });
        Object.defineProperty(this, "isVerified", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: isVerified
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        Object.defineProperty(this, "dateFrom", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: dateFrom
        });
        Object.defineProperty(this, "dateTo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: dateTo
        });
    }
    static create(data) {
        return new RatingFilter(data.ratedType, data.minScore, data.maxScore, data.hasReview, data.hasPhotos, data.isVerified, data.status, data.dateFrom, data.dateTo);
    }
    matches(rating) {
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
        if (this.isVerified !== undefined &&
            rating.isVerified !== this.isVerified) {
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
export var RatedType;
(function (RatedType) {
    RatedType["SPOT"] = "spot";
    RatedType["HOST"] = "host";
    RatedType["OPERATOR"] = "operator";
    RatedType["USER"] = "user";
})(RatedType || (RatedType = {}));
export var RatingStatus;
(function (RatingStatus) {
    RatingStatus["ACTIVE"] = "active";
    RatingStatus["HIDDEN"] = "hidden";
    RatingStatus["FLAGGED"] = "flagged";
})(RatingStatus || (RatingStatus = {}));
export var ReputationLevel;
(function (ReputationLevel) {
    ReputationLevel["NEW"] = "new";
    ReputationLevel["POOR"] = "poor";
    ReputationLevel["AVERAGE"] = "average";
    ReputationLevel["GOOD"] = "good";
    ReputationLevel["VERY_GOOD"] = "very_good";
    ReputationLevel["EXCELLENT"] = "excellent";
})(ReputationLevel || (ReputationLevel = {}));
