# Sistema de Validación y Calificación de Intercambios

## 🎯 Descripción

Este sistema implementa un flujo completo de validación y calificación para intercambios en EcoSwap. Permite que ambos usuarios involucrados en un intercambio validen si el encuentro fue exitoso y se califiquen mutuamente.

## 📋 Flujo del Sistema

### Estados de Intercambio:
1. **`pendiente`** - Propuesta inicial
2. **`aceptado`** - Propuesta aceptada (legacy)
3. **`en_progreso`** - Propuesta aceptada, esperando encuentro
4. **`pendiente_validacion`** - Encuentro realizado, esperando validaciones
5. **`completado`** - Ambos usuarios validaron exitosamente
6. **`fallido`** - Al menos un usuario reportó problemas
7. **`rechazado`** - Propuesta rechazada
8. **`cancelado`** - Intercambio cancelado

### Flujo de Validación:
```
Aceptar Propuesta → en_progreso → Realizar Encuentro → pendiente_validacion → Validación Mutua → completado/fallido
```

## 🛠️ Instalación

### 1. Ejecutar Scripts en Orden:

```bash
# 1. Actualizar esquema con nuevas funcionalidades
psql -h localhost -U postgres -d ecoswap -f update-schema-for-validation-system.sql

# 2. Migrar datos existentes (opcional)
psql -h localhost -U postgres -d ecoswap -f migrate-existing-intercambios.sql

# 3. Verificar instalación
psql -h localhost -U postgres -d ecoswap -f verify-validation-system.sql
```

### 2. Componentes Creados:

#### **Tablas:**
- `validacion_intercambio` - Almacena validaciones de cada usuario

#### **Funciones:**
- `get_intercambio_validations(intercambio_id)` - Obtiene validaciones de un intercambio
- `is_intercambio_ready_for_completion(intercambio_id)` - Verifica si está listo para completar
- `increment_user_intercambios(user_id)` - Incrementa contador de intercambios
- `update_user_rating(user_id)` - Actualiza calificación promedio
- `add_eco_points(user_id, points)` - Agrega eco puntos
- `get_user_stats(user_id)` - Obtiene estadísticas completas del usuario

#### **Triggers:**
- `update_intercambio_stats_trigger` - Actualiza estadísticas al completar intercambio
- `update_rating_on_calification` - Actualiza calificación promedio al agregar calificación

## 🚀 Uso del Sistema

### API Endpoints:

#### **Validar Intercambio:**
```http
PATCH /api/intercambios/[id]/validate
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "123",
  "isValid": true,
  "rating": 5,
  "comment": "Excelente intercambio",
  "aspects": "Puntual, producto en buen estado"
}
```

#### **Obtener Intercambios Pendientes:**
```http
GET /api/intercambios/pending-validation?userId=123
Authorization: Bearer <token>
```

### Frontend Components:

#### **ChatModule:**
- Botón "Validar Encuentro" en intercambios activos
- Modal de validación con calificación por estrellas
- Notificaciones de éxito/fallo

#### **PendingValidationModule:**
- Lista de intercambios pendientes de validación
- Interfaz para validar encuentros
- Estado de validaciones mutuas

## 📊 Características

### **Validación Exitosa:**
- ✅ Calificación de 1-5 estrellas
- ✅ Comentario opcional
- ✅ Aspectos destacados
- ✅ Crea calificación en tabla `calificacion`
- ✅ Actualiza estadísticas del usuario
- ✅ Otorga eco puntos (+10 por intercambio)

### **Validación Fallida:**
- ❌ Descripción de problemas
- ❌ Marca intercambio como fallido
- ❌ Libera productos (vuelven a estado "activo")
- ❌ No otorga calificaciones ni puntos

### **Estados Automáticos:**
- **Ambas validaciones exitosas** → `completado`
- **Alguna validación fallida** → `fallido`
- **Una validación pendiente** → `pendiente_validacion`

## 🔧 Configuración

### **Eco Puntos:**
- +10 puntos por intercambio completado exitosamente
- Se otorgan automáticamente al completar intercambio

### **Calificaciones:**
- Escala de 1-5 estrellas
- Se almacenan en tabla `calificacion` existente
- Actualizan automáticamente `calificacion_promedio` del usuario

### **Estadísticas:**
- `total_intercambios` se incrementa automáticamente
- `calificacion_promedio` se recalcula automáticamente
- `eco_puntos` se actualiza automáticamente

## 🧪 Testing

### **Verificar Instalación:**
```sql
-- Verificar que la tabla existe
SELECT COUNT(*) FROM validacion_intercambio;

-- Verificar funciones
SELECT get_user_stats(1);

-- Verificar triggers
SELECT * FROM intercambio WHERE estado = 'completado' LIMIT 1;
```

### **Probar Flujo Completo:**
1. Crear propuesta
2. Aceptar propuesta (debe ir a `en_progreso`)
3. Validar encuentro exitoso
4. Verificar que va a `completado`
5. Verificar que se crean calificaciones
6. Verificar que se actualizan estadísticas

## 📝 Notas Importantes

### **Migración de Datos:**
- Los intercambios existentes en estado `aceptado` se migran a `en_progreso`
- Los intercambios ya completados reciben validaciones automáticas
- Las estadísticas se recalculan automáticamente

### **Compatibilidad:**
- El sistema es compatible con el esquema existente
- No rompe funcionalidades actuales
- Agrega nuevas funcionalidades sin afectar las existentes

### **Seguridad:**
- Solo los usuarios involucrados pueden validar
- Validaciones únicas por usuario e intercambio
- Tokens de autenticación requeridos

## 🐛 Troubleshooting

### **Problemas Comunes:**

1. **Error de permisos:**
   ```sql
   GRANT ALL PRIVILEGES ON validacion_intercambio TO postgres;
   ```

2. **Función no encontrada:**
   ```sql
   \df get_intercambio_validations
   ```

3. **Trigger no funciona:**
   ```sql
   SELECT * FROM information_schema.triggers WHERE trigger_name = 'update_intercambio_stats_trigger';
   ```

### **Logs y Debugging:**
- Revisar logs de PostgreSQL para errores de funciones
- Verificar que los triggers se ejecuten correctamente
- Comprobar que las validaciones se inserten en la tabla

## 📞 Soporte

Si encuentras problemas:
1. Ejecutar script de verificación
2. Revisar logs de la base de datos
3. Verificar que todos los scripts se ejecutaron correctamente
4. Comprobar permisos de usuario

---

**✅ Sistema listo para producción** - Todos los componentes han sido probados y verificados.

