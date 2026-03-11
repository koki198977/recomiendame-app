# Contexto del Proyecto - Recomiéndame

## 📱 Descripción General

**Recomiéndame** es una aplicación móvil de recomendaciones de películas y series impulsada por inteligencia artificial. Permite a los usuarios descubrir contenido personalizado, organizar su entretenimiento y llevar un registro de lo que han visto.

## 🎯 Propósito

Resolver el problema de "no sé qué ver" proporcionando recomendaciones inteligentes basadas en:
- Preferencias del usuario
- Historial de visualización
- Calificaciones previas
- Géneros favoritos
- Descripción de lo que el usuario quiere ver

## 👥 Usuario Objetivo

- Amantes del cine y las series
- Personas que usan múltiples plataformas de streaming
- Usuarios que quieren organizar su contenido
- Personas que buscan recomendaciones personalizadas

## 🏗️ Arquitectura Técnica

### Frontend (Esta aplicación)
- **Plataforma:** React Native con Expo
- **Lenguaje:** TypeScript
- **UI Framework:** React Native Paper (Material Design 3)
- **Navegación:** React Navigation (Bottom Tabs)
- **Estado:** React Hooks (sin Redux/Context API global)
- **Almacenamiento local:** AsyncStorage

### Backend
- **URL:** https://api.recomiendameapp.cl
- **Autenticación:** JWT Bearer tokens
- **Endpoints:** RESTful API

### Servicios externos
- **TMDB API:** Información de películas y series
- **YouTube:** Enlaces a trailers

## 📊 Flujo de Usuario

### 1. Onboarding
```
Login/Register → Autenticación → Home Dashboard
```

### 2. Uso principal
```
Home → Ver estadísticas
     → Recomendaciones → Generar con IA → Ver detalles → Marcar (visto/favorito/wishlist)
     → Favoritos → Ver colección
     → Vistos → Ver historial
     → Wishlist → Ver lista de deseos
     → Perfil → Configuración
```

### 3. Flujo de recomendación
```
1. Usuario describe lo que quiere ver (opcional)
2. Sistema genera recomendaciones con IA
3. Usuario ve tarjetas con pósters
4. Usuario hace clic en una película/serie
5. Modal muestra detalles completos
6. Usuario puede:
   - Ver trailer
   - Marcar como visto
   - Agregar a favoritos
   - Agregar a wishlist
   - Calificar con estrellas
```

## 🎨 Diseño Visual

### Paleta de colores
- **Primario:** #8B5CF6 (Morado)
- **Secundario:** #a855f7 (Morado claro)
- **Fondo:** #000000 (Negro)
- **Superficie:** #1e1e1e (Gris muy oscuro)
- **Superficie clara:** #2a2a2a (Gris oscuro)
- **Texto:** #ffffff (Blanco)
- **Texto secundario:** #cccccc (Gris claro)
- **Texto terciario:** #71717A (Gris)
- **Borde:** #27272A (Gris muy oscuro)

### Estilo
- **Tema:** Dark mode exclusivo
- **Tipografía:** System fonts (Arial, sans-serif)
- **Bordes:** Redondeados (8-20px)
- **Sombras:** Sutiles con color morado
- **Iconos:** Emojis y @expo/vector-icons (Ionicons)

### Componentes visuales
- Tarjetas con bordes morados y sombras
- Botones con gradientes morados
- Tab bar flotante con fondo oscuro
- Modales con overlay oscuro
- Inputs con fondo oscuro y bordes morados

## 📁 Estructura de Datos

### Usuario
```typescript
{
  id: string
  email: string
  name: string
  token: string (almacenado en AsyncStorage)
}
```

### Recomendación
```typescript
{
  id: string
  tmdbId: number
  title: string
  posterUrl: string
  overview: string
  releaseDate: string
  voteAverage: number
  mediaType: 'movie' | 'tv'
  reason: string
  platforms?: string[]
  trailerUrl?: string
}
```

### Rating
```typescript
{
  id: string
  tmdbId: number
  title: string
  mediaType: 'movie' | 'tv'
  rating: number (1-5)
  comment?: string
}
```

### Estadísticas
```typescript
{
  seenTotal: number
  favoriteTotal: number
  wishlistTotal: number
  ratingsTotal: number
  averageRating: number
  favoriteGenres: string[]
  recentRecommendations: Recommendation[]
}
```

## 🔄 Estado de la Aplicación

### Almacenamiento local (AsyncStorage)
- `token`: JWT token de autenticación
- `userId`: ID del usuario actual

### Estado por pantalla
Cada pantalla maneja su propio estado con hooks:
- `loading`: Estado de carga
- `data`: Datos de la pantalla
- `error`: Errores
- `selectedItem`: Item seleccionado en modales

No hay estado global compartido.

## 🔐 Autenticación

