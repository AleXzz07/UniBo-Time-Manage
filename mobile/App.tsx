import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { StudyScreen } from './src/screens/StudyScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { seedLessons, seedTasks } from './src/data/seed';
import { Lesson, StudyTask, SyncStatus } from './src/types';
import { loadLessons, loadSyncStatus, loadTasks, saveLessons, saveSyncStatus, saveTasks } from './src/services/storage';
import { syncSchedule } from './src/services/api';
import { theme } from './src/theme';

type Tab='home'|'calendar'|'study'|'settings';
const tabs:[Tab,string,keyof typeof Ionicons.glyphMap][]=[['home','Oggi','today-outline'],['calendar','Calendario','calendar-outline'],['study','Studio','checkbox-outline'],['settings','Altro','settings-outline']];

export default function App(){
 const [tab,setTab]=useState<Tab>('home');
 const [lessons,setLessons]=useState<Lesson[]>(seedLessons);
 const [tasks,setTasksState]=useState<StudyTask[]>(seedTasks);
 const [status,setStatus]=useState<SyncStatus>({ok:true,warnings:['Seed locale: sincronizzazione automatica non ancora completata.'],source:'seed'});
 const [ready,setReady]=useState(false);
 const [syncing,setSyncing]=useState(false);

 useEffect(()=>{(async()=>{
   const [cachedLessons,cachedTasks,cachedStatus]=await Promise.all([loadLessons(),loadTasks(),loadSyncStatus()]);
   if(cachedLessons?.length)setLessons(cachedLessons);
   if(cachedTasks)setTasksState(cachedTasks);
   if(cachedStatus)setStatus(cachedStatus);
   setReady(true);

   // Appena l'app viene aperta prova ad aggiornare UniBo. Se internet/API non
   // sono disponibili, la cache locale appena caricata resta intatta.
   setSyncing(true);
   try{
     const out=await syncSchedule();
     if(out.lessons.length){
       setLessons(out.lessons);
       await saveLessons(out.lessons);
     }
     setStatus(out.status);
     await saveSyncStatus(out.status);
   }catch(e){
     const fallback:SyncStatus={
       ok:false,
       warnings:[e instanceof Error?e.message:'Errore sincronizzazione'],
       source:cachedLessons?.length?'cache':'seed'
     };
     setStatus(fallback);
     await saveSyncStatus(fallback);
   }finally{setSyncing(false)}
 })()},[]);

 const setTasks=(x:StudyTask[])=>{setTasksState(x);saveTasks(x).catch(()=>{})};
 const sync=async()=>{
   if(syncing)return;
   setSyncing(true);
   try{
     const out=await syncSchedule();
     if(out.lessons.length){setLessons(out.lessons);await saveLessons(out.lessons)}
     setStatus(out.status);
     await saveSyncStatus(out.status);
   }catch(e){
     const next:SyncStatus={...status,ok:false,warnings:[e instanceof Error?e.message:'Errore sincronizzazione'],source:lessons.length?'cache':'seed'};
     setStatus(next);
     await saveSyncStatus(next);
   }finally{setSyncing(false)}
 };

 if(!ready)return <SafeAreaView style={s.loading}><ActivityIndicator size="large" color={theme.primary}/></SafeAreaView>;
 const content=tab==='home'?<HomeScreen lessons={lessons} tasks={tasks} status={status} onSync={sync}/>:tab==='calendar'?<CalendarScreen lessons={lessons}/>:tab==='study'?<StudyScreen tasks={tasks} setTasks={setTasks}/>:<SettingsScreen status={status}/>;
 return <SafeAreaView style={s.root}><StatusBar style="dark"/><View style={{flex:1}}>{content}</View>{syncing?<View style={s.syncToast}><ActivityIndicator size="small" color="#fff"/><Text style={s.syncText}>Sincronizzazione UniBo…</Text></View>:null}<View style={s.tabs}>{tabs.map(([id,label,icon])=><Pressable key={id} onPress={()=>setTab(id)} style={s.tab}><Ionicons name={icon} size={22} color={tab===id?theme.primary:theme.subtext}/><Text style={[s.tabLabel,tab===id&&s.tabActive]}>{label}</Text></Pressable>)}</View></SafeAreaView>
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:theme.bg},loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:theme.bg},tabs:{position:'absolute',left:14,right:14,bottom:12,height:72,borderRadius:24,backgroundColor:'rgba(255,255,255,0.97)',borderWidth:1,borderColor:theme.border,flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingHorizontal:4},tab:{flex:1,alignItems:'center',justifyContent:'center',gap:4},tabLabel:{fontSize:10,color:theme.subtext,fontWeight:'700'},tabActive:{color:theme.primary},syncToast:{position:'absolute',alignSelf:'center',bottom:94,backgroundColor:'#22252B',borderRadius:18,paddingHorizontal:14,paddingVertical:10,flexDirection:'row',gap:9,alignItems:'center'},syncText:{color:'#fff',fontSize:12,fontWeight:'700'}});
