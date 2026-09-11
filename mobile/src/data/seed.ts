import { Lesson, StudyTask } from '../types';

// Dati seed volutamente limitati a eventi verificati sulle pagine ufficiali UniBo.
// La sincronizzazione backend sostituisce/integra questi dati con il calendario aggiornato.
export const seedLessons: Lesson[] = [
  {
    id: 'geo-2026-09-14', subjectCode: '29228', subject: 'Geometria e Algebra T', teacher: 'Marta Morigi',
    start: '2026-09-14T09:00:00+02:00', end: '2026-09-14T11:00:00+02:00', room: 'RANZANI B',
    building: 'Edificio via C. Ranzani 14', address: 'Via Camillo Ranzani 14, Bologna',
    sourceUrl: 'https://www.unibo.it/it/studiare/insegnamenti-competenze-trasversali-moocs/insegnamenti/insegnamento/2026/514012/orariolezioni'
  },
  {
    id: 'chimica-2026-09-15', subjectCode: '29225', subject: 'Fondamenti di Chimica T', teacher: 'Michelina Soccio',
    start: '2026-09-15T11:00:00+02:00', end: '2026-09-15T14:00:00+02:00', room: 'RANZANI B',
    building: 'Edificio via C. Ranzani 14', address: 'Via Camillo Ranzani 14, Bologna',
    sourceUrl: 'https://www.unibo.it/it/studiare/insegnamenti-competenze-trasversali-moocs/insegnamenti/insegnamento/2026/514010/orariolezioni'
  },
  {
    id: 'geo-2026-09-16', subjectCode: '29228', subject: 'Geometria e Algebra T', teacher: 'Marta Morigi',
    start: '2026-09-16T14:00:00+02:00', end: '2026-09-16T17:00:00+02:00', room: 'RANZANI B',
    building: 'Edificio via C. Ranzani 14', address: 'Via Camillo Ranzani 14, Bologna',
    sourceUrl: 'https://www.unibo.it/it/studiare/insegnamenti-competenze-trasversali-moocs/insegnamenti/insegnamento/2026/514012/orariolezioni'
  },
  {
    id: 'analisi-2026-09-16', subjectCode: '28622', subject: 'Analisi Matematica T-A', teacher: 'Francesco Uguzzoni',
    start: '2026-09-16T17:00:00+02:00', end: '2026-09-16T19:00:00+02:00', room: 'RANZANI B',
    building: 'Edificio via C. Ranzani 14', address: 'Via Camillo Ranzani 14, Bologna',
    sourceUrl: 'https://www.unibo.it/it/studiare/insegnamenti-competenze-trasversali-moocs/insegnamenti/insegnamento/2026/514009/orariolezioni'
  },
  {
    id: 'chimica-2026-09-17', subjectCode: '29225', subject: 'Fondamenti di Chimica T', teacher: 'Michelina Soccio',
    start: '2026-09-17T09:00:00+02:00', end: '2026-09-17T11:00:00+02:00', room: 'AULA 6.2',
    building: 'Facoltà di Ingegneria', address: 'Viale del Risorgimento 2, Bologna',
    sourceUrl: 'https://www.unibo.it/it/studiare/insegnamenti-competenze-trasversali-moocs/insegnamenti/insegnamento/2026/514010/orariolezioni'
  },
  {
    id: 'analisi-2026-09-17', subjectCode: '28622', subject: 'Analisi Matematica T-A', teacher: 'Francesco Uguzzoni',
    start: '2026-09-17T11:00:00+02:00', end: '2026-09-17T14:00:00+02:00', room: 'AULA 6.2',
    building: 'Facoltà di Ingegneria', address: 'Viale del Risorgimento 2, Bologna',
    sourceUrl: 'https://www.unibo.it/it/studiare/insegnamenti-competenze-trasversali-moocs/insegnamenti/insegnamento/2026/514009/orariolezioni'
  },
  {
    id: 'fisica-2026-09-21', subjectCode: '28626', subject: 'Fisica Generale T-A', teacher: 'Laura Fabbri',
    start: '2026-09-21T09:00:00+02:00', end: '2026-09-21T12:00:00+02:00', room: 'RANZANI B',
    building: 'Edificio via C. Ranzani 14', address: 'Via Camillo Ranzani 14, Bologna',
    sourceUrl: 'https://www.unibo.it/it/studiare/insegnamenti-competenze-trasversali-moocs/insegnamenti/insegnamento/2026/514029/orariolezioni'
  }
];

export const seedTasks: StudyTask[] = [
  { id: 't1', title: 'Ripasso matrici e sistemi lineari', subject: 'Geometria e Algebra T', minutes: 75, priority: 'high', done: false },
  { id: 't2', title: 'Organizza appunti e materiale del corso', subject: 'Analisi Matematica T-A', minutes: 45, priority: 'medium', done: false },
  { id: 't3', title: 'Controlla Virtuale e programma della settimana', subject: 'Università', minutes: 25, priority: 'medium', done: false },
];
