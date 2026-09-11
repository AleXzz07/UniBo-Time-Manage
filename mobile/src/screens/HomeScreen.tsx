import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { SectionTitle } from '../components/SectionTitle';
import { theme } from '../theme';
import { Lesson, StudyTask, SyncStatus } from '../types';
import { suggestStudyBlocks } from '../services/planner';

const dt = (iso: string) => new Date(iso);
const time = (iso: string) => dt(iso).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
const dayLabel = (d: Date) => d.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});

export function HomeScreen({lessons,tasks,status,onSync}:{lessons:Lesson[];tasks:StudyTask[];status:SyncStatus;onSync:()=>void}) {
  const now = new Date();
  const todayLessons = useMemo(()=>lessons.filter(l=>dt(l.start).toDateString()===now.toDateString()).sort((a,b)=>+dt(a.start)-+dt(b.start)),[lessons]);
  const next = useMemo(()=>lessons.filter(l=>dt(l.end)>now).sort((a,b)=>+dt(a.start)-+dt(b.start))[0],[lessons]);
  const suggestions = useMemo(()=>suggestStudyBlocks(now, lessons, tasks),[lessons,tasks]);
  const nextMinutes = next ? Math.round((+dt(next.start)-+now)/60000) : null;

  return <ScrollView contentContainerStyle={s.container}>
    <View style={s.header}><View><Text style={s.hello}>UniBo Time</Text><Text style={s.date}>{dayLabel(now)}</Text></View><Pressable onPress={onSync} style={s.sync}><Ionicons name="sync" size={19} color={theme.primary}/></Pressable></View>

    <SectionTitle title="Prossima lezione" />
    <Card style={s.hero}>
      {next ? <>
        <View style={s.pill}><Text style={s.pillText}>{nextMinutes !== null && nextMinutes > 0 ? (nextMinutes<60?`tra ${nextMinutes} min`:`tra ${Math.floor(nextMinutes/60)}h ${nextMinutes%60}m`) : 'in corso / prossima'}</Text></View>
        <Text style={s.heroTitle}>{next.subject}</Text>
        <Text style={s.heroTime}>{time(next.start)} – {time(next.end)}</Text>
        <View style={s.meta}><Ionicons name="location-outline" size={17} color={theme.subtext}/><Text style={s.metaText}>{[next.room,next.address].filter(Boolean).join(' · ')}</Text></View>
      </> : <Text style={s.empty}>Nessuna lezione futura disponibile nella cache.</Text>}
    </Card>

    <View style={s.statusRow}><View style={[s.dot,{backgroundColor: status.ok?theme.success:theme.warning}]}/><Text style={s.statusText}>Dati: {status.source}{status.syncedAt?` · ${new Date(status.syncedAt).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}`:''}</Text></View>

    <SectionTitle title="Oggi" right={`${todayLessons.length} lezioni`} />
    <Card>
      {todayLessons.length===0 ? <Text style={s.empty}>Nessuna lezione salvata per oggi.</Text> : todayLessons.map((l,i)=><View key={l.id} style={[s.timeline,i<todayLessons.length-1&&s.timelineBorder]}><Text style={s.timeCol}>{time(l.start)}</Text><View style={s.bar}/><View style={{flex:1}}><Text style={s.itemTitle}>{l.subject}</Text><Text style={s.itemSub}>{l.room ?? 'Aula da verificare'} · {time(l.end)}</Text></View></View>)}
    </Card>

    <SectionTitle title="Studio consigliato" />
    {suggestions.length===0 ? <Card><Text style={s.empty}>Aggiungi task per ricevere suggerimenti nelle finestre libere.</Text></Card> : suggestions.map(x=><Card key={x.id} style={{marginBottom:10}}><Text style={s.itemSub}>{time(x.start)} – {time(x.end)} · {x.minutes} min</Text><Text style={s.itemTitle}>{x.subject}</Text><Text style={s.task}>{x.title}</Text></Card>)}
  </ScrollView>;
}
const s=StyleSheet.create({container:{padding:18,paddingTop:12,paddingBottom:120,backgroundColor:theme.bg},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:8},hello:{fontSize:29,fontWeight:'900',color:theme.text},date:{fontSize:15,color:theme.subtext,marginTop:4,textTransform:'capitalize'},sync:{width:44,height:44,borderRadius:16,backgroundColor:theme.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:theme.border},hero:{padding:22},pill:{alignSelf:'flex-start',backgroundColor:theme.primarySoft,borderRadius:99,paddingHorizontal:10,paddingVertical:6,marginBottom:15},pillText:{color:theme.primary,fontSize:12,fontWeight:'800'},heroTitle:{fontSize:24,fontWeight:'900',color:theme.text},heroTime:{fontSize:20,fontWeight:'700',color:theme.text,marginTop:7},meta:{flexDirection:'row',alignItems:'flex-start',gap:6,marginTop:14},metaText:{flex:1,color:theme.subtext,fontSize:14,lineHeight:19},statusRow:{flexDirection:'row',alignItems:'center',gap:7,marginTop:10,paddingHorizontal:4},dot:{width:8,height:8,borderRadius:8},statusText:{fontSize:12,color:theme.subtext},empty:{color:theme.subtext,lineHeight:20},timeline:{flexDirection:'row',alignItems:'center',paddingVertical:12},timelineBorder:{borderBottomWidth:1,borderBottomColor:theme.border},timeCol:{width:53,fontSize:14,fontWeight:'800',color:theme.text},bar:{width:4,height:42,borderRadius:3,backgroundColor:theme.primary,marginRight:12},itemTitle:{fontSize:16,fontWeight:'800',color:theme.text},itemSub:{fontSize:13,color:theme.subtext,marginBottom:4},task:{fontSize:14,color:theme.subtext,marginTop:5}});
