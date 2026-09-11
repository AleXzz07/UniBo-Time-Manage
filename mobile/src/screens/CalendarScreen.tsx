import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { theme } from '../theme';
import { Lesson } from '../types';

const days=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
const startMonday=(d:Date)=>{const x=new Date(d);const wd=(x.getDay()+6)%7;x.setDate(x.getDate()-wd);x.setHours(0,0,0,0);return x};
const same=(a:Date,b:Date)=>a.toDateString()===b.toDateString();
const tm=(s:string)=>new Date(s).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});

export function CalendarScreen({lessons}:{lessons:Lesson[]}){
 const [anchor,setAnchor]=useState(new Date());
 const monday=useMemo(()=>startMonday(anchor),[anchor]);
 const week=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d});
 const move=(n:number)=>{const d=new Date(anchor);d.setDate(d.getDate()+n*7);setAnchor(d)};
 return <ScrollView contentContainerStyle={s.container}>
   <View style={s.head}><View><Text style={s.title}>Calendario</Text><Text style={s.sub}>{monday.toLocaleDateString('it-IT',{month:'long',year:'numeric'})}</Text></View><View style={s.nav}><Pressable onPress={()=>move(-1)}><Text style={s.navB}>‹</Text></Pressable><Pressable onPress={()=>setAnchor(new Date())}><Text style={s.today}>Oggi</Text></Pressable><Pressable onPress={()=>move(1)}><Text style={s.navB}>›</Text></Pressable></View></View>
   <View style={s.days}>{week.map((d,i)=><Pressable key={i} onPress={()=>setAnchor(d)} style={[s.day,same(d,anchor)&&s.dayActive]}><Text style={[s.dow,same(d,anchor)&&s.white]}>{days[i] ?? ''}</Text><Text style={[s.num,same(d,anchor)&&s.white]}>{d.getDate()}</Text></Pressable>)}</View>
   <Text style={s.dayTitle}>{anchor.toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})}</Text>
   {lessons.filter(l=>same(new Date(l.start),anchor)).sort((a,b)=>+new Date(a.start)-+new Date(b.start)).map(l=><Card key={l.id} style={s.event}><View style={s.eventRow}><View style={s.accent}/><View style={{flex:1}}><Text style={s.time}>{tm(l.start)} – {tm(l.end)}</Text><Text style={s.eventTitle}>{l.subject}</Text><Text style={s.eventSub}>{l.room ?? 'Aula da verificare'}{l.address?` · ${l.address}`:''}</Text></View></View></Card>)}
   {lessons.filter(l=>same(new Date(l.start),anchor)).length===0?<Card><Text style={s.empty}>Nessuna lezione disponibile per questo giorno.</Text></Card>:null}
 </ScrollView>
}
const s=StyleSheet.create({container:{padding:18,paddingBottom:120,backgroundColor:theme.bg},head:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:8},title:{fontSize:29,fontWeight:'900',color:theme.text},sub:{fontSize:14,color:theme.subtext,marginTop:3,textTransform:'capitalize'},nav:{flexDirection:'row',alignItems:'center',gap:14},navB:{fontSize:28,color:theme.primary,fontWeight:'500'},today:{fontSize:13,color:theme.primary,fontWeight:'800'},days:{flexDirection:'row',justifyContent:'space-between',marginTop:26,marginBottom:24},day:{width:43,alignItems:'center',paddingVertical:9,borderRadius:16},dayActive:{backgroundColor:theme.primary},dow:{fontSize:11,color:theme.subtext,fontWeight:'700'},num:{fontSize:17,color:theme.text,fontWeight:'900',marginTop:3},white:{color:'#fff'},dayTitle:{fontSize:18,fontWeight:'900',color:theme.text,textTransform:'capitalize',marginBottom:12},event:{marginBottom:10},eventRow:{flexDirection:'row'},accent:{width:5,borderRadius:5,backgroundColor:theme.primary,marginRight:13},time:{fontSize:13,color:theme.primary,fontWeight:'800'},eventTitle:{fontSize:16,fontWeight:'900',color:theme.text,marginTop:4},eventSub:{fontSize:13,color:theme.subtext,marginTop:5,lineHeight:18},empty:{color:theme.subtext}});
