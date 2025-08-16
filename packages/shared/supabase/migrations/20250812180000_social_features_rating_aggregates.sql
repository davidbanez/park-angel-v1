-- Social Features: Rating Aggregates and Enhanced Messaging
-- This migration adds rating aggregates table and enhances messaging features

-- Create rating aggregates table for performance optimization
CREATE TABLE rating_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rated_id UUID NOT NULL,
  rated_type rated_type NOT NULL,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  average_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  score_distribution JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rated_id, rated_type)
);

-- Add status and moderation fields to ratings table
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged'));
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS moderation_reason TEXT;

-- Add message status and additional fields to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'deleted'));
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add metadata field to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create message threads table for threaded conversations
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  parent_message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create message attachments table
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reputation scores table for trust indicators
CREATE TABLE reputation_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  total_ratings INTEGER NOT NULL DEFAULT 0,
  average_score DECIMAL(3,2) NOT NULL DEFAULT 0.0,
  reputation_level TEXT NOT NULL DEFAULT 'new' CHECK (reputation_level IN ('new', 'poor', 'average', 'good', 'very_good', 'excellent')),
  trust_score INTEGER NOT NULL DEFAULT 0, -- 0-100 trust score
  verification_badges TEXT[] DEFAULT '{}', -- ['verified_email', 'verified_phone', 'verified_id', etc.]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, user_type)
);

