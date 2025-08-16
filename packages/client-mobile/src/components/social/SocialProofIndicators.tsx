import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@park-angel/shared/src/config/supabase';

interface SocialProofData {
  id: string;
  entity_id: string;
  entity_type: string;
  proof_type: string;
  proof_data: any;
  is_active: boolean;
  expires_at?: string;
}

interface ReputationScore {
  user_id: string;
  user_type: string;
  total_ratings: number;
  average_score: number;
  reputation_level: string;
  trust_score: number;
  verification_badges: string[];
}

interface SocialProofIndicatorsProps {
  entityId: string;
  entityType: 'spot' | 'host' | 'operator' | 'location';
  userId?: string;
  showTrustScore?: boolean;
}

export const SocialProofIndicators: React.FC<SocialProofIndicatorsProps> = ({
  entityId,
  entityType,
  userId,
  showTrustScore = false,
}) => {
  const [socialProofs, setSocialProofs] = useState<SocialProofData[]>([]);
  const [reputationScore, setReputationScore] = useState<ReputationScore | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSocialProof();
    if (userId && showTrustScore) {
      loadReputationScore();
    }
  }, [entityId, entityType, userId]);

  const loadSocialProof = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('social_proof')
        .select('*')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) {
        console.error('Error loading social proof:', error);
        return;
      }

      setSocialProofs(data || []);
    } catch (error) {
      console.error('Error loading social proof:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReputationScore = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('reputation_scores')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading reputation score:', error);
        return;
      }

      setReputationScore(data);
    } catch (error) {
      console.error('Error loading reputation score:', error);
    }
  };

  const getProofIcon = (proofType: string) => {
    switch (proofType) {
      case 'popular':
        return 'trending-up';
      case 'trending':
        return 'flame';
      case 'verified':
        return 'checkmark-circle';
      case 'featured':
        return 'star';
      case 'top_rated':
        return 'trophy';
      default:
        return 'information-circle';
    }
  };

  const getProofColor = (proofType: string) => {
    switch (proofType) {
      case 'popular':
        return '#10B981';
      case 'trending':
        return '#F59E0B';
      case 'verified':
        return '#3B82F6';
      case 'featured':
        return '#8B5CF6';
      case 'top_rated':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getProofLabel = (proofType: string, proofData: any) => {
    switch (proofType) {
      case 'popular':
        return 'Popular Choice';
      case 'trending':
        return 'Trending Now';
      case 'verified':
        return 'Verified';
      case 'featured':
        return 'Featured';
      case 'top_rated':
        return 'Top Rated';
      default:
        return proofType;
    }
  };

  const getReputationColor = (level: string) => {
    switch (level) {
      case 'excellent':
        return '#10B981';
      case 'very_good':
        return '#3B82F6';
      case 'good':
        return '#8B5CF6';
      case 'average':
        return '#F59E0B';
      case 'poor':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getReputationIcon = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'star';
      case 'very_good':
        return 'thumbs-up';
      case 'good':
        return 'checkmark-circle';
      case 'average':
        return 'remove-circle';
      case 'poor':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#3B82F6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const renderVerificationBadges = () => {
    if (!reputationScore?.verification_badges?.length) return null;

    return (
      <View style={styles.verificationBadges}>
        {reputationScore.verification_badges.map((badge, index) => (
          <View key={index} style={styles.verificationBadge}>
            <Ionicons
              name={getVerificationIcon(badge)}
              size={12}
              color="#10B981"
            />
            <Text style={styles.verificationBadgeText}>
              {getVerificationLabel(badge)}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const getVerificationIcon = (badge: string) => {
    switch (badge) {
      case 'verified_email':
        return 'mail';
      case 'verified_phone':
        return 'call';
      case 'verified_id':
        return 'card';
      case 'verified_address':
        return 'location';
      default:
        return 'checkmark';
    }
  };

  const getVerificationLabel = (badge: string) => {
    switch (badge) {
      case 'verified_email':
        return 'Email';
      case 'verified_phone':
        return 'Phone';
      case 'verified_id':
        return 'ID';
      case 'verified_address':
        return 'Address';
      default:
        return badge;
    }
  };

  if (socialProofs.length === 0 && !reputationScore) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Social Proof Indicators */}
      {socialProofs.length > 0 && (
        <View style={styles.socialProofContainer}>
          {socialProofs.map((proof) => (
            <View
              key={proof.id}
              style={[
                styles.proofBadge,
                { borderColor: getProofColor(proof.proof_type) }
              ]}
            >
              <Ionicons
                name={getProofIcon(proof.proof_type) as any}
                size={14}
                color={getProofColor(proof.proof_type)}
              />
              <Text
                style={[
                  styles.proofText,
                  { color: getProofColor(proof.proof_type) }
                ]}
              >
                {getProofLabel(proof.proof_type, proof.proof_data)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Reputation Score and Trust Indicators */}
      {reputationScore && showTrustScore && (
        <View style={styles.reputationContainer}>
          {/* Reputation Level */}
          <View style={styles.reputationBadge}>
            <Ionicons
              name={getReputationIcon(reputationScore.reputation_level) as any}
              size={16}
              color={getReputationColor(reputationScore.reputation_level)}
            />
            <Text
              style={[
                styles.reputationText,
                { color: getReputationColor(reputationScore.reputation_level) }
              ]}
            >
              {reputationScore.reputation_level.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          {/* Trust Score */}
          <View style={styles.trustScoreContainer}>
            <Text style={styles.trustScoreLabel}>Trust Score</Text>
            <View style={styles.trustScoreBar}>
              <View
                style={[
                  styles.trustScoreFill,
                  {
                    width: `${reputationScore.trust_score}%`,
                    backgroundColor: getTrustScoreColor(reputationScore.trust_score)
                  }
                ]}
              />
            </View>
            <Text
              style={[
                styles.trustScoreValue,
                { color: getTrustScoreColor(reputationScore.trust_score) }
              ]}
            >
              {reputationScore.trust_score}%
            </Text>
          </View>

          {/* Rating Summary */}
          {reputationScore.total_ratings > 0 && (
            <View style={styles.ratingSummary}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingSummaryText}>
                {reputationScore.average_score.toFixed(1)} ({reputationScore.total_ratings} reviews)
              </Text>
            </View>
          )}

          {/* Verification Badges */}
          {renderVerificationBadges()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  socialProofContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  proofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  proofText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  reputationContainer: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reputationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reputationText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  trustScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trustScoreLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
    minWidth: 60,
  },
  trustScoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginRight: 8,
  },
  trustScoreFill: {
    height: '100%',
    borderRadius: 3,
  },
  trustScoreValue: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 32,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingSummaryText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  verificationBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  verificationBadgeText: {
    fontSize: 10,
    color: '#10B981',
    marginLeft: 2,
  },
});