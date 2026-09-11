import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../components/Card';
import { theme } from '../theme';
import { StudyTask } from '../types';

export function StudyScreen({tasks,setTasks}:{tasks:StudyTask[];setTasks:(x:StudyTask[])=>void}){
 const [title,setTitle]=useState('');
 const add=()=>{const v=title.trim();if(!v)return;setTasks([{id:`t-${Date.now()}`,title:v,subject:'Università',minutes:60,priority:'medium',done:false},...tasks]);setTitle('')};
 const toggle=(id:string)=>setTasks(tasks.map(t=>t.id===id?{...t,done:!t.done}:t));
 const open=tasks.filter(t=>!t.done), done=tasks.filter(t=>t.done);
 return <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
  <Text style={s.title}>Studio</Text><Text style={s.sub}>Task, priorità e tempo da dedicare.</Text>
  <Card style={{marginTop:22}}><Text style={s.label}>Nuovo task</Text><View style={s.addRow}><TextInput value={title} onChangeText={setTitle} placeholder="Es. esercizi capitolo 1" placeholderTextColor="#9A9EA8" style={s.input} onSubmitEditing={add}/><Pressable onPress={add} style={s.add}><Text style={s.addTxt}>+</Text></Pressable></View></Card>
  <Text style={s.section}>Da fare · {open.length}</Text>
  {open.map(t=><Pressable key={t.id} onPress={()=>toggle(t.id)}><Card style={s.task}><View style={s.row}><View style={s.check}/><View style={{flex:1}}><Text style={s.taskTitle}>{t.title}</Text><Text style={s.taskSub}>{t.subject} · {t.minutes} min · priorità {t.priority}</Text></View></View></Card></Pressable>)}
  {done.length>0?<><Text style={s.section}>Completati · {done.length}</Text>{done.map(t=><Pressable key={t.id} onPress={()=>toggle(t.id)}><Card style={s.task}><View style={s.row}><View style={s.checked}><Text style={{color:'#fff'}}>✓</Text></View><View style={{flex:1}}><Text style={[s.taskTitle,{textDecorationLine:'line-through',color:theme.subtext}]}>{t.title}</Text></View></View></Card></Pressable>)}</>:null}
 </ScrollView>
}
const s=StyleSheet.create({container:{padding:18,paddingBottom:120,backgroundColor:theme.bg},title:{fontSize:29,fontWeight:'900',color:theme.text,marginTop:8},sub:{fontSize:14,color:theme.subtext,marginTop:3},label:{fontSize:13,fontWeight:'800',color:theme.subtext,textTransform:'uppercase',letterSpacing:.7},addRow:{flexDirection:'row',gap:10,marginTop:10},input:{flex:1,backgroundColor:theme.bg,borderRadius:14,paddingHorizontal:14,paddingVertical:13,color:theme.text,fontSize:15},add:{width:46,borderRadius:14,backgroundColor:theme.primary,alignItems:'center',justifyContent:'center'},addTxt:{color:'#fff',fontSize:25,fontWeight:'600'},section:{fontSize:13,fontWeight:'800',color:theme.subtext,textTransform:'uppercase',letterSpacing:.7,marginTop:25,marginBottom:10},task:{marginBottom:9},row:{flexDirection:'row',alignItems:'center',gap:12},check:{width:24,height:24,borderRadius:9,borderWidth:2,borderColor:'#C8CCD5'},checked:{width:24,height:24,borderRadius:9,backgroundColor:theme.success,alignItems:'center',justifyContent:'center'},taskTitle:{fontSize:15,fontWeight:'800',color:theme.text},taskSub:{fontSize:12,color:theme.subtext,marginTop:5}});