-- Create social proof indicators table
CREATE TABLE social_proof (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_id UUID NOT NULL, -- Can reference spots, hosts, operators
  entity_type TEXT NOT NULL CHECK (entity_type IN ('spot', 'host', 'operator', 'location')),
  proof_type TEXT NOT NULL CHECK (proof_type IN ('popular', 'trending', 'verified', 'featured', 'top_rated')),
  proof_data JSONB NOT NULL DEFAULT '{}', -- Additional data for the proof
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create review moderation queue table
CREATE TABLE review_moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  report_reason TEXT NOT NULL,
  report_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  moderator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_rating_aggregates_rated ON rating_aggregates(rated_id, rated_type);
CREATE INDEX idx_rating_aggregates_score ON rating_aggregates(average_score DESC, total_ratings DESC);

CREATE INDEX idx_ratings_status ON ratings(status);
CREATE INDEX idx_ratings_verified ON ratings(is_verified);
CREATE INDEX idx_ratings_moderated ON ratings(moderated_at);

CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_edited ON messages(edited_at);
CREATE INDEX idx_messages_attachments ON messages USING GIN(attachments);

CREATE INDEX idx_message_threads_conversation ON message_threads(conversation_id);
CREATE INDEX idx_message_threads_parent ON message_threads(parent_message_id);

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_type ON message_attachments(file_type);

CREATE INDEX idx_reputation_scores_user ON reputation_scores(user_id, user_type);
CREATE INDEX idx_reputation_scores_level ON reputation_scores(reputation_level, average_score DESC);
CREATE INDEX idx_reputation_scores_trust ON reputation_scores(trust_score DESC);

CREATE INDEX idx_social_proof_entity ON social_proof(entity_id, entity_type);
CREATE INDEX idx_social_proof_type ON social_proof(proof_type, is_active);
CREATE INDEX idx_social_proof_expires ON social_proof(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_review_moderation_status ON review_moderation_queue(status, created_at);
CREATE INDEX idx_review_moderation_rating ON review_moderation_queue(rating_id);

-- Add updated_at triggers
CREATE TRIGGER update_rating_aggregates_updated_at 
  BEFORE UPDATE ON rating_aggregates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at 
  BEFORE UPDATE ON ratings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at 
  BEFORE UPDATE ON message_threads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reputation_scores_updated_at 
  BEFORE UPDATE ON reputation_scores 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_proof_updated_at 
  BEFORE UPDATE ON social_proof 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_moderation_queue_updated_at 
  BEFORE UPDATE ON review_moderation_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update rating aggregates
CREATE OR REPLACE FUNCTION update_rating_aggregate()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO rating_aggregates (rated_id, rated_type, total_ratings, average_score, score_distribution)
    VALUES (NEW.rated_id, NEW.rated_type, 1, NEW.score, 
            jsonb_build_object(
              'oneStar', CASE WHEN NEW.score = 1 THEN 1 ELSE 0 END,
              'twoStar', CASE WHEN NEW.score = 2 THEN 1 ELSE 0 END,
              'threeStar', CASE WHEN NEW.score = 3 THEN 1 ELSE 0 END,
              'fourStar', CASE WHEN NEW.score = 4 THEN 1 ELSE 0 END,
              'fiveStar', CASE WHEN NEW.score = 5 THEN 1 ELSE 0 END
            ))
    ON CONFLICT (rated_id, rated_type) DO UPDATE SET
      total_ratings = rating_aggregates.total_ratings + 1,
      average_score = (rating_aggregates.average_score * rating_aggregates.total_ratings + NEW.score) / (rating_aggregates.total_ratings + 1),
      score_distribution = jsonb_build_object(
        'oneStar', COALESCE((rating_aggregates.score_distribution->>'oneStar')::int, 0) + CASE WHEN NEW.score = 1 THEN 1 ELSE 0 END,
        'twoStar', COALESCE((rating_aggregates.score_distribution->>'twoStar')::int, 0) + CASE WHEN NEW.score = 2 THEN 1 ELSE 0 END,
        'threeStar', COALESCE((rating_aggregates.score_distribution->>'threeStar')::int, 0) + CASE WHEN NEW.score = 3 THEN 1 ELSE 0 END,
        'fourStar', COALESCE((rating_aggregates.score_distribution->>'fourStar')::int, 0) + CASE WHEN NEW.score = 4 THEN 1 ELSE 0 END,
        'fiveStar', COALESCE((rating_aggregates.score_distribution->>'fiveStar')::int, 0) + CASE WHEN NEW.score = 5 THEN 1 ELSE 0 END
      ),
      updated_at = NOW();
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Only update if score changed or status changed
    IF OLD.score != NEW.score OR OLD.status != NEW.status THEN
      -- Recalculate aggregate (simplified approach)
      WITH rating_stats AS (
        SELECT 
          COUNT(*) as total,
          AVG(score) as avg_score,
          COUNT(CASE WHEN score = 1 THEN 1 END) as one_star,
          COUNT(CASE WHEN score = 2 THEN 1 END) as two_star,
          COUNT(CASE WHEN score = 3 THEN 1 END) as three_star,
          COUNT(CASE WHEN score = 4 THEN 1 END) as four_star,
          COUNT(CASE WHEN score = 5 THEN 1 END) as five_star
        FROM ratings 
        WHERE rated_id = NEW.rated_id 
          AND rated_type = NEW.rated_type 
          AND status = 'active'
      )
      UPDATE rating_aggregates SET
        total_ratings = rating_stats.total,
        average_score = COALESCE(rating_stats.avg_score, 0),
        score_distribution = jsonb_build_object(
          'oneStar', rating_stats.one_star,
          'twoStar', rating_stats.two_star,
          'threeStar', rating_stats.three_star,
          'fourStar', rating_stats.four_star,
          'fiveStar', rating_stats.five_star
        ),
        updated_at = NOW()
      FROM rating_stats
      WHERE rated_id = NEW.rated_id AND rated_type = NEW.rated_type;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Recalculate aggregate
    WITH rating_stats AS (
      SELECT 
        COUNT(*) as total,
        AVG(score) as avg_score,
        COUNT(CASE WHEN score = 1 THEN 1 END) as one_star,
        COUNT(CASE WHEN score = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN score = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN score = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN score = 5 THEN 1 END) as five_star
      FROM ratings 
      WHERE rated_id = OLD.rated_id 
        AND rated_type = OLD.rated_type 
        AND status = 'active'
    )
    UPDATE rating_aggregates SET
      total_ratings = rating_stats.total,
      average_score = COALESCE(rating_stats.avg_score, 0),
      score_distribution = jsonb_build_object(
        'oneStar', rating_stats.one_star,
        'twoStar', rating_stats.two_star,
        'threeStar', rating_stats.three_star,
        'fourStar', rating_stats.four_star,
        'fiveStar', rating_stats.five_star
      ),
      updated_at = NOW()
    FROM rating_stats
    WHERE rated_id = OLD.rated_id AND rated_type = OLD.rated_type;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic rating aggregate updates
CREATE TRIGGER rating_aggregate_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_rating_aggregate();

-- Create function to update reputation scores
CREATE OR REPLACE FUNCTION update_reputation_score()
RETURNS TRIGGER AS $$
DECLARE
  user_rating_data RECORD;
  reputation_level TEXT;
  trust_score INTEGER;
BEGIN
  -- Only process user ratings
  IF COALESCE(NEW.rated_type, OLD.rated_type) != 'user' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Get rating statistics for the user
  SELECT 
    COUNT(*) as total_ratings,
    AVG(score) as average_score
  INTO user_rating_data
  FROM ratings 
  WHERE rated_id = COALESCE(NEW.rated_id, OLD.rated_id)
    AND rated_type = 'user'
    AND status = 'active';

  -- Calculate reputation level
  IF user_rating_data.total_ratings < 5 THEN
    reputation_level := 'new';
  ELSIF user_rating_data.average_score >= 4.5 THEN
    reputation_level := 'excellent';
  ELSIF user_rating_data.average_score >= 4.0 THEN
    reputation_level := 'very_good';
  ELSIF user_rating_data.average_score >= 3.5 THEN
    reputation_level := 'good';
  ELSIF user_rating_data.average_score >= 3.0 THEN
    reputation_level := 'average';
  ELSE
    reputation_level := 'poor';
  END IF;

  -- Calculate trust score (0-100)
  trust_score := LEAST(100, GREATEST(0, 
    (user_rating_data.average_score * 20) + 
    (LEAST(user_rating_data.total_ratings, 10) * 2)
  ));

  -- Update or insert reputation score
  INSERT INTO reputation_scores (
    user_id, 
    user_type, 
    total_ratings, 
    average_score, 
    reputation_level, 
    trust_score
  )
  VALUES (
    COALESCE(NEW.rated_id, OLD.rated_id),
    'client',
    user_rating_data.total_ratings,
    COALESCE(user_rating_data.average_score, 0),
    reputation_level,
    trust_score
  )
  ON CONFLICT (user_id, user_type) DO UPDATE SET
    total_ratings = user_rating_data.total_ratings,
    average_score = COALESCE(user_rating_data.average_score, 0),
    reputation_level = reputation_level,
    trust_score = trust_score,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic reputation score updates
CREATE TRIGGER reputation_score_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW 
  EXECUTE FUNCTION update_reputation_score();

-- Insert some initial social proof data for demonstration
INSERT INTO social_proof (entity_type, entity_id, proof_type, proof_data) 
SELECT 
  'location',
  id,
  'popular',
  jsonb_build_object('reason', 'High booking volume', 'metric', 'bookings_per_week')
FROM locations 
LIMIT 3;

-- Create RLS policies for new tables
ALTER TABLE rating_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_proof ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_moderation_queue ENABLE ROW LEVEL SECURITY;

-- Rating aggregates are publicly readable
CREATE POLICY "Rating aggregates are publicly readable" ON rating_aggregates
  FOR SELECT USING (true);

-- Only admins can modify rating aggregates directly
CREATE POLICY "Only admins can modify rating aggregates" ON rating_aggregates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

-- Message threads follow conversation permissions
CREATE POLICY "Users can view message threads in their conversations" ON message_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = message_threads.conversation_id
      AND auth.uid() = ANY(conversations.participants)
    )
  );

