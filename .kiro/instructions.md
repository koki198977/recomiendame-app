# Instrucciones para Kiro - Proyecto Recomiéndame

## 🚫 NO hacer sin que se solicite explícitamente

- **NO crear archivos .md de documentación** a menos que el usuario lo pida
- **NO crear scripts** (en `/scripts` o cualquier carpeta) sin solicitud explícita
- **NO crear archivos de guía o tutorial** automáticamente
- **NO crear archivos README** adicionales sin que se pida

## ✅ Preferencias de trabajo

### Código
- Mantener el código MÍNIMO y conciso
- Evitar implementaciones verbosas
- Solo escribir código que contribuya directamente a la solución
- Usar TypeScript para todos los archivos de código
- Seguir las convenciones de React Native y Expo

### Archivos
- Solo crear archivos cuando sean estrictamente necesarios para la funcionalidad
- Preguntar antes de crear nuevos archivos de configuración
- No crear archivos de documentación sin solicitud

### Respuestas
- Ser directo y conciso
- No repetir información innecesariamente
- Evitar resúmenes largos al final
- No usar listas de bullets extensas en resúmenes
- Contrstar siempre en español

## 📱 Estructura del proyecto

### Tecnologías principales
- **Framework:** React Native con Expo (~54.0.0)
- **Navegación:** React Navigation (bottom tabs)
- **UI:** React Native Paper (Material Design 3)
- **Estado:** React hooks (useState, useEffect)
- **API:** Axios para llamadas HTTP
- **Almacenamiento:** AsyncStorage

### Arquitectura
- Pantallas en `/src/screens`
- Componentes reutilizables en `/src/components`
- Configuración en `/src/config`
- Utilidades en `/src/utils`
- Tema centralizado en `/src/styles/theme.ts`

## 🎨 Diseño y UI

### Tema
- **Colores principales:** Morado (#8B5CF6, #a855f7)
- **Modo:** Dark theme exclusivo
- **Fondo:** Negro (#000000)
- **Superficies:** Gris oscuro (#1e1e1e, #2a2a2a)

### Componentes personalizados
- `ModernButton`: Botones con gradiente morado
- `ModernCard`: Tarjetas con bordes y sombras
- `MovieCard`: Tarjetas para películas/series
- `CustomPicker`: Selector personalizado
- `DatePicker`: Selector de fechas

## 🔧 Comandos importantes

### Desarrollo
```bash
npm start              # Iniciar Expo
npm run android        # Abrir en Android
npm run ios            # Abrir en iOS
```

### Build y Deploy
```bash
eas build --platform android --profile production --clear-cache
eas submit --platform android
```

### Perfiles de build
- **production:** AAB para Google Play Store
- **preview:** APK para pruebas internas
- **development:** Development client

## 📦 Información del paquete

- **Package name:** `com.kokialvarez.recomiendame`
- **Bundle ID (iOS):** `com.kokialvarez.recomiendame`
- **Version:** 1.0.0
- **Version Code:** 1

## 🌐 APIs y servicios

### Backend
- **URL:** https://api.recomiendameapp.cl
- **Endpoints principales:**
  - `/users/me` - Información del usuario
  - `/recommendations` - Generar recomendaciones
  - `/ratings` - Calificaciones
  - `/favorites` - Favoritos
  - `/wishlist` - Lista de deseos
  - `/seen` - Contenido visto
  - `/dashboard/stats` - Estadísticas

### TMDB (The Movie Database)
- **API Key:** Configurada en variables de entorno
- **Uso:** Obtener información de películas y series

## 🔐 Variables de entorno

Configuradas en `eas.json` y `.env`:
- `API_URL`: URL del backend
- `TMDB_API_KEY`: Clave de TMDB

## 📱 Pantallas principales

1. **LoginScreen:** Autenticación de usuarios
2. **RegisterScreen:** Registro de nuevos usuarios
3. **HomeScreen:** Dashboard con estadísticas
4. **RecommendationsScreen:** Generador de recomendaciones con IA
5. **FavoritesScreen:** Lista de favoritos
6. **SeenScreen:** Historial de contenido visto
7. **WishListScreen:** Lista de deseos
8. **ProfileScreen:** Perfil y configuración

## 🎯 Funcionalidades clave

- Recomendaciones personalizadas con IA
- Sistema de calificación con estrellas (1-5)
- Organización de contenido (vistos, favoritos, wishlist)
- Estadísticas y análisis de visualización
- Información detallada de películas/series
- Enlaces a trailers de YouTube
- Plataformas de streaming disponibles

## 🐛 Debugging

- Usar `console.log` para debugging básico
- Errores se muestran con Toast messages
- AsyncStorage para verificar datos locales
- Expo DevTools para inspección

## 📝 Convenciones de código

### Nombres
- Componentes: PascalCase (`HomeScreen`, `ModernButton`)
- Archivos: PascalCase para componentes, camelCase para utils
- Variables: camelCase
- Constantes: UPPER_SNAKE_CASE

### Imports
```typescript
// Librerías externas primero
import React from 'react';
import { View } from 'react-native';

// Componentes locales
import ModernButton from '../components/ModernButton';

// Utilidades y configuración
import { theme } from '../styles/theme';
```

### Estilos
- Usar StyleSheet.create()
- Preferir theme.colors sobre colores hardcodeados
- Mantener estilos al final del archivo

## 🚀 Deploy a Play Store

### Checklist antes de build
- [ ] Incrementar versionCode en app.json/app.config.ts
- [ ] Verificar que API_URL apunta a producción
- [ ] Probar en modo preview antes de producción
- [ ] Verificar que no hay console.logs innecesarios

### Proceso de publicación
1. Generar AAB con EAS Build
2. Crear/actualizar app en Play Console
3. Subir AAB
4. Completar información de la tienda
5. Agregar capturas de pantalla
6. Completar clasificación de contenido
7. Enviar para revisión

## ⚠️ Problemas comunes y soluciones

### Error de firma
- Siempre usar el mismo keystore (EAS lo maneja automáticamente)
- No cambiar el package name después de publicar

### Conflictos de paquete
- El package name debe ser único en Play Store
- Actual: `com.kokialvarez.recomiendame`

### Build fallido
- Limpiar caché: `--clear-cache`
- Verificar que todas las dependencias estén instaladas
- Revisar logs en expo.dev

## 💡 Tips

- Usar `eas build:list` para ver builds anteriores
- Usar `eas credentials` para gestionar certificados
- Probar siempre en dispositivos reales antes de publicar
- Mantener las dependencias actualizadas
- Hacer commits frecuentes con mensajes descriptivos
