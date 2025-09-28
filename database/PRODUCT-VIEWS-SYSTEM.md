# Sistema de Visualizaciones de Productos

## 🎯 Objetivo
Implementar un sistema que registre visualizaciones de productos de forma única por usuario, incrementando el contador `visualizaciones` en la tabla `producto` solo una vez por usuario por producto.

## 🏗️ Arquitectura del Sistema

### **1. Tabla `visualizacion_producto`**
```sql
CREATE TABLE visualizacion_producto (
  visualizacion_id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuario(user_id),
  producto_id INTEGER REFERENCES producto(producto_id),
  fecha_visualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(usuario_id, producto_id) -- Evita duplicados
);
```

### **2. Tabla `estadistica_producto`**
```sql
CREATE TABLE estadistica_producto (
  producto_id INTEGER NOT NULL,
  fecha DATE NOT NULL,
  visualizaciones_dia INTEGER DEFAULT 0,
  contactos_dia INTEGER DEFAULT 0,
  veces_guardado_dia INTEGER DEFAULT 0,
  propuestas_recibidas_dia INTEGER DEFAULT 0,
  PRIMARY KEY (producto_id, fecha),
  FOREIGN KEY (producto_id) REFERENCES producto(producto_id) ON DELETE CASCADE
);
```

### **3. Funciones de Base de Datos**

#### **`register_product_view(usuario_id, producto_id)`**
- ✅ **Verifica** si el usuario ya vio el producto
- ✅ **Inserta** nueva visualización si no existe
- ✅ **Incrementa** contador en tabla `producto`
- ✅ **Actualiza** estadísticas diarias en tabla `estadistica_producto`
- ✅ **Retorna** `true` si es nueva visualización, `false` si ya existía

#### **`get_unique_views_count(producto_id)`**
- ✅ **Cuenta** visualizaciones únicas por producto
- ✅ **Retorna** número de usuarios únicos que vieron el producto

#### **`has_user_viewed_product(usuario_id, producto_id)`**
- ✅ **Verifica** si un usuario específico ya vio un producto
- ✅ **Retorna** `true` si ya vio, `false` si no

#### **`get_daily_product_stats(producto_id, fecha)`**
- ✅ **Obtiene** estadísticas diarias de un producto
- ✅ **Retorna** visualizaciones, contactos, guardados y propuestas del día
- ✅ **Fecha por defecto**: día actual

### **3. API Endpoints**

#### **`POST /api/products/[id]/view`**
- ✅ **Registra** visualización del producto
- ✅ **Valida** autenticación del usuario
- ✅ **Evita** duplicados automáticamente
- ✅ **Incrementa** contador solo si es nueva visualización

#### **`GET /api/products/[id]/view`**
- ✅ **Obtiene** estadísticas de visualización
- ✅ **Retorna** contador de visualizaciones únicas
- ✅ **Indica** si el usuario actual ya vio el producto

### **4. Frontend Integration**

#### **Página de Detalle del Producto**
- ✅ **Registra** visualización automáticamente al cargar
- ✅ **Solo** para usuarios autenticados
- ✅ **Logs** detallados para debugging
- ✅ **No interfiere** con la experiencia del usuario

## 🔄 Flujo Completo

### **Al Cargar un Producto:**

1. ✅ **Usuario navega** a `/producto/[id]`
2. ✅ **Frontend carga** datos del producto
3. ✅ **Frontend verifica** si hay sesión activa
4. ✅ **Frontend llama** a `POST /api/products/[id]/view`
5. ✅ **API valida** autenticación del usuario
6. ✅ **API verifica** si ya vio el producto
7. ✅ **Si es nueva visualización**:
   - Inserta en `visualizacion_producto`
   - Incrementa `producto.visualizaciones`
   - Actualiza `estadistica_producto.visualizaciones_dia`
8. ✅ **Si ya vio el producto**: No hace nada
9. ✅ **API retorna** resultado al frontend
10. ✅ **Frontend registra** logs de debug

### **Estados de Visualización:**

#### **Primera Visita:**
- ✅ **Nueva visualización** registrada
- ✅ **Contador incrementa** en 1
- ✅ **Log**: "Visualización registrada exitosamente"

