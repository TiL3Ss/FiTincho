# 💪 FiTincho - Sistema de Gestión de Rutinas de Fitness

![FiTincho Logo](public/images/aaaau.png)

**FiTincho** es una aplicación web moderna para la gestión de rutinas de fitness construida con Next.js 14, que cuenta con un diseño elegante inspirado en iOS 18 y capacidades integrales de seguimiento de entrenamientos.

🌐 **Demo en vivo**: [https://fitincho.vercel.app](https://fitincho.vercel.app)

## 🌟 Características

### 🏋️ **Gestión de Rutinas**
- Crear, editar y gestionar rutinas de entrenamiento personalizadas
- Organización de horarios semanales con días personalizables
- Seguimiento de ejercicios con series, pesos, repeticiones y tiempos de descanso
- Visualización de progreso con indicadores de rendimiento codificados por colores
- Categorización de grupos musculares con temas de colores

### 👥 **Sistema de Usuarios**
- Autenticación y registro de usuarios
- Perfiles personales con información personalizable
- Control de acceso basado en roles (características de Administrador/Moderador)
- Gestión de rutinas específicas por usuario

### 🎨 **UI/UX Moderna**
- Diseño glassmorphism inspirado en iOS 18
- Diseño responsivo para todos los dispositivos
- Animaciones suaves y micro-interacciones
- Grupos musculares codificados por colores para mejor organización
- Soporte para temas claro/oscuro

### 🔧 **Panel de Administración**
- Operaciones CRUD completas para rutinas
- Sistema de gestión de usuarios
- Gestión de base de datos de grupos musculares y ejercicios
- Operaciones masivas y exportación de datos

## 🚀 Stack Tecnológico

### **Frontend**
- **Next.js 14** - Framework de React con App Router
- **TypeScript** - Desarrollo con tipado seguro
- **Tailwind CSS** - Framework CSS utility-first
- **Heroicons** - Iconos SVG hermosos
- **React Hooks** - Gestión de estado moderna

### **Backend**
- **Next.js API Routes** - Endpoints de API del lado del servidor
- **Turso/LibSQL** - Solución de base de datos edge
- **SQLite** - Base de datos SQL ligera

### **Despliegue y Herramientas**
- **Vercel** - Despliegue en producción
- **Git** - Control de versiones
- **ESLint** - Linting de código
- **Prettier** - Formateo de código

## 📁 Estructura del Proyecto

```
fitincho/
├── app/                          # Next.js App Router
│   ├── admin_board/             # Páginas del panel de administración
│   ├── api/                     # Rutas de API
│   │   ├── admin/               # Endpoints específicos de admin
│   │   │   └── routines/        # APIs de gestión de rutinas
│   │   ├── auth/                # Endpoints de autenticación
│   │   └── users/               # APIs de gestión de usuarios
│   ├── ficha_completa/          # Vista de rutinas del usuario
│   ├── profile/                 # Páginas de perfil de usuario
│   └── globals.css              # Estilos globales
├── components/                   # Componentes UI reutilizables
│   ├── crud/                    # Componentes de operaciones CRUD
│   │   └── list_rutina/         # Componentes de detalles de rutina
│   ├── forms/                   # Componentes de formularios
│   └── ui/                      # Componentes UI base
├── lib/                         # Funciones utilitarias y configuraciones
├── public/                      # Assets estáticos
│   └── images/                  # Assets de imágenes
└── types/                       # Definiciones de tipos TypeScript
```

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Turso (para la base de datos)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Til3ss/fitincho.git
cd fitincho
```

### 2. Instalar dependencias
```bash
npm install
# o
yarn install
```

### 3. Configuración del Entorno
Crear un archivo `.env.local` en el directorio raíz:

```env
# Configuración de Base de Datos
TURSO_DATABASE_URL=tu_url_de_base_de_datos_turso
TURSO_AUTH_TOKEN=tu_token_de_auth_turso

# Configuración NextAuth (si se usa)
NEXTAUTH_URL=https://fitincho.vercel.app
NEXTAUTH_SECRET=tu_secreto_nextauth

# Otras variables de entorno
NODE_ENV=production
```

### 4. Configuración de Base de Datos
Ejecutar el script de inicialización de base de datos:
```bash
npm run db:setup
```

### 5. Ejecutar el servidor de desarrollo
```bash
npm run dev
# o
yarn dev
```

Para desarrollo local, abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

**Aplicación en producción**: [https://fitincho.vercel.app](https://fitincho.vercel.app)

## 🗄️ Esquema de Base de Datos

### Tablas Principales
- **`users`** - Cuentas y perfiles de usuario
- **`routines`** - Definiciones de rutinas de entrenamiento
- **`exercises`** - Base de datos de ejercicios
- **`muscle_groups`** - Categorías de grupos musculares con temas de colores
- **`routine_exercises`** - Tabla de unión que vincula rutinas con ejercicios
- **`routine_muscle_groups`** - Tabla de unión para relaciones rutina-grupo muscular

### Características Clave
- **Grupos musculares codificados por colores** - Cada grupo muscular tiene un campo `color_gm` para tematización de UI
- **Sistema de ejercicios flexible** - Soporte para variantes de ejercicios y notas personalizadas
- **Seguimiento de progreso** - Sistema de puntuación de progreso integrado
- **Roles de usuario** - Soporte para roles de moderador y administrador

## 🎨 Componentes UI

### **Componente RoutineDetails**
```typescript
// Visualización de rutina mejorada con grupos musculares codificados por colores
interface MuscleGroup {
  id: number;
  name: string;
  color_gm: string; // Identificador de tema de color
}
```

### **Componente Header**
- Diseño glassmorphism inspirado en iOS 18
- Navegación responsiva
- Dropdown de perfil de usuario
- Acceso al panel de administración para moderadores

## 🔗 Endpoints de API

### **Rutinas**
- `GET /api/admin/routines` - Listar todas las rutinas
- `POST /api/admin/routines` - Crear nueva rutina
- `GET /api/admin/routines/[id]` - Obtener rutina específica
- `PUT /api/admin/routines/[id]` - Actualizar rutina
- `DELETE /api/admin/routines/[id]` - Eliminar rutina

### **Usuarios**
- `GET /api/users` - Listar usuarios
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Autenticación de usuario

## 🚀 Despliegue

### Despliegue en Vercel (Recomendado)
La aplicación está actualmente desplegada en Vercel y es accesible en:
**https://fitincho.vercel.app**

Para desplegar tu propia versión:
1. Conecta tu repositorio de GitHub a Vercel
2. Configura las variables de entorno en el dashboard de Vercel
3. Despliega automáticamente al hacer push a la rama principal

### Despliegue Manual
```bash
npm run build
npm run start
```

## 🌐 URLs de Producción

- **Aplicación Principal**: https://fitincho.vercel.app
- **Panel de Administración**: https://fitincho.vercel.app/admin_board
- **API Base**: https://fitincho.vercel.app/api

## 🤝 Contribuir

1. Haz fork del repositorio
2. Crea una rama de feature (`git checkout -b feature/caracteristica-increible`)
3. Haz commit de tus cambios (`git commit -m 'Agregar característica increíble'`)
4. Push a la rama (`git push origin feature/caracteristica-increible`)
5. Abre un Pull Request

### Guías de Desarrollo
- Sigue las mejores prácticas de TypeScript
- Usa Tailwind CSS para estilos
- Mantén el sistema de diseño iOS 18
- Escribe mensajes de commit significativos
- Prueba tus cambios exhaustivamente

## 📱 Capturas de Pantalla

### Página Principal
![Página Principal](ruta/a/screenshot-home.png)

### Panel de Administración
![Panel Admin](ruta/a/screenshot-admin.png)

### Vista de Rutina
![Vista Rutina](ruta/a/screenshot-routine.png)

## 🔮 Roadmap

- [ ] Aplicación móvil nativa
- [ ] Integración con wearables
- [ ] Sistema de gamificación
- [ ] Compartir rutinas entre usuarios
- [ ] Análisis avanzado de progreso
- [ ] Integración con redes sociales

## 📝 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🙏 Reconocimientos

- **Equipo de Next.js** - Por el increíble framework de React
- **Tailwind CSS** - Por el framework CSS utility-first
- **Turso** - Por la solución de base de datos edge
- **Heroicons** - Por el hermoso conjunto de iconos
- **Apple** - Por la inspiración de diseño iOS

## 📧 Contacto

**Mantenedor del Proyecto**: Tu Nombre  
**Email**: tu.email@ejemplo.com  
**GitHub**: [@Til3ss](https://github.com/Til3ss)  
**Demo**: [https://fitincho.vercel.app](https://fitincho.vercel.app)

---

⭐ **¡Dale estrella a este repositorio si te resultó útil!**

![GitHub stars](https://img.shields.io/github/stars/Til3ss/fitincho?style=social)
![GitHub forks](https://img.shields.io/github/forks/Til3ss/fitincho?style=social)
![GitHub issues](https://img.shields.io/github/issues/Til3ss/fitincho)
![GitHub license](https://img.shields.io/github/license/Til3ss/fitincho)
![Website](https://img.shields.io/website?url=https%3A//fitincho.vercel.app)