# Deploy: nessun PC come server

## 1. Metti il progetto su GitHub
Crea un repository e carica l'intera cartella del progetto, mantenendo `render.yaml` nella root.

Non caricare mai file `.env` reali. Sono già esclusi dal `.gitignore`.

## 2. Crea MongoDB Atlas
1. Vai su MongoDB Atlas e crea un progetto.
2. Crea un **Free cluster**.
3. Crea un database user con password forte.
4. In Network Access autorizza le **Outbound IP ranges del servizio Render**. Le trovi in Render: servizio → `Connect` → `Outbound`.
   - Per una configurazione iniziale più rapida puoi consentire `0.0.0.0/0`, ma è meno restrittivo: usa credenziali forti e passa alle range Render appena possibile.
5. Copia la connection string `mongodb+srv://...`.

Non inserire la password nel repository.

## 3. Deploy del backend su Render
1. Accedi a Render.
2. `New` → `Blueprint`.
3. Collega il repository GitHub.
4. Render rileverà `render.yaml`.
5. Quando richiesto, inserisci `MONGODB_URI` con la connection string Atlas.
6. Crea il servizio.

Il Blueprint usa:
- root: `backend`
- build: `pip install -r requirements.txt`
- start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- health check: `/health`
- MongoDB obbligatorio in cloud

Quando il deploy è concluso avrai un URL simile a:

`https://unibo-time-manager-api.onrender.com`

### Verifica
Apri:
- `https://TUO-SERVIZIO.onrender.com/health`
- `https://TUO-SERVIZIO.onrender.com/docs`

`/health` deve restituire:
- `"ok": true`
- `"storage": "mongodb"`
- `"databaseOk": true`

Poi esegui una prima sincronizzazione da Swagger (`/docs`) oppure aprendo l'app.

## 4. Collega l'app mobile
Dentro `mobile` crea `.env`:

```env
EXPO_PUBLIC_API_URL=https://TUO-SERVIZIO.onrender.com
```

Non usare più IP del PC, `localhost` o `10.0.2.2`.

## 5. Prova con Expo Go
```bash
cd mobile
npm install
npx expo start
```

Il PC serve solo per avviare Expo durante lo sviluppo. **Non fa da server dell'app**: dati e API sono già online su Render/Atlas.

## 6. Crea un'app installabile
Installa EAS CLI:
```bash
npm install -g eas-cli
```

Poi:
```bash
cd mobile
eas login
eas build:configure
```

Per una build Android di prova:
```bash
eas build --platform android --profile preview
```

Per la produzione:
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

Per iOS servono le credenziali Apple richieste da Expo/Apple.

## Limite del piano gratuito Render
Un Web Service gratuito può andare in sleep dopo un periodo senza traffico. Alla prima apertura successiva può quindi esserci un cold start. Per uso personale è accettabile; per notifiche immediate e servizio sempre reattivo conviene in seguito passare a un'istanza sempre attiva.

## Cosa manca per la versione completa
Questa infrastruttura elimina la dipendenza dal PC. Per avere notifiche di cambio aula/orario **anche quando l'app non viene aperta**, il passo successivo è aggiungere:
- Expo Push Notifications;
- registrazione del push token del dispositivo;
- processo schedulato cloud che controlla UniBo periodicamente.
