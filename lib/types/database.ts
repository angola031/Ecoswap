// Tipos de base de datos actualizados basados en el esquema actual

// ===== USUARIO =====
export interface Usuario {
  user_id: number
  nombre: string
  apellido: string
  email: string
  telefono?: string
  password_hash: string
  fecha_nacimiento?: string
  biografia?: string
  foto_perfil?: string
  calificacion_promedio: number
  total_intercambios: number
  eco_puntos: number
  fecha_registro: string
  verificado: boolean
  activo: boolean
  ultima_conexion?: string
  es_admin: boolean
  admin_desde?: string
  fecha_suspension?: string
  motivo_suspension?: string
  pediente_validacion?: boolean
  auth_user_id?: string
}

// ===== PRODUCTO =====
export interface Producto {
  producto_id: number
  user_id: number
  categoria_id: number
  ubicacion_id: number
  titulo: string
  descripcion: string
  estado: 'usado' | 'para_repuestos'
  tipo_transaccion: 'intercambio' | 'venta' | 'donacion'
  precio?: number
  precio_negociable: boolean
  condiciones_intercambio?: string
  que_busco_cambio?: string
  estado_publicacion: 'activo' | 'pausado' | 'intercambiado' | 'eliminado'
  visualizaciones: number
  veces_guardado: number
  fecha_publicacion: string
  fecha_actualizacion: string
  fecha_vencimiento?: string
  estado_validacion: 'pending' | 'approved' | 'rejected'
  fecha_validacion?: string
  validado_por?: number
  comentarios_validacion?: string
  fecha_creacion: string
  etiquetas?: string
  especificaciones?: string
  ciudad_snapshot?: string
  departamento_snapshot?: string
  latitud_snapshot?: number
  longitud_snapshot?: number
  total_likes: number
}

// ===== INTERCAMBIO =====
export interface Intercambio {
  intercambio_id: number
  producto_ofrecido_id: number
  producto_solicitado_id?: number
  usuario_propone_id: number
  usuario_recibe_id: number
  mensaje_propuesta?: string
  monto_adicional: number
  condiciones_adicionales?: string
  estado: 'pendiente' | 'aceptado' | 'rechazado' | 'completado' | 'cancelado'
  fecha_propuesta: string
  fecha_respuesta?: string
  fecha_completado?: string
  motivo_rechazo?: string
  lugar_encuentro?: string
  fecha_encuentro?: string
  notas_encuentro?: string
}

// ===== CHAT =====
export interface Chat {
  chat_id: number
  intercambio_id: number
  fecha_creacion: string
  ultimo_mensaje?: string
  activo: boolean
}

// ===== MENSAJE =====
export interface Mensaje {
  mensaje_id: number
  chat_id: number
  usuario_id: number
  contenido: string
  tipo: 'texto' | 'imagen' | 'ubicacion'
  archivo_url?: string
  leido: boolean
  fecha_envio: string
  fecha_lectura?: string
}

// ===== CATEGORIA =====
export interface Categoria {
  categoria_id: number
  nombre: string
  descripcion?: string
  icono?: string
  activa: boolean
}

// ===== UBICACION =====
export interface Ubicacion {
  ubicacion_id: number
  user_id: number
  pais: string
  departamento: string
  ciudad: string
  barrio?: string
  latitud?: number
  longitud?: number
  es_principal: boolean
  fecha_creacion: string
}

// ===== IMAGEN PRODUCTO =====
export interface ImagenProducto {
  imagen_id: number
  producto_id: number
  url_imagen: string
  descripcion_alt?: string
  es_principal: boolean
  orden: number
  fecha_subida: string
}

// ===== NOTIFICACION =====
export interface Notificacion {
  notificacion_id: number
  usuario_id: number
  tipo: string
  titulo: string
  mensaje: string
  datos_adicionales?: any
  leida: boolean
  fecha_creacion: string
  fecha_lectura?: string
  es_push: boolean
  es_email: boolean
}

// ===== CALIFICACION =====
export interface Calificacion {
  calificacion_id: number
  intercambio_id: number
  calificador_id: number
  calificado_id: number
  puntuacion: number
  comentario?: string
  aspectos_destacados?: string
  recomendaria?: boolean
  fecha_calificacion: string
  es_publica: boolean
}

// ===== FAVORITO =====
export interface Favorito {
  favorito_id: number
  usuario_id: number
  producto_id: number
  fecha_agregado: string
  notas_privadas?: string
}

