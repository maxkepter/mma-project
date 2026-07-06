/**
 * SafeView - Consistent safe area wrapper for all screens
 * Prevents content from rendering behind device notches, status bars, and navigation bars
 */
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SafeViewProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
};

/**
 * Default SafeView for most screens - handles all edges
 */
export function SafeView({
  children,
  style,
  edges = ['top', 'bottom', 'left', 'right'],
  backgroundColor,
}: SafeViewProps) {
  return (
    <SafeAreaView
      style={[
        styles.container,
        backgroundColor ? { backgroundColor } : null,
        style,
      ]}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}

/**
 * SafeView variant for screens with custom headers (preserves top padding but content starts below)
 */
export function SafeViewScrollable({
  children,
  style,
  backgroundColor,
}: Omit<SafeViewProps, 'edges'>) {
  return (
    <SafeAreaView
      style={[styles.container, backgroundColor ? { backgroundColor } : null, style]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {children}
    </SafeAreaView>
  );
}

/**
 * SafeView variant for modal screens
 */
export function SafeViewModal({
  children,
  style,
  backgroundColor,
}: Omit<SafeViewProps, 'edges'>) {
  return (
    <SafeAreaView
      style={[styles.container, backgroundColor ? { backgroundColor } : null, style]}
      edges={['bottom']}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
