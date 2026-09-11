# UniBo Time Manager

App mobile personale per Ingegneria Meccanica UniBo (A.A. 2026/27).

Questa versione è predisposta per funzionare senza PC acceso:

**App Expo/React Native → API FastAPI su Render → MongoDB Atlas → fonti ufficiali UniBo**

Il telefono conserva inoltre una cache locale, quindi l'ultimo orario resta visibile anche offline.

## Funzioni già presenti
- Home "Oggi" con prossima lezione
- Calendario settimanale
- Task di studio
- Planner delle finestre libere
- Sync automatica all'apertura dell'app + pulsante sync manuale
- Cache offline sul telefono
- Backend FastAPI
- Recupero orari da pagine ufficiali UniBo
- Cache persistente MongoDB Atlas
- Rilevamento cambio aula, cambio orario, nuova lezione e cancellazione
- Fallback ai dati precedenti se una fonte UniBo fallisce

## Deploy cloud consigliato

Leggi `DEPLOY.md`.

## Sviluppo locale opzionale

### Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Senza `MONGODB_URI` il backend usa un JSON locale **solo per sviluppo**. Su Render `REQUIRE_MONGODB=true` impedisce di considerare valida una configurazione cloud senza MongoDB.

### Test backend
```bash
cd backend
pytest -q
```

### Mobile
```bash
cd mobile
npm install
```

Copia `.env.example` in `.env` e imposta l'URL HTTPS di Render:
```env
EXPO_PUBLIC_API_URL=https://TUO-SERVIZIO.onrender.com
```

Poi:
```bash
npx expo start
```

## Build installabile
Il progetto include `mobile/eas.json` per Expo EAS. Dopo aver configurato l'URL del backend puoi creare una build Android/iOS con EAS.

## Nota
Il parser UniBo è isolato in `backend/app/unibo_provider.py`: se UniBo cambia il markup, il resto dell'app non deve essere riscritto.
