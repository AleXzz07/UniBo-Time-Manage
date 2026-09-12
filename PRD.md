# UniBo Planner — Product Requirements Document

## Problema
Applicazione mobile personale, senza login, per organizzare la vita universitaria di uno studente di Ingegneria Meccanica all'Università di Bologna. L'app riunisce orario reale UniBo, lezioni, tempo libero, task, materie, sessioni di studio e variazioni d'orario, usando sempre il fuso `Europe/Rome`.

## Architettura
- **Frontend:** Expo / React Native con Expo Router, React Query e componenti nativi.
- **Backend:** FastAPI con tutte le route applicative sotto `/api`.
- **Database:** MongoDB; documenti con identificativi stringa e `_id` escluso dalle risposte.
- **Dati universitari:** endpoint JSON ufficiale UniBo `@@orario_reale_json`, normalizzazione e cache server-side.
- **Tempo:** date e confronti frontend centralizzati in `frontend/src/lib/time.ts` con `Europe/Rome`.

## Implementato
- Onboarding personale senza autenticazione, corso e gruppo UniBo.
- Sincronizzazione dell'orario reale, cache dell'ultimo orario valido e stato dell'ultimo aggiornamento.
- Rilevamento di nuove lezioni, cancellazioni, cambi aula e cambi orario.
- Home giornaliera con prossima lezione e finestre libere.
- Calendario settimanale, dettaglio lezione e collegamenti a mappe/UniBo.
- Gestione completa dei task: creazione, modifica, priorità, scadenza, materia, completamento ed eliminazione.
- Area Studio con materie, obiettivi orari, progresso basato sulle sessioni completate, data esame e task collegati.
- Eventi personali e sessioni di studio.
- Pianificatore che propone blocchi nelle finestre libere e consente di accettare, modificare o ignorare.
- Notifiche locali configurabili per lezioni, task e sessioni di studio; richiedono un'app nativa su dispositivo per la verifica completa.
- Tema chiaro/scuro e interfaccia mobile in italiano.

## Backlog

### P0
- Verifica completa su dispositivo fisico delle notifiche locali.
- Completare la gestione granulare degli argomenti per materia, inclusi stato completato e progresso dedicato.

### P1
- Rafforzare la persistenza offline del calendario e delle schermate principali sul dispositivo.
- Mostrare in modo uniforme “Ultimo aggiornamento UniBo” e lo stato cache/offline nelle schermate rilevanti.
- Eseguire test end-to-end completi su iOS e Android.

### P2
- Raffinare le regole del planner con priorità task, carico giornaliero e preferenze personali.
- Migliorare accessibilità, animazioni e rifiniture visive finali.