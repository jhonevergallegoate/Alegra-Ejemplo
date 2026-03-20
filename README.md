# Dashboard Ejemplo — Customer Health Score

Dashboard interno de Alegra que visualiza el **Customer Health Score (CHS)** de clientes Core activos, con autenticación Google OAuth restringida a cuentas `@alegra.com`.

## Stack

- **Frontend:** HTML + CSS + Chart.js (sin framework)
- **Backend:** Node.js nativo (ESM, sin Express)
- **Auth:** Google OAuth 2.0 → JWT en cookie HttpOnly
- **Deploy:** Vercel
- **Fuente de datos:** Redshift — `bi_customer_experience.healthy_core_users`

## Estructura

```
├── index.html              # Dashboard (protegido por auth)
├── login.html              # Página de login con Google
├── server.js               # Dev server local (puerto 3001)
├── vercel.json             # Routing y headers de seguridad
├── package.json
├── .env.example            # Variables requeridas (sin valores)
├── api/
│   ├── serve.js            # Verifica JWT y sirve index.html
│   └── auth/
│       ├── login.js        # Inicia OAuth → Google
│       ├── callback.js     # Recibe code, emite JWT cookie
│       ├── me.js           # Devuelve perfil del usuario autenticado
│       ├── logout.js       # Limpia cookie y redirige a /login
│       └── embed.js        # Autenticación via postMessage (iframe)
└── logo.png / logo-verde.png / favicon.png
```

## Variables de entorno

Crea `.env.local` a partir de `.env.example`:

```env
GOOGLE_CLIENT_ID=<tu-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<tu-client-secret>
JWT_SECRET=<string-aleatorio-base64>
APP_URL=http://localhost:3001
```

En producción (Vercel), `APP_URL=https://alegra-ejemplo.vercel.app`.

## Configuración Google Cloud

En **APIs & Services → Credentials → OAuth 2.0 Client ID**:

**Authorized JavaScript origins:**
```
http://localhost:3001
https://alegra-ejemplo.vercel.app
```

**Authorized redirect URIs:**
```
http://localhost:3001/api/auth/callback
https://alegra-ejemplo.vercel.app/api/auth/callback
```

## Correr localmente

```bash
npm install
node server.js
# → http://localhost:3001
```

Redirige a `/login` si no hay sesión activa. Solo permite cuentas `@alegra.com`.

## Deploy

El proyecto está conectado a Vercel en:
**https://alegra-ejemplo.vercel.app**

Variables de entorno requeridas en Vercel Settings → Environment Variables:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `APP_URL` = `https://alegra-ejemplo.vercel.app`

## Datos

| Campo | Valor |
|---|---|
| Tabla | `bi_customer_experience.healthy_core_users` |
| Total logos | 2,925 |
| CHS promedio | 85.8 / 100 |
| Rango CHS | 75 – 100 |
| Estado | Todos "Saludable" |
| Países | Colombia, Rep. Dominicana, México, Costa Rica |
