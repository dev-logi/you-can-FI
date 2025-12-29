/**
 * PieChart Component
 * 
 * A simple pie chart component using react-native-svg
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

export interface PieChartData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
  showPercentages?: boolean;
}

export function PieChart({
  data,
  size = 200,
  strokeWidth = 2,
  showLabels = true,
  showPercentages = true,
}: PieChartProps) {
  if (data.length === 0) {
    return null;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return null;
  }

  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  let currentAngle = -90; // Start at top

  const paths = data.map((item, index) => {
    const percentage = item.percentage;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calculate arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    // Calculate label position (middle of arc)
    const labelAngle = (startAngle + angle / 2) * (Math.PI / 180);
    const labelRadius = radius * 0.7;
    const labelX = center + labelRadius * Math.cos(labelAngle);
    const labelY = center + labelRadius * Math.sin(labelAngle);

    return {
      path: pathData,
      color: item.color,
      label: item.label,
      percentage: item.percentage,
      labelX,
      labelY,
      showLabel: percentage > 5, // Only show label if slice is > 5%
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {paths.map((path, index) => (
            <Path
              key={index}
              d={path.path}
              fill={path.color}
              stroke="#ffffff"
              strokeWidth={strokeWidth}
            />
          ))}
        </G>
        {showLabels && showPercentages && (
          <G>
            {paths.map(
              (path, index) =>
                path.showLabel && (
                  <SvgText
                    key={`label-${index}`}
                    x={path.labelX}
                    y={path.labelY}
                    fontSize={12}
                    fill="#ffffff"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {path.percentage.toFixed(0)}%
                  </SvgText>
                )
            )}
          </G>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

