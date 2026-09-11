import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';
export function SectionTitle({title, right}: {title: string; right?: string}) { return <View style={s.row}><Text style={s.t}>{title}</Text>{right ? <Text style={s.r}>{right}</Text> : null}</View>; }
const s = StyleSheet.create({row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:24,marginBottom:10},t:{fontSize:13,fontWeight:'800',letterSpacing:.8,color:theme.subtext,textTransform:'uppercase'},r:{fontSize:13,color:theme.primary,fontWeight:'700'}});
