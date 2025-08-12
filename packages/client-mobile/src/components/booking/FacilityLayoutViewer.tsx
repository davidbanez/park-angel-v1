import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import Svg, { Rect, Circle, Text as SvgText, Line, Path } from 'react-native-svg';
import type { ParkingSpot } from '@park-angel/shared/src/types/parking';
import { supabase } from '@park-angel/shared/src/lib/supabase';

interface FacilityLayoutViewerProps {
  visible: boolean;
  spot: ParkingSpot;
  onClose: () => void;
}

interface LayoutElement {
  id: string;
  type: 'spot' | 'entrance' | 'exit' | 'lane' | 'elevator' | 'stairs';
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  properties: Record<string, any>;
}

interface FacilityLayout {
  id: string;
  locationId: string;
  elements: LayoutElement[];
  metadata: {
    canvasWidth: number;
    canvasHeight: number;
    scale: number;
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const FacilityLayoutViewer: React.FC<FacilityLayoutViewerProps> = ({
  visible,
  spot,
  onClose,
}) => {
  const [layout, setLayout] = useState<FacilityLayout | null>(null);
  const [loading, setLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (visible && spot) {
      loadFacilityLayout();
    }
  }, [visible, spot]);

  const loadFacilityLayout = async () => {
    setLoading(true);
    try {
      // Get the location ID from the spot's hierarchy
      const { data: spotData, error: spotError } = await supabase
        .from('parking_spots')
        .select(`
          *,
          zone:zones!inner(
            *,
            section:sections!inner(
              *,
              location:locations!inner(*)
            )
          )
        `)
        .eq('id', spot.id)
        .single();

      if (spotError) throw spotError;

      const locationId = spotData.zone.section.location.id;

      // Get facility layout
      const { data: layoutData, error: layoutError } = await supabase
        .from('facility_layouts')
        .select('*')
        .eq('locationId', locationId)
        .single();

      if (layoutError) {
        // If no layout exists, show a message
        if (layoutError.code === 'PGRST116') {
          Alert.alert(
            'Layout Not Available',
            'This facility does not have a visual layout configured yet.'
          );
          onClose();
          return;
        }
        throw layoutError;
      }

      setLayout(layoutData);
    } catch (error) {
      console.error('Error loading facility layout:', error);
      Alert.alert('Error', 'Failed to load facility layout.');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const renderLayoutElement = (element: LayoutElement, index: number) => {
    const isTargetSpot = element.type === 'spot' && element.properties.spotId === spot.id;
    
    switch (element.type) {
      case 'spot':
        return (
          <Rect
            key={`${element.id}-${index}`}
            x={element.position.x}
            y={element.position.y}
            width={element.dimensions.width}
            height={element.dimensions.height}
            fill={isTargetSpot ? '#8B5CF6' : element.properties.isOccupied ? '#EF4444' : '#10B981'}
            stroke={isTargetSpot ? '#7C3AED' : '#374151'}
            strokeWidth={isTargetSpot ? 3 : 1}
            rx={4}
          />
        );

      case 'entrance':
        return (
          <React.Fragment key={`${element.id}-${index}`}>
            <Rect
              x={element.position.x}
              y={element.position.y}
              width={element.dimensions.width}
              height={element.dimensions.height}
              fill="#3B82F6"
              stroke="#1E40AF"
              strokeWidth={2}
              rx={4}
            />
            <SvgText
              x={element.position.x + element.dimensions.width / 2}
              y={element.position.y + element.dimensions.height / 2}
              fontSize="12"
              fill="white"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              IN
            </SvgText>
          </React.Fragment>
        );

      case 'exit':
        return (
          <React.Fragment key={`${element.id}-${index}`}>
            <Rect
              x={element.position.x}
              y={element.position.y}
              width={element.dimensions.width}
              height={element.dimensions.height}
              fill="#F59E0B"
              stroke="#D97706"
              strokeWidth={2}
              rx={4}
            />
            <SvgText
              x={element.position.x + element.dimensions.width / 2}
              y={element.position.y + element.dimensions.height / 2}
              fontSize="12"
              fill="white"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              OUT
            </SvgText>
          </React.Fragment>
        );

      case 'lane':
        return (
          <Rect
            key={`${element.id}-${index}`}
            x={element.position.x}
            y={element.position.y}
            width={element.dimensions.width}
            height={element.dimensions.height}
            fill="#F3F4F6"
            stroke="#D1D5DB"
            strokeWidth={1}
            strokeDasharray="5,5"
          />
        );

      case 'elevator':
        return (
          <React.Fragment key={`${element.id}-${index}`}>
            <Rect
              x={element.position.x}
              y={element.position.y}
              width={element.dimensions.width}
              height={element.dimensions.height}
              fill="#6B7280"
              stroke="#374151"
              strokeWidth={2}
              rx={4}
            />
            <SvgText
              x={element.position.x + element.dimensions.width / 2}
              y={element.position.y + element.dimensions.height / 2}
              fontSize="10"
              fill="white"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              🛗
            </SvgText>
          </React.Fragment>
        );

      case 'stairs':
        return (
          <React.Fragment key={`${element.id}-${index}`}>
            <Rect
              x={element.position.x}
              y={element.position.y}
              width={element.dimensions.width}
              height={element.dimensions.height}
              fill="#9CA3AF"
              stroke="#6B7280"
              strokeWidth={2}
              rx={4}
            />
            <SvgText
              x={element.position.x + element.dimensions.width / 2}
              y={element.position.y + element.dimensions.height / 2}
              fontSize="10"
              fill="white"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              🪜
            </SvgText>
          </React.Fragment>
        );

      default:
        return null;
    }
  };

  const renderSpotNumbers = () => {
    if (!layout) return null;

    return layout.elements
      .filter(element => element.type === 'spot')
      .map((element, index) => {
        const isTargetSpot = element.properties.spotId === spot.id;
        return (
          <SvgText
            key={`spot-number-${element.id}-${index}`}
            x={element.position.x + element.dimensions.width / 2}
            y={element.position.y + element.dimensions.height / 2}
            fontSize="10"
            fill={isTargetSpot ? 'white' : '#374151'}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontWeight={isTargetSpot ? 'bold' : 'normal'}
          >
            {element.properties.spotNumber || '?'}
          </SvgText>
        );
      });
  };

  if (!layout) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Facility Layout</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>
              {loading ? 'Loading layout...' : 'Layout not available'}
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  const svgWidth = Math.max(layout.metadata.canvasWidth * scale, screenWidth - 32);
  const svgHeight = Math.max(layout.metadata.canvasHeight * scale, 400);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Facility Layout</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.legendText}>Your Spot</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Occupied</Text>
          </View>
        </View>

        {/* Layout Viewer */}
        <ScrollView
          style={styles.layoutContainer}
          contentContainerStyle={styles.layoutContent}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          maximumZoomScale={3}
          minimumZoomScale={0.5}
          bouncesZoom={true}
        >
          <View style={styles.svgContainer}>
            <Svg
              width={svgWidth}
              height={svgHeight}
              viewBox={`0 0 ${layout.metadata.canvasWidth} ${layout.metadata.canvasHeight}`}
            >
              {/* Background */}
              <Rect
                x={0}
                y={0}
                width={layout.metadata.canvasWidth}
                height={layout.metadata.canvasHeight}
                fill="#FAFAFA"
                stroke="#E5E7EB"
                strokeWidth={1}
              />

              {/* Layout Elements */}
              {layout.elements.map((element, index) => renderLayoutElement(element, index))}

              {/* Spot Numbers */}
              {renderSpotNumbers()}
            </Svg>
          </View>
        </ScrollView>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>🅿️ Spot {spot.number}</Text>
          <Text style={styles.instructionsText}>
            Your parking spot is highlighted in purple. Use the layout to navigate to your spot once you arrive at the facility.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  layoutContainer: {
    flex: 1,
  },
  layoutContent: {
    padding: 16,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  instructions: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});