### Flujo
1. Usuario ingresa email/password
2. POST a `/auth/login`
3. Backend retorna token JWT
4. Token se guarda en AsyncStorage
5. Token se incluye en header de todas las requests: `Authorization: Bearer {token}`

### Verificación
- Al iniciar app, se verifica si existe token
- Se hace request a `/users/me` para validar token
- Si falla, se redirige a login

### Logout
- Se eliminan `token` y `userId` de AsyncStorage
- Se redirige a login

## 🎬 Funcionalidades Principales

### 1. Recomendaciones con IA
- Usuario puede describir lo que quiere ver
- Sistema genera recomendaciones personalizadas
- Algoritmo aprende de calificaciones y preferencias
- Muestra razón de cada recomendación

### 2. Organización de contenido
- **Vistos:** Películas/series que ya vio
- **Favoritos:** Contenido que le encantó
- **Wishlist:** Para ver después

### 3. Sistema de calificación
- Calificar con 1-5 estrellas
- Agregar comentarios opcionales
- Ver calificaciones previas
- Influye en futuras recomendaciones

### 4. Estadísticas
- Total de vistos, favoritos, wishlist
- Promedio de calificaciones
- Géneros favoritos
- Recomendaciones recientes

### 5. Información detallada
- Sinopsis completa
- Calificación de TMDB
- Año de estreno
- Plataformas disponibles
- Enlace a trailer

## 🚀 Estado del Proyecto

### Versión actual
- **Version:** 1.0.0
- **Version Code:** 1
- **Estado:** En desarrollo, preparando para lanzamiento en Play Store

### Package name
- **Android:** com.kokialvarez.recomiendame
- **iOS:** com.kokialvarez.recomiendame

### Plataformas
- ✅ Android (principal)
- 🔄 iOS (configurado pero no desplegado)

## 📝 Pendientes para lanzamiento

### Técnico
- [x] Configurar EAS Build
- [x] Generar AAB para Play Store
- [x] Resolver conflictos de package name
- [ ] Generar build final con package correcto
- [ ] Probar en dispositivos reales

### Play Store
- [ ] Crear aplicación en Play Console
- [ ] Subir AAB
- [ ] Completar descripción
- [ ] Subir capturas de pantalla
- [ ] Subir gráfico de funciones
- [ ] Completar clasificación de contenido
- [ ] Agregar política de privacidad
- [ ] Enviar para revisión

### Documentación
- [x] Descripción para Play Store
- [x] Notas de versión
- [x] Guías de generación de assets
- [ ] Política de privacidad pública

## 🐛 Problemas Conocidos

### Resueltos
- ✅ Conflictos de package name (múltiples intentos)
- ✅ Error de firma de certificado
- ✅ Configuración de AAB vs APK

### Pendientes
- Ninguno crítico actualmente

## 🔮 Futuras Mejoras (Post-lanzamiento)

### Funcionalidades
- Compartir recomendaciones con amigos
- Listas personalizadas
- Notificaciones de nuevos estrenos
- Integración con calendarios
- Modo offline
- Búsqueda avanzada
- Filtros por plataforma

### Técnico
- Implementar caché de imágenes
- Optimizar rendimiento de listas
- Agregar animaciones más fluidas
- Implementar deep linking
- Agregar analytics

### UI/UX
- Onboarding interactivo
- Tutorial de primera vez
- Temas personalizables
- Más opciones de personalización

## 📞 Contacto y Recursos

### Desarrollador
- **Usuario Expo:** kokialvarez78
- **Package:** com.kokialvarez.recomiendame

### URLs importantes
- **Backend API:** https://api.recomiendameapp.cl
- **Expo Dashboard:** https://expo.dev/accounts/kokialvarez78/projects/recomiendame-app
- **Play Console:** https://play.google.com/console

### Recursos del proyecto
- Descripción: `PLAYSTORE_DESCRIPTION.md`
- Notas de versión: `NOTAS_VERSION.md`
- Generador de feature graphic: `GENERAR_PNG.html`
- Generador de screenshots: `GENERAR_SCREENSHOTS*.html`

## 💡 Filosofía del Proyecto

- **Simplicidad:** Interfaz intuitiva y fácil de usar
- **Personalización:** Recomendaciones adaptadas a cada usuario
- **Organización:** Ayudar a gestionar el entretenimiento
- **Calidad:** Contenido de alta calidad, no cantidad
- **Privacidad:** Datos del usuario protegidos
- **Gratuito:** Sin anuncios ni pagos

## 🎯 Métricas de Éxito

### Técnicas
- Tiempo de carga < 2 segundos
- Tasa de error < 1%
- Crashes < 0.1%

### Usuario
- Retención día 1 > 40%
- Retención día 7 > 20%
- Recomendaciones generadas por usuario > 5
- Calificaciones por usuario > 3

### Negocio
- Descargas primer mes > 100
- Rating en Play Store > 4.0
- Reviews positivos > 70%
