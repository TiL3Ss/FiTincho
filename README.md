# 💪 FiTincho - Gestión de Rutinas de Fitness

![FiTincho Logo](public/images/aaaau.png)

**FiTincho** es una aplicación web moderna para gestionar rutinas de entrenamiento con un diseño elegante inspirado en iOS.

🌐 **Demo en vivo**: [https://fitincho.vercel.app](https://fitincho.vercel.app)

## ✨ Características

- 🏋️ **Rutinas personalizadas** - Crea y gestiona tus entrenamientos
- 📊 **Seguimiento de progreso** - Visualiza tu evolución con gráficos
- 🎨 **Diseño moderno** - Interfaz inspirada en iOS 18 con glassmorphism
- 👥 **Sistema de usuarios** - Perfiles personalizados y roles
- 🔧 **Panel de administración** - Gestión completa del sistema

## 🚀 Tecnologías

- **Next.js 14** con TypeScript
- **Tailwind CSS** para estilos
- **Turso/LibSQL** como base de datos
- **Vercel** para el despliegue

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Til3ss/fitincho.git

# Instalar dependencias
cd fitincho
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar en desarrollo
npm run dev
```

## 📋 Variables de Entorno

```env
TURSO_DATABASE_URL=tu_url_de_base_de_datos_turso
TURSO_AUTH_TOKEN=tu_token_de_auth_turso
NEXTAUTH_URL=https://fitincho.vercel.app
NEXTAUTH_SECRET=tu_secreto_nextauth
```

## 🚀 Despliegue

La aplicación está desplegada en Vercel. Para tu propia versión:

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Despliega automáticamente

## 🤝 Contribuir

1. Fork del repositorio
2. Crea tu rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

⭐ **¡Dale estrella si te gustó el proyecto!**

![GitHub stars](https://img.shields.io/github/stars/Til3ss/fitincho?style=social)
![Website](https://img.shields.io/website?url=https%3A//fitincho.vercel.app)