// ===== REPORTE =====
export interface Reporte {
  reporte_id: number
  reporta_usuario_id: number
  reportado_usuario_id?: number
  producto_id?: number
  intercambio_id?: number
  tipo: 'producto_spam' | 'usuario_sospechoso' | 'intercambio_fraudulento' | 'contenido_inapropiado'
  descripcion: string
  estado: 'pendiente' | 'en_revision' | 'resuelto' | 'desestimado'
  fecha_reporte: string
  fecha_resolucion?: string
  notas_admin?: string
  admin_resuelve_id?: number
  ticket_relacionado_id?: number
}

// ===== TICKET SOPORTE =====
export interface TicketSoporte {
  ticket_id: number
  usuario_id: number
  admin_asignado_id?: number
  asunto: string
  categoria: 'problema_tecnico' | 'reporte_usuario' | 'problema_intercambio' | 'verificacion_cuenta' | 'devolucion' | 'sugerencia' | 'otro'
  prioridad: 'baja' | 'media' | 'alta' | 'critica'
  estado: 'abierto' | 'en_progreso' | 'esperando_usuario' | 'resuelto' | 'cerrado'
  descripcion: string
  solucion?: string
  producto_relacionado_id?: number
  intercambio_relacionado_id?: number
  fecha_creacion: string
  fecha_asignacion?: string
  fecha_primera_respuesta?: string
  fecha_resolucion?: string
  fecha_cierre?: string
  tiempo_resolucion_horas?: number
  satisfaccion_usuario?: number
  tags?: any
  archivos_adjuntos?: any
}

// ===== CONFIGURACION USUARIO =====
export interface ConfiguracionUsuario {
  usuario_id: number
  notif_nuevas_propuestas: boolean
  notif_mensajes: boolean
  notif_actualizaciones: boolean
  notif_newsletter: boolean
  perfil_publico: boolean
  mostrar_ubicacion_exacta: boolean
  mostrar_telefono: boolean
  recibir_mensajes_desconocidos: boolean
  distancia_maxima_km: number
  categorias_interes?: any
  fecha_actualizacion: string
}

// ===== VALIDACION USUARIO =====
export interface ValidacionUsuario {
  validacion_id: number
  usuario_id: number
  admin_validador_id?: number
  tipo_validacion: 'identidad' | 'telefono' | 'direccion' | 'documento' | 'referencias'
  estado: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'expirada'
  documentos_adjuntos?: any
  notas_admin?: string
  motivo_rechazo?: string
  fecha_solicitud: string
  fecha_revision?: string
  fecha_aprobacion?: string
  fecha_expiracion?: string
}

// ===== INSIGNIA =====
export interface Insignia {
  insignia_id: number
  nombre: string
  descripcion?: string
  icono?: string
  color?: string
  criterios_obtencion?: string
  activa: boolean
}

// ===== USUARIO INSIGNIA =====
export interface UsuarioInsignia {
  usuario_id: number
  insignia_id: number
  fecha_obtencion: string
  descripcion_logro?: string
}

// ===== ROL USUARIO =====
export interface RolUsuario {
  rol_id: number
  nombre: string
  descripcion?: string
  permisos?: any
  activo: boolean
  fecha_creacion: string
}

// ===== USUARIO ROL =====
export interface UsuarioRol {
  usuario_id: number
  rol_id: number
  asignado_por?: number
  fecha_asignacion: string
  activo: boolean
}

// ===== TAG =====
export interface Tag {
  tag_id: number
  nombre: string
}

// ===== PRODUCTO TAG =====
export interface ProductoTag {
  producto_id: number
  tag_id: number
}

// ===== PRODUCTO ESPECIFICACION =====
export interface ProductoEspecificacion {
  producto_especificacion_id: number
  producto_id: number
  clave: string
  valor: string
}

// ===== HISTORIAL PRECIO =====
export interface HistorialPrecio {
  historial_id: number
  producto_id: number
  precio_anterior?: number
  precio_nuevo?: number
  fecha_cambio: string
  razon_cambio?: string
}

// ===== ESTADISTICA PRODUCTO =====
export interface EstadisticaProducto {
  producto_id: number
  fecha: string
  visualizaciones_dia: number
  contactos_dia: number
  veces_guardado_dia: number
  propuestas_recibidas_dia: number
}

