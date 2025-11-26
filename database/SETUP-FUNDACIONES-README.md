# Configuración de Sistema de Fundaciones - Ecoswap

## Descripción General
Este documento describe los pasos necesarios para configurar el sistema de registro y verificación de fundaciones, incluyendo:
- Subida de documentos al bucket de Supabase
- Notificaciones a administradores
- Políticas de seguridad

---

## 📋 Pre-requisitos

1. **Bucket de Supabase**: Debe existir un bucket llamado `Ecoswap`
2. **Carpeta**: Dentro del bucket debe existir la carpeta `fundaciones/`
3. **Administradores**: Debe haber al menos un usuario con `es_admin = true` en la tabla `usuario`

---

## 🗄️ Configuración de Base de Datos

### 1. Agregar campos de fundación a la tabla usuario
```bash
# Ejecutar desde la terminal de Supabase SQL Editor
psql -f database/add-fundacion-fields.sql
```

**O ejecutar manualmente:**
```sql
-- Ver archivo: database/add-fundacion-fields.sql
-- Agrega campos: es_fundacion, nombre_fundacion, nit_fundacion, etc.
```

### 2. Agregar campo JSONB para documentos separados
```bash
psql -f database/add-documentos-separados-fundacion.sql
```

**Campos agregados:**
- `documentos_fundacion` (JSONB) - Para múltiples documentos por tipo

---

## 🗂️ Configuración de Storage (Supabase)

### 1. Verificar que el bucket sea público
```sql
-- En Supabase SQL Editor
UPDATE storage.buckets 
SET public = true 
WHERE id = 'Ecoswap';
```

### 2. Aplicar políticas de seguridad
```bash
# Desde Supabase SQL Editor
psql -f database/setup-ecoswap-bucket-policies.sql
```

**Políticas creadas:**
- ✅ Fundaciones pueden subir documentos a `/fundaciones/`
- ✅ Usuarios autenticados pueden ver documentos
- ✅ Fundaciones pueden actualizar sus propios documentos
- ✅ Fundaciones pueden eliminar sus propios documentos

### 3. Verificar políticas
```sql
-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%fundaciones%';
```

---

## 📁 Estructura de Archivos en el Bucket

```
Ecoswap/
├── fundaciones/
│   ├── {user_id}_fundacion_{timestamp}.pdf
│   ├── {user_id}_fundacion_{timestamp}.jpg
│   └── ...
├── productos/
├── mensajes/
├── usuarios/
└── validacion/
```

**Convención de nombres:**
- `{user_id}_fundacion_{timestamp}.{ext}`
- Ejemplo: `123_fundacion_1699999999999.pdf`

---

## 🔔 Sistema de Notificaciones

### Tipos de Notificaciones a Administradores

#### 1. Registro Inicial de Fundación
**Endpoint:** `/api/foundation/register` (POST)
**Tipo:** `nueva_fundacion`
**Trigger:** Cuando una fundación se registra por primera vez

```json
{
  "tipo": "nueva_fundacion",
  "titulo": "🏛️ Nueva fundación registrada",
  "mensaje": "{nombre_fundacion} se ha registrado como fundación y requiere verificación",
  "datos_adicionales": {
    "fundacion_id": 123,
    "nombre_fundacion": "Fundación Ejemplo",
    "nit_fundacion": "900123456-7",
    "tipo_fundacion": "educacion_ninos",
    "estado": "pendiente_documentos"
  }
}
```

#### 2. Documentos Subidos
**Endpoint:** `/api/foundation/notify-document` (POST)
**Tipo:** `documentos_fundacion_subidos`
**Trigger:** Cuando una fundación sube documentación

```json
{
  "tipo": "documentos_fundacion_subidos",
  "titulo": "📄 Documentos de fundación pendientes",
  "mensaje": "{nombre_fundacion} ha subido documentación para verificación",
  "datos_adicionales": {
    "fundacion_id": 123,
    "fundacion_nombre": "Fundación Ejemplo",
    "usuario_nombre": "Juan Pérez",
    "fecha_subida": "2024-01-15T10:30:00Z",
    "accion_requerida": "revisar_documentos"
  }
}
```

---

## 🔄 Flujo de Registro y Verificación

### Paso 1: Registro de Fundación
1. Usuario marca checkbox "Registrarme como Fundación"
2. Completa campos: nombre, NIT, tipo, descripción
3. Al verificar OTP → Llama a `/api/foundation/register`
4. Se actualiza `usuario` con `es_fundacion = true`
5. **Notificación enviada a admins** (tipo: `nueva_fundacion`)

### Paso 2: Subida de Documentos
1. Fundación va a su perfil → Tab "Verificación"
2. Sube documentos (PDF/JPG/PNG, máx 5MB)
3. Archivo se guarda en `Ecoswap/fundaciones/`
4. Se actualiza `documento_fundacion` o `documentos_fundacion`
5. **Notificación enviada a admins** (tipo: `documentos_fundacion_subidos`)