CREATE POLICY "Users can create message threads in their conversations" ON message_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id
      AND auth.uid() = ANY(conversations.participants)
    )
  );

-- Message attachments follow message permissions
CREATE POLICY "Users can view attachments for their messages" ON message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages 
      JOIN conversations ON conversations.id = messages.conversation_id
      WHERE messages.id = message_attachments.message_id
      AND auth.uid() = ANY(conversations.participants)
    )
  );

CREATE POLICY "Users can add attachments to their messages" ON message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages 
      WHERE messages.id = message_id
      AND messages.sender_id = auth.uid()
    )
  );

-- Reputation scores are publicly readable
CREATE POLICY "Reputation scores are publicly readable" ON reputation_scores
  FOR SELECT USING (true);

-- Only system can update reputation scores
CREATE POLICY "Only system can update reputation scores" ON reputation_scores
  FOR ALL USING (false);

-- Social proof is publicly readable
CREATE POLICY "Social proof is publicly readable" ON social_proof
  FOR SELECT USING (is_active = true);

-- Only admins can manage social proof
CREATE POLICY "Only admins can manage social proof" ON social_proof
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

-- Review moderation queue policies
CREATE POLICY "Users can report ratings" ON review_moderation_queue
  FOR INSERT WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Users can view their own reports" ON review_moderation_queue
  FOR SELECT USING (reported_by = auth.uid());

CREATE POLICY "Admins can manage moderation queue" ON review_moderation_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );