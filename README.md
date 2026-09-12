# UniBo Planner

Clone pulito e distribuibile dell'app mobile fornita dall'utente.

## Cosa contiene

- Expo / React Native + Expo Router
- Home "Oggi" con prossima lezione e finestre libere
- Calendario settimanale
- Materie e progresso studio
- Task CRUD con priorità e scadenze
- Sessioni di studio ed eventi personali
- Planner automatico dei blocchi di studio
- Rilevamento variazioni d'orario UniBo
- Notifiche locali
- Light/dark mode
- Backend FastAPI
- Supabase Postgres
- Integrazione con l'endpoint JSON ufficiale UniBo `@@orario_reale_json`

## Struttura

```text
frontend/     app mobile Expo
backend/      API FastAPI
render.yaml   deploy backend su Render
PRD.md        requisiti/prodotto
```

## 1. Crea il database Supabase

1. Crea/apri un progetto Supabase.
2. Vai in **SQL Editor**.
3. Incolla ed esegui `supabase/schema.sql`.
4. Da **Project Settings / API** recupera:
   - `SUPABASE_URL`
   - una **secret key** server-side.

Non inserire mai la secret key nel frontend o nel repository.

## 2. Backend su Render

Crea un Blueprint usando `render.yaml`.

Render chiederà:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
```

Dopo il deploy verifica:

```text
https://TUO-SERVIZIO.onrender.com/health
```

Deve restituire:

```json
{"ok": true, "storage": "supabase", "databaseOk": true}
```

## 3. Frontend

Dentro `frontend/` crea `.env` copiando `.env.example`:

```text
EXPO_PUBLIC_BACKEND_URL=https://TUO-SERVIZIO.onrender.com
```

Poi:

```bash
yarn install
npx expo start
```

## 4. APK

```bash
npm install -g eas-cli
eas login
cd frontend
eas build --platform android --profile preview
```

Il profilo `preview` genera un APK installabile.

## Nota importante

La versione originale esportata da Emergent conteneva file `.env`, cache e `node_modules`.
Questa copia li esclude intenzionalmente per non distribuire credenziali o file inutili.

Il backend usa la stessa logica dell'app originale, ma accetta direttamente
`MONGODB_URI` / `MONGODB_DB`, quindi è pronto per Supabase Postgres + Render.
