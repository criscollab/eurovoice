# Euro Voice — Radio Online Multi-Emisora 24/7

Plataforma de radio online con múltiples emisoras transmitiendo música en vivo, 24/7.
Construida con Next.js 16, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma (SQLite) y NextAuth.

---

## Cómo restaurar este proyecto

### Opción A — Restaurar con un asistente de IA (recomendado)

Cuando abras una nueva sesión con un asistente de IA (como yo), puedes:

1. **Subir este ZIP** directamente al chat
2. O **descomprimirlo localmente** y subir los archivos individuales
3. Pedirle al asistente: *"Restaura este proyecto Next.js y continúa el trabajo"*

El asistente necesitará:
- Tener acceso a un entorno Node.js 18+ con Bun
- Ejecutar `bun install` para instalar dependencias
- Ejecutar `bun run db:push` para crear/regenerar la base de datos
- Ejecutar `bun run dev` para iniciar el servidor

### Opción B — Restaurar localmente en tu computador

```bash
# 1. Descomprime el ZIP
unzip eurovoice-radio.zip
cd eurovoice-radio

# 2. Instala Bun (si no lo tienes)
# https://bun.sh/
curl -fsSL https://bun.sh/install | bash

# 3. Instala las dependencias
bun install

# 4. Crea la base de datos (si no se incluyó db/custom.db)
bun run db:push

# 5. Inicia el servidor de desarrollo
bun run dev
```

Abre http://localhost:3000 en tu navegador.

---

## Credenciales de administrador

```
Usuario: admin
Contraseña: Euro-connecti309
```

> Para cambiarlas, edita el archivo `.env` (variables `ADMIN_USERNAME` y `ADMIN_PASSWORD`)
> y reinicia el servidor.

---

## Estructura del proyecto

```
eurovoice-radio/
├── prisma/
│   ├── schema.prisma         # Modelos: Station, Song
│   └── migrations/            # Migraciones de BD (si aplica)
├── db/
│   └── custom.db             # Base de datos SQLite (con tus emisoras y canciones)
├── public/
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── api/              # API routes (stations, songs, auth)
│   │   ├── page.tsx          # Página principal (grid de emisoras + player)
│   │   ├── layout.tsx        # Layout raíz con SessionProvider
│   │   └── globals.css       # Estilos (tema blanco/azul)
│   ├── components/
│   │   ├── station-card.tsx       # Tarjeta de emisora
│   │   ├── sticky-player.tsx     # Reproductor 24/7
│   │   ├── admin-panel.tsx       # Panel admin (CRUD)
│   │   ├── login-dialog.tsx      # Diálogo de login
│   │   ├── user-menu.tsx         # Botón login/admin/logout
│   │   ├── vinyl-disc.tsx        # Vinilo animado
│   │   ├── equalizer-bars.tsx    # Visualizador
│   │   └── ui/                    # Componentes shadcn/ui
│   ├── lib/
│   │   ├── auth.ts           # Configuración NextAuth
│   │   ├── db.ts             # Cliente Prisma
│   │   ├── radio.ts          # Lógica 24/7 (cálculo now-playing)
│   │   └── radio-store.ts    # Store Zustand
│   └── hooks/
└── .env                      # Variables de entorno (¡NO SUBIR A GIT PÚBLICO!)
```

---

## Características principales

- **Multi-emisora 24/7** — Cada emisora reproduce su lista en bucle infinito.
  Todos los oyentes que se conectan al mismo tiempo escuchan la misma canción,
  como una radio tradicional.
- **Panel admin protegido** — Solo el administrador autenticado puede crear,
  editar o eliminar emisoras y canciones. Los visitantes solo escuchan.
- **Reproductor sticky** — Sincronización automática con el timeline del servidor,
  vinilo animado, ecualizador, control de volumen, cola de reproducción expandible.
- **Tema blanco/azul** — Diseño limpio y luminoso, responsive (móvil + desktop).
- **5 emisoras de demo** incluidas (Español, English, Français, Português, Italiano)
  usando tracks royalty-free de SoundHelix.

---

## Comandos disponibles

```bash
bun run dev          # Servidor de desarrollo (puerto 3000)
bun run build        # Build de producción
bun run lint         # Verificar código con ESLint
bun run db:push      # Sincronizar schema con la base de datos
bun run db:generate  # Regenerar Prisma Client
bun run db:migrate   # Crear migración
bun run db:reset     # Resetear base de datos (¡borra todo!)
```

---

## Stack tecnológico

- **Framework:** Next.js 16 (App Router) + TypeScript 5
- **Estilos:** Tailwind CSS 4 + shadcn/ui
- **BD:** Prisma ORM + SQLite
- **Auth:** NextAuth.js v4 (Credentials Provider, JWT)
- **Estado:** Zustand + TanStack Query
- **Iconos:** Lucide React
- **Fuentes:** Geist Sans/Mono (Next.js fonts)

---

## Próximas mejoras sugeridas

1. Reemplazar las canciones de demo por tus propias URLs (CDN, S3, Cloudflare R2)
2. Subir el proyecto a un hosting (Vercel, Netlify, Railway, etc.)
3. Considerar cambiar SQLite por PostgreSQL si esperas mucho tráfico
4. Añadir portadas de canciones y emisoras (campo `coverUrl` ya existe)
5. Implementar programación de horarios (programas en diferentes horas del día)