### Paso 3: Verificación por Admin
1. Admin recibe notificación en su panel
2. Admin accede a `/admin/fundaciones`
3. Revisa documentos (Acta, Estatutos, PRE-RUT, etc.)
4. Aprueba o rechaza
5. Si aprueba → `fundacion_verificada = true`
6. Fundación recibe notificación de verificación

---

## 📄 Documentos Requeridos para Verificación

### Documentos Principales (Obligatorios)
1. **Acta de Constitución** (o documento privado/escritura pública)
2. **Estatutos** de la fundación
3. **PRE-RUT** expedido por la DIAN

### Documentos Adicionales (Recomendados)
4. **Cartas de aceptación** de cargos (Junta Directiva, Revisor Fiscal)
5. **Formulario RUES** (Registro Único Empresarial y Social)

---

## 🧪 Testing

### 1. Verificar que el bucket funciona
```bash
# Desde el navegador o Postman
GET https://{project}.supabase.co/storage/v1/object/public/Ecoswap/fundaciones/test.txt
```

### 2. Probar subida de documento
1. Registrarse como fundación
2. Ir a Perfil → Verificación
3. Subir un PDF de prueba
4. Verificar en Supabase Storage que el archivo apareció

### 3. Verificar notificaciones
```sql
-- Consultar últimas notificaciones de admins
SELECT * FROM notificacion 
WHERE tipo IN ('nueva_fundacion', 'documentos_fundacion_subidos')
ORDER BY fecha_creacion DESC 
LIMIT 10;
```

---

## 🐛 Troubleshooting

### Error: "Failed to upload to storage"
**Causa:** Políticas de RLS no configuradas
**Solución:** Ejecutar `database/setup-ecoswap-bucket-policies.sql`

### Error: "Bucket not found"
**Causa:** El bucket no se llama `Ecoswap` o no existe
**Solución:** 
```sql
-- Verificar buckets existentes
SELECT id, name, public FROM storage.buckets;

-- Si no existe, crear:
INSERT INTO storage.buckets (id, name, public)
VALUES ('Ecoswap', 'Ecoswap', true);
```

### Notificaciones no llegan a admins
**Causa:** No hay usuarios con `es_admin = true`
**Solución:**
```sql
-- Crear un admin
UPDATE usuario 
SET es_admin = true, admin_desde = NOW() 
WHERE user_id = {tu_user_id};
```

---

## 📊 Consultas Útiles

### Ver todas las fundaciones pendientes de verificación
```sql
SELECT user_id, nombre, nombre_fundacion, nit_fundacion, 
       documento_fundacion, fundacion_verificada, fecha_registro
FROM usuario 
WHERE es_fundacion = true 
  AND fundacion_verificada = false
ORDER BY fecha_registro DESC;
```

### Ver documentos subidos
```sql
SELECT user_id, nombre_fundacion, 
       documento_fundacion,
       documentos_fundacion
FROM usuario 
WHERE es_fundacion = true 
  AND (documento_fundacion IS NOT NULL OR documentos_fundacion IS NOT NULL);
```

### Estadísticas de verificación
```sql
SELECT 
  COUNT(*) FILTER (WHERE fundacion_verificada = true) as verificadas,
  COUNT(*) FILTER (WHERE fundacion_verificada = false AND documento_fundacion IS NOT NULL) as pendientes,
  COUNT(*) FILTER (WHERE fundacion_verificada = false AND documento_fundacion IS NULL) as sin_documentos,
  COUNT(*) as total
FROM usuario 
WHERE es_fundacion = true;
```

---

## 🔐 Seguridad

### Consideraciones Importantes
1. ✅ Los documentos son **públicos** para que admins puedan revisarlos
2. ✅ Solo usuarios **autenticados** pueden subir archivos
3. ✅ Los archivos solo se pueden subir a `/fundaciones/`
4. ✅ Límite de tamaño: **5MB por archivo**
5. ✅ Formatos permitidos: **PDF, JPG, PNG**

### Mejoras Futuras
- [ ] Agregar escaneo de virus a archivos subidos
- [ ] Implementar expiración de documentos (renovación anual)
- [ ] Agregar watermark/sello de tiempo a documentos
- [ ] Implementar OCR para validar contenido de documentos

---

## 📞 Soporte

Para problemas o dudas, contactar al equipo de desarrollo de Ecoswap.

**Archivos relacionados:**
- `components/profile/ProfileModule.tsx` - UI de perfil y subida
- `app/api/foundation/register/route.ts` - Registro de fundaciones
- `app/api/foundation/notify-document/route.ts` - Notificaciones
- `database/add-fundacion-fields.sql` - Schema de fundaciones
- `database/setup-ecoswap-bucket-policies.sql` - Políticas de Storage

