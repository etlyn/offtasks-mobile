import * as React from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { palette } from '@/theme/colors';

interface PrioritySliderProps {
  value: number; // 0-3 (None, Low, Medium, High)
  onChange: (value: number) => void;
  disabled?: boolean;
}

const PRIORITY_LABELS = ['None', 'Low', 'Medium', 'High'];
const PRIORITY_COLORS = [
  { track: '#e2e8f0', thumb: '#94a3b8' },
  { track: '#cfe2f3', thumb: '#0891b2' },
  { track: '#ddd6fe', thumb: '#6366f1' },
  { track: '#fed7aa', thumb: '#f97316' },
];

export const PrioritySlider: React.FC<PrioritySliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const trackWidth = React.useRef(0);
  const [trackLayout, setTrackLayout] = React.useState({ width: 0, x: 0 });

  const handleLayout = (event: any) => {
    const { width, x } = event.nativeEvent.layout;
    trackWidth.current = width;
    setTrackLayout({ width, x });
  };

  const handlePress = (index: number) => {
    if (!disabled) {
      onChange(index);
    }
  };

  const handleTrackPress = (event: any) => {
    if (disabled || trackLayout.width === 0) return;
    
    const { locationX } = event.nativeEvent;
    const segmentWidth = trackLayout.width / 4;
    const index = Math.min(3, Math.max(0, Math.floor(locationX / segmentWidth)));
    onChange(index);
  };

  const thumbPosition = React.useMemo(() => {
    if (trackLayout.width === 0) return 0;
    const segmentWidth = trackLayout.width / 4;
    return (value * segmentWidth) + (segmentWidth / 2) - 16; // Center thumb in segment, minus half thumb width
  }, [value, trackLayout.width]);

  return (
    <View style={styles.container}>
      <View style={styles.trackContainer}>
        <Pressable
          onLayout={handleLayout}
          onPress={handleTrackPress}
          style={styles.trackPressable}
          disabled={disabled}
        >
          <View style={[styles.track, { backgroundColor: PRIORITY_COLORS[value].track }]}>
            <View
              style={[
                styles.thumb,
                {
                  left: thumbPosition,
                  backgroundColor: PRIORITY_COLORS[value].thumb,
                  shadowColor: PRIORITY_COLORS[value].thumb,
                },
              ]}
            />
          </View>
        </Pressable>
        
        <View style={styles.stepContainer}>
          {[...Array(4)].map((_, index) => (
            <Pressable
              key={index}
              style={styles.step}
              onPress={() => handlePress(index)}
              disabled={disabled}
            >
              <View
                style={[
                  styles.stepDot,
                  index <= value && {
                    backgroundColor: PRIORITY_COLORS[index].thumb,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
      </View>
      
      <View style={styles.labelRow}>
        <Text style={styles.minLabel}>Low</Text>
        <Text style={styles.valueLabel}>{PRIORITY_LABELS[value]}</Text>
        <Text style={styles.maxLabel}>High</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  valueLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.mint,
  },
  minLabel: {
    fontSize: 13,
    color: palette.slate600,
  },
  maxLabel: {
    fontSize: 13,
    color: palette.slate600,
  },
  trackContainer: {
    width: '100%',
    paddingVertical: 12,
    position: 'relative',
    height: 40,
    justifyContent: 'center',
  },
  trackPressable: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
    backgroundColor: '#e2e8f0',
    width: '100%',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0891b2',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    position: 'absolute',
    top: -9,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  stepContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  step: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#cbd5e1',
  },
});

