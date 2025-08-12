import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { SpotAvailability } from '../../services/parkingService';

interface AvailabilityCalendarProps {
  availability: SpotAvailability[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  availability,
  selectedDate,
  onDateSelect,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availability.find(a => a.date === dateStr);
  };

  const getAvailabilityStatus = (date: Date) => {
    const dayAvailability = getAvailabilityForDate(date);
    if (!dayAvailability) return 'unknown';

    const availableSlots = dayAvailability.timeSlots.filter(slot => slot.isAvailable);
    const totalSlots = dayAvailability.timeSlots.length;

    if (availableSlots.length === 0) return 'unavailable';
    if (availableSlots.length === totalSlots) return 'available';
    return 'partial';
  };

  const getDateStyle = (date: Date | null) => {
    if (!date) return styles.emptyDay;

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isPast = date < today;
    const status = getAvailabilityStatus(date);

    return [
      styles.dayButton,
      isToday && styles.todayButton,
      isSelected && styles.selectedButton,
      isPast && styles.pastButton,
      status === 'available' && styles.availableButton,
      status === 'partial' && styles.partialButton,
      status === 'unavailable' && styles.unavailableButton,
    ];
  };

  const getDateTextStyle = (date: Date | null) => {
    if (!date) return styles.emptyDayText;

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isPast = date < today;

    return [
      styles.dayText,
      isToday && styles.todayText,
      isSelected && styles.selectedText,
      isPast && styles.pastText,
    ];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedDayAvailability = getAvailabilityForDate(selectedDate);

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={() => navigateMonth('prev')}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{formatMonth(currentMonth)}</Text>
        <TouchableOpacity
          onPress={() => navigateMonth('next')}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Week Days Header */}
      <View style={styles.weekHeader}>
        {weekDays.map(day => (
          <Text key={day} style={styles.weekDayText}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {days.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={getDateStyle(date)}
            onPress={() => date && onDateSelect(date)}
            disabled={!date || date < new Date()}
          >
            <Text style={getDateTextStyle(date)}>
              {date ? date.getDate() : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.availableButton]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.partialButton]} />
          <Text style={styles.legendText}>Partially Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, styles.unavailableButton]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>

      {/* Time Slots for Selected Date */}
      {selectedDayAvailability && (
        <View style={styles.timeSlots}>
          <Text style={styles.timeSlotsTitle}>
            Available Times - {selectedDate.toLocaleDateString()}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.timeSlotsContainer}>
              {selectedDayAvailability.timeSlots
                .filter(slot => slot.isAvailable)
                .slice(0, 12) // Show first 12 available slots
                .map((slot, index) => {
                  const startTime = new Date(slot.startTime);
                  const timeStr = startTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    hour12: true,
                  });
                  
                  return (
                    <View key={index} style={styles.timeSlot}>
                      <Text style={styles.timeSlotTime}>{timeStr}</Text>
                      <Text style={styles.timeSlotPrice}>₱{slot.price}</Text>
                    </View>
                  );
                })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginVertical: 2,
  },
  emptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  todayButton: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  selectedButton: {
    backgroundColor: '#8B5CF6',
  },
  pastButton: {
    opacity: 0.3,
  },
  availableButton: {
    backgroundColor: '#D1FAE5',
  },
  partialButton: {
    backgroundColor: '#FEF3C7',
  },
  unavailableButton: {
    backgroundColor: '#FEE2E2',
  },
  dayText: {
    fontSize: 14,
    color: '#111827',
  },
  emptyDayText: {
    fontSize: 14,
    color: 'transparent',
  },
  todayText: {
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  selectedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pastText: {
    color: '#9CA3AF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#6B7280',
  },
  timeSlots: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  timeSlotsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  timeSlotTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  timeSlotPrice: {
    fontSize: 10,
    color: '#8B5CF6',
    marginTop: 2,
  },
});