// ===== VISUALIZACION PRODUCTO =====
export interface VisualizacionProducto {
  visualizacion_id: number
  usuario_id: number
  producto_id: number
  fecha_visualizacion: string
}

// ===== USUARIO SEGUIDO =====
export interface UsuarioSeguido {
  seguidor_id: number
  seguido_id: number
  fecha_inicio: string
  notificaciones_activas: boolean
}

// ===== ACTIVIDAD ADMIN =====
export interface ActividadAdmin {
  actividad_id: number
  admin_id?: number
  accion: string
  modulo: string
  detalles?: any
  ip_address?: string
  user_agent?: string
  fecha_accion: string
}

// ===== CONFIGURACION ADMIN =====
export interface ConfiguracionAdmin {
  config_id: number
  clave: string
  valor: any
  descripcion?: string
  modulo?: string
  modificado_por?: number
  fecha_modificacion: string
}

// ===== CATEGORIA SOPORTE =====
export interface CategoriaSoporte {
  categoria_id: number
  nombre: string
  descripcion?: string
  tiempo_respuesta_objetivo_horas: number
  activa: boolean
  orden_visualizacion: number
}

// ===== MENSAJE SOPORTE =====
export interface MensajeSoporte {
  mensaje_id: number
  ticket_id: number
  remitente_id: number
  tipo_remitente: 'usuario' | 'admin' | 'sistema'
  contenido: string
  es_interno: boolean
  archivos_adjuntos?: any
  fecha_envio: string
  leido: boolean
  fecha_lectura?: string
}

// ===== TIPOS COMPUESTOS PARA APIS =====

// Chat con información completa
export interface ChatWithDetails extends Chat {
  intercambio: Intercambio & {
    producto_ofrecido: Producto & {
      imagenes: ImagenProducto[]
      usuario: Usuario
      categoria: Categoria
    }
    producto_solicitado?: Producto & {
      imagenes: ImagenProducto[]
      usuario: Usuario
      categoria: Categoria
    }
    usuario_propone: Usuario
    usuario_recibe: Usuario
  }
  mensajes: Mensaje[]
}

// Producto con información completa
export interface ProductoWithDetails extends Producto {
  usuario: Usuario
  categoria: Categoria
  ubicacion: Ubicacion
  imagenes: ImagenProducto[]
  tags: Tag[]
  especificaciones: ProductoEspecificacion[]
  estadisticas?: EstadisticaProducto
}

// Usuario con información completa
export interface UsuarioWithDetails extends Usuario {
  ubicaciones: Ubicacion[]
  configuracion: ConfiguracionUsuario
  validaciones: ValidacionUsuario[]
  insignias: UsuarioInsignia[]
  roles: UsuarioRol[]
  estadisticas: {
    total_productos: number
    total_intercambios: number
    calificacion_promedio: number
    eco_puntos: number
  }
}

// Intercambio con información completa
export interface IntercambioWithDetails extends Intercambio {
  producto_ofrecido: ProductoWithDetails
  producto_solicitado?: ProductoWithDetails
  usuario_propone: UsuarioWithDetails
  usuario_recibe: UsuarioWithDetails
  chat?: ChatWithDetails
  calificaciones: Calificacion[]
}

// Respuesta de API estándar
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

// Respuesta paginada
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// Filtros comunes
export interface ProductoFilters {
  categoria_id?: number
  tipo_transaccion?: string
  estado_publicacion?: string
  precio_min?: number
  precio_max?: number
  ubicacion?: string
  busqueda?: string
  user_id?: number
}

export interface UsuarioFilters {
  verificado?: boolean
  activo?: boolean
  es_admin?: boolean
  ubicacion?: string
  busqueda?: string
}

export interface IntercambioFilters {
  estado?: string
  usuario_propone_id?: number
  usuario_recibe_id?: number
  fecha_desde?: string
  fecha_hasta?: string
}

// Tipos para estadísticas
export interface EstadisticasDashboard {
  total_usuarios: number
  total_productos: number
  total_intercambios: number
  total_ingresos: number
  usuarios_nuevos_mes: number
  productos_nuevos_mes: number
  intercambios_completados_mes: number
  calificacion_promedio: number
}

export interface EstadisticasUsuario {
  total_productos: number
  productos_activos: number
  total_intercambios: number
  intercambios_completados: number
  calificacion_promedio: number
  eco_puntos: number
  total_favoritos: number
  visualizaciones_totales: number
}