#### **Visitas Subsecuentes:**
- ✅ **No se registra** nueva visualización
- ✅ **Contador no cambia**
- ✅ **Log**: "Usuario ya había visto este producto"

#### **Usuario No Autenticado:**
- ✅ **No se registra** visualización
- ✅ **Contador no cambia**
- ✅ **Log**: "No hay sesión, no se registra visualización"

## 🎨 Beneficios del Sistema

### **1. Estadísticas Precisas**
- ✅ **Contador real** de usuarios únicos
- ✅ **No inflación** por múltiples visitas del mismo usuario
- ✅ **Métricas confiables** para análisis

### **2. Performance Optimizada**
- ✅ **Una consulta** por visualización
- ✅ **Trigger automático** para contador
- ✅ **Índices únicos** para búsquedas rápidas

### **3. Escalabilidad**
- ✅ **Maneja** millones de visualizaciones
- ✅ **Consultas eficientes** con índices
- ✅ **Separación** de responsabilidades

### **4. Flexibilidad**
- ✅ **Fácil agregar** más datos (IP, dispositivo, etc.)
- ✅ **Consultas complejas** posibles
- ✅ **Integración** con analytics

## 🧪 Testing

### **Scripts de Prueba:**
- ✅ **`database/test-product-views-system.sql`** - Prueba completa del sistema
- ✅ **`database/implement-product-views-system.sql`** - Implementación completa

### **Casos de Prueba:**
1. ✅ **Primera visita**: Registra visualización, incrementa contador
2. ✅ **Visita repetida**: No registra, contador no cambia
3. ✅ **Usuario no autenticado**: No registra visualización
4. ✅ **Usuario propietario**: Registra visualización normalmente
5. ✅ **Producto inexistente**: Maneja error graciosamente

## 🔧 Archivos Implementados

### **Base de Datos:**
- ✅ **`database/implement-product-views-system.sql`** - Funciones y triggers
- ✅ **`database/test-product-views-system.sql`** - Scripts de prueba

### **Backend:**
- ✅ **`app/api/products/[id]/view/route.ts`** - API de visualizaciones

### **Frontend:**
- ✅ **`app/producto/[id]/page.tsx`** - Integración con API

## 🚀 Instrucciones de Despliegue

### **1. Ejecutar Script de Base de Datos**
```sql
-- Ejecutar en Supabase SQL Editor
-- Contenido del archivo: database/implement-product-views-system.sql
```

### **2. Verificar Implementación**
```sql
-- Verificar que las funciones existen
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('register_product_view', 'get_unique_views_count', 'has_user_viewed_product');
```

### **3. Probar Funcionalidad**
1. **Navegar** a cualquier producto
2. **Abrir DevTools Console**
3. **Verificar logs** de visualización
4. **Refrescar página** y verificar que no incrementa contador
5. **Cambiar usuario** y verificar que incrementa contador

## 📊 Métricas y Analytics

### **Consultas Útiles:**
```sql
-- Productos más vistos
SELECT p.titulo, COUNT(DISTINCT v.usuario_id) as visualizaciones_unicas
FROM producto p
LEFT JOIN visualizacion_producto v ON p.producto_id = v.producto_id
GROUP BY p.producto_id, p.titulo
ORDER BY visualizaciones_unicas DESC;

-- Usuarios más activos
SELECT u.nombre, u.apellido, COUNT(DISTINCT v.producto_id) as productos_vistos
FROM usuario u
JOIN visualizacion_producto v ON u.user_id = v.usuario_id
GROUP BY u.user_id, u.nombre, u.apellido
ORDER BY productos_vistos DESC;
```

## ✅ Estado: IMPLEMENTADO

El sistema de visualizaciones está completamente implementado y funcional:

- ✅ **Tabla** `visualizacion_producto` creada
- ✅ **Funciones** de base de datos implementadas
- ✅ **API** de visualizaciones funcional
- ✅ **Frontend** integrado automáticamente
- ✅ **Logs** de debug completos
- ✅ **Scripts** de prueba disponibles
- ✅ **Documentación** completa

**El sistema registra visualizaciones únicas por usuario y mantiene contadores precisos en tiempo real.**
