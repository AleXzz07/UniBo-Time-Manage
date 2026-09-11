import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../theme';
export function Card({children, style}: PropsWithChildren<{style?: ViewStyle}>) { return <View style={[styles.card, style]}>{children}</View>; }
const styles = StyleSheet.create({ card: { backgroundColor: theme.card, borderRadius: theme.radius, padding: 18, borderWidth: 1, borderColor: theme.border } });
