# Configuración de Supabase para EcoSwap Colombia

## 📋 Pasos para configurar la autenticación con Supabase

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se complete la configuración inicial

### 2. Configurar la base de datos

1. Ve a la sección **SQL Editor** en tu dashboard de Supabase
2. Ejecuta el script SQL que proporcionaste para crear las tablas:

```sql
-- Ejecutar todo el script SQL que proporcionaste
-- Esto creará las tablas: USUARIO, UBICACION, CATEGORIA, etc.
```

### 3. Configurar variables de entorno

1. En tu proyecto de Supabase, ve a **Settings** > **API**
2. Copia los siguientes valores:
   - **Project URL**
   - **anon public key**
   - **service_role key** (manténlo secreto)

3. Crea un archivo `.env.local` en la raíz de tu proyecto con:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar políticas de seguridad (RLS)

En Supabase, ve a **Authentication** > **Policies** y crea las siguientes políticas:

#### Para la tabla USUARIO:
```sql
-- Permitir lectura de usuarios activos
CREATE POLICY "Usuarios activos son visibles" ON USUARIO
FOR SELECT USING (activo = true);

-- Permitir inserción de nuevos usuarios
CREATE POLICY "Cualquiera puede registrarse" ON USUARIO
FOR INSERT WITH CHECK (true);

-- Permitir actualización del propio perfil
CREATE POLICY "Usuarios pueden actualizar su perfil" ON USUARIO
FOR UPDATE USING (auth.uid()::text = user_id::text);
```

#### Para la tabla UBICACION:
```sql
-- Permitir lectura de ubicaciones
CREATE POLICY "Ubicaciones son visibles" ON UBICACION
FOR SELECT USING (true);

-- Permitir inserción de ubicaciones
CREATE POLICY "Cualquiera puede crear ubicaciones" ON UBICACION
FOR INSERT WITH CHECK (true);
```

#### Para la tabla CONFIGURACION_USUARIO:
```sql
-- Permitir lectura de configuración
CREATE POLICY "Configuración es visible" ON CONFIGURACION_USUARIO
FOR SELECT USING (true);

-- Permitir inserción de configuración
CREATE POLICY "Cualquiera puede crear configuración" ON CONFIGURACION_USUARIO
FOR INSERT WITH CHECK (true);
```

### 5. Instalar dependencias

```bash
npm install
```

### 6. Ejecutar el proyecto

```bash
npm run dev
```

## 🔧 Funcionalidades implementadas

### ✅ Autenticación
- **Registro de usuarios**: Se guarda en la tabla `USUARIO` con hash de contraseña
- **Login**: Validación contra la base de datos
- **Validación de sesión**: Verificación automática al cargar la página
- **Logout**: Limpieza de sesión local

### ✅ Registro de usuarios
- Se crea el usuario en la tabla `USUARIO`
- Se crea la ubicación principal en la tabla `UBICACION`
- Se crea la configuración por defecto en `CONFIGURACION_USUARIO`
- Validaciones de formulario (contraseñas coinciden, longitud mínima)

### ✅ Validaciones
- Email único en la base de datos
- Contraseñas seguras con hash bcrypt
- Validación de campos requeridos
- Mensajes de error y éxito en la interfaz

## 🚨 Importante

1. **Nunca commites el archivo `.env.local`** - está en `.gitignore`
2. **Mantén segura la `SUPABASE_SERVICE_ROLE_KEY`** - tiene permisos administrativos
3. **Configura las políticas RLS** para seguridad de datos
4. **Usa HTTPS en producción** para proteger las credenciales

## 🐛 Solución de problemas

### Error: "Invalid API key"
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el archivo `.env.local` esté en la raíz del proyecto

### Error: "relation does not exist"
- Ejecuta el script SQL completo en Supabase
- Verifica que las tablas se crearon correctamente

### Error: "permission denied"
- Configura las políticas RLS en Supabase
- Verifica que las políticas permitan las operaciones necesarias

## 📞 Soporte

Si tienes problemas con la configuración, verifica:
1. Que Supabase esté funcionando (dashboard verde)
2. Que las tablas existan en la base de datos
3. Que las variables de entorno estén configuradas
4. Que las políticas RLS estén activas
