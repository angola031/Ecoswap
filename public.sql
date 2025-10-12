-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.actividad_admin (
  actividad_id integer NOT NULL DEFAULT nextval('actividad_admin_actividad_id_seq'::regclass),
  admin_id integer,
  accion character varying NOT NULL,
  modulo character varying NOT NULL,
  detalles jsonb,
  ip_address inet,
  user_agent text,
  fecha_accion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT actividad_admin_pkey PRIMARY KEY (actividad_id),
  CONSTRAINT actividad_admin_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.calificacion (
  calificacion_id integer NOT NULL DEFAULT nextval('calificacion_calificacion_id_seq'::regclass),
  intercambio_id integer,
  calificador_id integer,
  calificado_id integer,
  puntuacion integer NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
  comentario text,
  aspectos_destacados text,
  recomendaria boolean,
  fecha_calificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  es_publica boolean DEFAULT true,
  CONSTRAINT calificacion_pkey PRIMARY KEY (calificacion_id),
  CONSTRAINT calificacion_intercambio_id_fkey FOREIGN KEY (intercambio_id) REFERENCES public.intercambio(intercambio_id),
  CONSTRAINT calificacion_calificador_id_fkey FOREIGN KEY (calificador_id) REFERENCES public.usuario(user_id),
  CONSTRAINT calificacion_calificado_id_fkey FOREIGN KEY (calificado_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.categoria (
  categoria_id integer NOT NULL DEFAULT nextval('categoria_categoria_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  icono character varying,
  activa boolean DEFAULT true,
  CONSTRAINT categoria_pkey PRIMARY KEY (categoria_id)
);
CREATE TABLE public.categoria_soporte (
  categoria_id integer NOT NULL DEFAULT nextval('categoria_soporte_categoria_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  tiempo_respuesta_objetivo_horas integer DEFAULT 24,
  activa boolean DEFAULT true,
  orden_visualizacion integer DEFAULT 0,
  CONSTRAINT categoria_soporte_pkey PRIMARY KEY (categoria_id)
);
CREATE TABLE public.chat (
  chat_id integer NOT NULL DEFAULT nextval('chat_chat_id_seq'::regclass),
  intercambio_id integer,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  ultimo_mensaje timestamp without time zone,
  activo boolean DEFAULT true,
  CONSTRAINT chat_pkey PRIMARY KEY (chat_id),
  CONSTRAINT chat_intercambio_id_fkey FOREIGN KEY (intercambio_id) REFERENCES public.intercambio(intercambio_id)
);
CREATE TABLE public.configuracion_admin (
  config_id integer NOT NULL DEFAULT nextval('configuracion_admin_config_id_seq'::regclass),
  clave character varying NOT NULL UNIQUE,
  valor jsonb NOT NULL,
  descripcion text,
  modulo character varying,
  modificado_por integer,
  fecha_modificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT configuracion_admin_pkey PRIMARY KEY (config_id),
  CONSTRAINT configuracion_admin_modificado_por_fkey FOREIGN KEY (modificado_por) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.configuracion_usuario (
  usuario_id integer NOT NULL,
  notif_nuevas_propuestas boolean DEFAULT true,
  notif_mensajes boolean DEFAULT true,
  notif_actualizaciones boolean DEFAULT false,
  notif_newsletter boolean DEFAULT true,
  perfil_publico boolean DEFAULT true,
  mostrar_ubicacion_exacta boolean DEFAULT false,
  mostrar_telefono boolean DEFAULT false,
  recibir_mensajes_desconocidos boolean DEFAULT true,
  distancia_maxima_km integer DEFAULT 50,
  categorias_interes jsonb,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT configuracion_usuario_pkey PRIMARY KEY (usuario_id),
  CONSTRAINT configuracion_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.estadistica_producto (
  producto_id integer NOT NULL,
  fecha date NOT NULL,
  visualizaciones_dia integer DEFAULT 0,
  contactos_dia integer DEFAULT 0,
  veces_guardado_dia integer DEFAULT 0,
  propuestas_recibidas_dia integer DEFAULT 0,
  CONSTRAINT estadistica_producto_pkey PRIMARY KEY (producto_id, fecha),
  CONSTRAINT estadistica_producto_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(producto_id)
);
CREATE TABLE public.favorito (
  favorito_id integer NOT NULL DEFAULT nextval('favorito_favorito_id_seq'::regclass),
  usuario_id integer,
  producto_id integer,
  fecha_agregado timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  notas_privadas text,
  CONSTRAINT favorito_pkey PRIMARY KEY (favorito_id),
  CONSTRAINT favorito_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id),
  CONSTRAINT favorito_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(producto_id)
);
CREATE TABLE public.historial_precio (
  historial_id integer NOT NULL DEFAULT nextval('historial_precio_historial_id_seq'::regclass),
  producto_id integer,
  precio_anterior numeric,
  precio_nuevo numeric,
  fecha_cambio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  razon_cambio character varying,
  CONSTRAINT historial_precio_pkey PRIMARY KEY (historial_id),
  CONSTRAINT historial_precio_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(producto_id)
);
CREATE TABLE public.imagen_producto (
  imagen_id integer NOT NULL DEFAULT nextval('imagen_producto_imagen_id_seq'::regclass),
  producto_id integer,
  url_imagen character varying NOT NULL,
  descripcion_alt character varying,
  es_principal boolean DEFAULT false,
  orden integer DEFAULT 1,
  fecha_subida timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT imagen_producto_pkey PRIMARY KEY (imagen_id),
  CONSTRAINT imagen_producto_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(producto_id)
);
CREATE TABLE public.insignia (
  insignia_id integer NOT NULL DEFAULT nextval('insignia_insignia_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  icono character varying,
  color character varying,
  criterios_obtencion text,
  activa boolean DEFAULT true,
  CONSTRAINT insignia_pkey PRIMARY KEY (insignia_id)
);
CREATE TABLE public.intercambio (
  intercambio_id integer NOT NULL DEFAULT nextval('intercambio_intercambio_id_seq'::regclass),
  producto_ofrecido_id integer,
  producto_solicitado_id integer,
  usuario_propone_id integer,
  usuario_recibe_id integer,
  mensaje_propuesta text,
  monto_adicional numeric DEFAULT 0,
  condiciones_adicionales text,
  estado character varying DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['pendiente'::character varying::text, 'aceptado'::character varying::text, 'rechazado'::character varying::text, 'completado'::character varying::text, 'cancelado'::character varying::text, 'en_progreso'::character varying::text, 'pendiente_validacion'::character varying::text, 'fallido'::character varying::text])),
  fecha_propuesta timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_respuesta timestamp without time zone,
  fecha_completado timestamp without time zone,
  motivo_rechazo text,
  lugar_encuentro character varying,
  fecha_encuentro timestamp without time zone,
  notas_encuentro text,
  CONSTRAINT intercambio_pkey PRIMARY KEY (intercambio_id),
  CONSTRAINT intercambio_usuario_propone_id_fkey FOREIGN KEY (usuario_propone_id) REFERENCES public.usuario(user_id),
  CONSTRAINT intercambio_usuario_recibe_id_fkey FOREIGN KEY (usuario_recibe_id) REFERENCES public.usuario(user_id),
  CONSTRAINT intercambio_producto_ofrecido_id_fkey FOREIGN KEY (producto_ofrecido_id) REFERENCES public.producto(producto_id),
  CONSTRAINT intercambio_producto_solicitado_id_fkey FOREIGN KEY (producto_solicitado_id) REFERENCES public.producto(producto_id)
);
CREATE TABLE public.mensaje (
  mensaje_id integer NOT NULL DEFAULT nextval('mensaje_mensaje_id_seq'::regclass),
  chat_id integer,
  usuario_id integer,
  contenido text NOT NULL,
  tipo character varying DEFAULT 'texto'::character varying CHECK (tipo::text = ANY (ARRAY['texto'::character varying, 'imagen'::character varying, 'ubicacion'::character varying]::text[])),
  archivo_url character varying,
  leido boolean DEFAULT false,
  fecha_envio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_lectura timestamp without time zone,
  CONSTRAINT mensaje_pkey PRIMARY KEY (mensaje_id),
  CONSTRAINT mensaje_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chat(chat_id),
  CONSTRAINT mensaje_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.mensaje_soporte (
  mensaje_id integer NOT NULL DEFAULT nextval('mensaje_soporte_mensaje_id_seq'::regclass),
  ticket_id integer,
  remitente_id integer,
  tipo_remitente character varying NOT NULL CHECK (tipo_remitente::text = ANY (ARRAY['usuario'::character varying, 'admin'::character varying, 'sistema'::character varying]::text[])),
  contenido text NOT NULL,
  es_interno boolean DEFAULT false,
  archivos_adjuntos jsonb,
  fecha_envio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  leido boolean DEFAULT false,
  fecha_lectura timestamp without time zone,
  CONSTRAINT mensaje_soporte_pkey PRIMARY KEY (mensaje_id),
  CONSTRAINT mensaje_soporte_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.ticket_soporte(ticket_id),
  CONSTRAINT mensaje_soporte_remitente_id_fkey FOREIGN KEY (remitente_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.notificacion (
  notificacion_id integer NOT NULL DEFAULT nextval('notificacion_notificacion_id_seq'::regclass),
  usuario_id integer,
  tipo character varying NOT NULL,
  titulo character varying NOT NULL,
  mensaje text NOT NULL,
  datos_adicionales jsonb,
  leida boolean DEFAULT false,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_lectura timestamp without time zone,
  es_push boolean DEFAULT true,
  es_email boolean DEFAULT false,
  CONSTRAINT notificacion_pkey PRIMARY KEY (notificacion_id),
  CONSTRAINT notificacion_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.producto (
  producto_id integer NOT NULL DEFAULT nextval('producto_producto_id_seq'::regclass),
  user_id integer,
  categoria_id integer,
  ubicacion_id integer,
  titulo character varying NOT NULL,
  descripcion text NOT NULL,
  estado character varying DEFAULT 'usado'::character varying CHECK (estado::text = ANY (ARRAY['usado'::character varying, 'para_repuestos'::character varying]::text[])),
  tipo_transaccion character varying NOT NULL CHECK (tipo_transaccion::text = ANY (ARRAY['intercambio'::character varying, 'venta'::character varying, 'donacion'::character varying]::text[])),
  precio numeric,
  precio_negociable boolean DEFAULT false,
  condiciones_intercambio text,
  que_busco_cambio text,
  estado_publicacion character varying DEFAULT 'activo'::character varying CHECK (estado_publicacion::text = ANY (ARRAY['activo'::character varying, 'pausado'::character varying, 'intercambiado'::character varying, 'eliminado'::character varying]::text[])),
  visualizaciones integer DEFAULT 0,
  veces_guardado integer DEFAULT 0,
  fecha_publicacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_vencimiento timestamp without time zone,
  estado_validacion character varying DEFAULT 'pending'::character varying CHECK (estado_validacion::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying]::text[])),
  fecha_validacion timestamp with time zone,
  validado_por integer,
  comentarios_validacion text,
  fecha_creacion timestamp with time zone DEFAULT now(),
  etiquetas text,
  especificaciones character varying,
  ciudad_snapshot character varying,
  departamento_snapshot character varying,
  latitud_snapshot numeric,
  longitud_snapshot numeric,
  total_likes integer DEFAULT 0,
  CONSTRAINT producto_pkey PRIMARY KEY (producto_id),
  CONSTRAINT producto_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuario(user_id),
  CONSTRAINT producto_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria(categoria_id),
  CONSTRAINT producto_ubicacion_id_fkey FOREIGN KEY (ubicacion_id) REFERENCES public.ubicacion(ubicacion_id),
  CONSTRAINT producto_validado_por_fkey FOREIGN KEY (validado_por) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.producto_especificacion (
  producto_especificacion_id bigint NOT NULL DEFAULT nextval('producto_especificacion_producto_especificacion_id_seq'::regclass),
  producto_id bigint NOT NULL,
  clave text NOT NULL,
  valor text NOT NULL,
  CONSTRAINT producto_especificacion_pkey PRIMARY KEY (producto_especificacion_id),
  CONSTRAINT producto_especificacion_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(producto_id)
);
CREATE TABLE public.producto_tag (
  producto_id bigint NOT NULL,
  tag_id bigint NOT NULL,
  CONSTRAINT producto_tag_pkey PRIMARY KEY (producto_id, tag_id),
  CONSTRAINT producto_tag_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(producto_id),
  CONSTRAINT producto_tag_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tag(tag_id)
);
CREATE TABLE public.propuesta (
  propuesta_id bigint NOT NULL DEFAULT nextval('propuesta_propuesta_id_seq'::regclass),
  chat_id bigint NOT NULL,
  usuario_propone_id bigint NOT NULL,
  usuario_recibe_id bigint NOT NULL,
  tipo_propuesta character varying NOT NULL CHECK (tipo_propuesta::text = ANY (ARRAY['precio'::character varying, 'intercambio'::character varying, 'encuentro'::character varying, 'condiciones'::character varying, 'otro'::character varying]::text[])),
  descripcion text NOT NULL,
  precio_propuesto numeric,
  condiciones text,
  fecha_encuentro timestamp with time zone,
  lugar_encuentro character varying,
  estado character varying DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'aceptada'::character varying, 'rechazada'::character varying, 'contrapropuesta'::character varying, 'cancelada'::character varying]::text[])),
  respuesta text,
  fecha_respuesta timestamp with time zone,
  fecha_creacion timestamp with time zone DEFAULT now(),
  fecha_actualizacion timestamp with time zone DEFAULT now(),
  archivo_url character varying,
  CONSTRAINT propuesta_pkey PRIMARY KEY (propuesta_id),
  CONSTRAINT propuesta_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chat(chat_id),
  CONSTRAINT propuesta_usuario_propone_id_fkey FOREIGN KEY (usuario_propone_id) REFERENCES public.usuario(user_id),
  CONSTRAINT propuesta_usuario_recibe_id_fkey FOREIGN KEY (usuario_recibe_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.reporte (
  reporte_id integer NOT NULL DEFAULT nextval('reporte_reporte_id_seq'::regclass),
  reporta_usuario_id integer,
  reportado_usuario_id integer,
  producto_id integer,
  intercambio_id integer,
  tipo character varying NOT NULL CHECK (tipo::text = ANY (ARRAY['producto_spam'::character varying, 'usuario_sospechoso'::character varying, 'intercambio_fraudulento'::character varying, 'contenido_inapropiado'::character varying]::text[])),
  descripcion text NOT NULL,
  estado character varying DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'en_revision'::character varying, 'resuelto'::character varying, 'desestimado'::character varying]::text[])),
  fecha_reporte timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion timestamp without time zone,
  notas_admin text,
  admin_resuelve_id integer,
  ticket_relacionado_id integer,
  CONSTRAINT reporte_pkey PRIMARY KEY (reporte_id),
  CONSTRAINT reporte_reporta_usuario_id_fkey FOREIGN KEY (reporta_usuario_id) REFERENCES public.usuario(user_id),
  CONSTRAINT reporte_reportado_usuario_id_fkey FOREIGN KEY (reportado_usuario_id) REFERENCES public.usuario(user_id),
  CONSTRAINT reporte_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(producto_id),
  CONSTRAINT reporte_intercambio_id_fkey FOREIGN KEY (intercambio_id) REFERENCES public.intercambio(intercambio_id),
  CONSTRAINT reporte_admin_resuelve_id_fkey FOREIGN KEY (admin_resuelve_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.rol_usuario (
  rol_id integer NOT NULL DEFAULT nextval('rol_usuario_rol_id_seq'::regclass),
  nombre character varying NOT NULL UNIQUE,
  descripcion text,
  permisos jsonb,
  activo boolean DEFAULT true,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rol_usuario_pkey PRIMARY KEY (rol_id)
);
CREATE TABLE public.tag (
  tag_id bigint NOT NULL DEFAULT nextval('tag_tag_id_seq'::regclass),
  nombre text NOT NULL UNIQUE,
  CONSTRAINT tag_pkey PRIMARY KEY (tag_id)
);
CREATE TABLE public.ticket_soporte (
  ticket_id integer NOT NULL DEFAULT nextval('ticket_soporte_ticket_id_seq'::regclass),
  usuario_id integer,
  admin_asignado_id integer,
  asunto character varying NOT NULL,
  categoria character varying NOT NULL CHECK (categoria::text = ANY (ARRAY['problema_tecnico'::character varying, 'reporte_usuario'::character varying, 'problema_intercambio'::character varying, 'verificacion_cuenta'::character varying, 'devolucion'::character varying, 'sugerencia'::character varying, 'otro'::character varying]::text[])),
  prioridad character varying DEFAULT 'media'::character varying CHECK (prioridad::text = ANY (ARRAY['baja'::character varying, 'media'::character varying, 'alta'::character varying, 'critica'::character varying]::text[])),
  estado character varying DEFAULT 'abierto'::character varying CHECK (estado::text = ANY (ARRAY['abierto'::character varying, 'en_progreso'::character varying, 'esperando_usuario'::character varying, 'resuelto'::character varying, 'cerrado'::character varying]::text[])),
  descripcion text NOT NULL,
  solucion text,
  producto_relacionado_id integer,
  intercambio_relacionado_id integer,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_asignacion timestamp without time zone,
  fecha_primera_respuesta timestamp without time zone,
  fecha_resolucion timestamp without time zone,
  fecha_cierre timestamp without time zone,
  tiempo_resolucion_horas integer,
  satisfaccion_usuario integer CHECK (satisfaccion_usuario >= 1 AND satisfaccion_usuario <= 5),
  tags jsonb,
  archivos_adjuntos jsonb,
  CONSTRAINT ticket_soporte_pkey PRIMARY KEY (ticket_id),
  CONSTRAINT ticket_soporte_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id),
  CONSTRAINT ticket_soporte_admin_asignado_id_fkey FOREIGN KEY (admin_asignado_id) REFERENCES public.usuario(user_id),
  CONSTRAINT ticket_soporte_producto_relacionado_id_fkey FOREIGN KEY (producto_relacionado_id) REFERENCES public.producto(producto_id),
  CONSTRAINT ticket_soporte_intercambio_relacionado_id_fkey FOREIGN KEY (intercambio_relacionado_id) REFERENCES public.intercambio(intercambio_id)
);
CREATE TABLE public.ubicacion (
  ubicacion_id integer NOT NULL DEFAULT nextval('ubicacion_ubicacion_id_seq'::regclass),
  user_id integer,
  pais character varying NOT NULL DEFAULT 'Colombia'::character varying,
  departamento character varying NOT NULL,
  ciudad character varying NOT NULL,
  barrio character varying,
  latitud numeric,
  longitud numeric,
  es_principal boolean DEFAULT false,
  fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ubicacion_pkey PRIMARY KEY (ubicacion_id),
  CONSTRAINT ubicacion_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.usuario (
  user_id integer NOT NULL DEFAULT nextval('usuario_user_id_seq'::regclass),
  nombre character varying NOT NULL,
  apellido character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  telefono character varying,
  password_hash character varying NOT NULL,
  fecha_nacimiento date,
  biografia text,
  foto_perfil character varying,
  calificacion_promedio numeric DEFAULT 0.00 CHECK (calificacion_promedio >= 0::numeric AND calificacion_promedio <= 5::numeric),
  total_intercambios integer DEFAULT 0,
  eco_puntos integer DEFAULT 0 CHECK (eco_puntos >= 0),
  fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  verificado boolean DEFAULT false,
  activo boolean DEFAULT true,
  ultima_conexion timestamp without time zone,
  es_admin boolean DEFAULT false,
  admin_desde timestamp without time zone,
  fecha_suspension timestamp without time zone,
  motivo_suspension character varying,
  pediente_validacion boolean,
  auth_user_id uuid,
  CONSTRAINT usuario_pkey PRIMARY KEY (user_id),
  CONSTRAINT usuario_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.usuario_insignia (
  usuario_id integer NOT NULL,
  insignia_id integer NOT NULL,
  fecha_obtencion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  descripcion_logro text,
  CONSTRAINT usuario_insignia_pkey PRIMARY KEY (usuario_id, insignia_id),
  CONSTRAINT usuario_insignia_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id),
  CONSTRAINT usuario_insignia_insignia_id_fkey FOREIGN KEY (insignia_id) REFERENCES public.insignia(insignia_id)
);
CREATE TABLE public.usuario_rol (
  usuario_id integer NOT NULL,
  rol_id integer NOT NULL,
  asignado_por integer,
  fecha_asignacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  activo boolean DEFAULT true,
  CONSTRAINT usuario_rol_pkey PRIMARY KEY (usuario_id, rol_id),
  CONSTRAINT usuario_rol_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id),
  CONSTRAINT usuario_rol_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.rol_usuario(rol_id),
  CONSTRAINT usuario_rol_asignado_por_fkey FOREIGN KEY (asignado_por) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.usuario_seguido (
  seguidor_id integer NOT NULL,
  seguido_id integer NOT NULL,
  fecha_inicio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  notificaciones_activas boolean DEFAULT true,
  CONSTRAINT usuario_seguido_pkey PRIMARY KEY (seguidor_id, seguido_id),
  CONSTRAINT usuario_seguido_seguidor_id_fkey FOREIGN KEY (seguidor_id) REFERENCES public.usuario(user_id),
  CONSTRAINT usuario_seguido_seguido_id_fkey FOREIGN KEY (seguido_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.validacion_intercambio (
  validacion_id integer NOT NULL DEFAULT nextval('validacion_intercambio_validacion_id_seq'::regclass),
  intercambio_id integer NOT NULL,
  usuario_id integer NOT NULL,
  es_exitoso boolean NOT NULL,
  calificacion integer CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario text,
  aspectos_destacados text,
  fecha_validacion timestamp with time zone DEFAULT now(),
  fecha_creacion timestamp with time zone DEFAULT now(),
  CONSTRAINT validacion_intercambio_pkey PRIMARY KEY (validacion_id),
  CONSTRAINT validacion_intercambio_intercambio_id_fkey FOREIGN KEY (intercambio_id) REFERENCES public.intercambio(intercambio_id),
  CONSTRAINT validacion_intercambio_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.validacion_usuario (
  validacion_id integer NOT NULL DEFAULT nextval('validacion_usuario_validacion_id_seq'::regclass),
  usuario_id integer,
  admin_validador_id integer,
  tipo_validacion character varying NOT NULL CHECK (tipo_validacion::text = ANY (ARRAY['identidad'::character varying, 'telefono'::character varying, 'direccion'::character varying, 'documento'::character varying, 'referencias'::character varying]::text[])),
  estado character varying DEFAULT 'pendiente'::character varying CHECK (estado::text = ANY (ARRAY['pendiente'::character varying, 'en_revision'::character varying, 'aprobada'::character varying, 'rechazada'::character varying, 'expirada'::character varying]::text[])),
  documentos_adjuntos jsonb,
  notas_admin text,
  motivo_rechazo text,
  fecha_solicitud timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  fecha_revision timestamp without time zone,
  fecha_aprobacion timestamp without time zone,
  fecha_expiracion timestamp without time zone,
  CONSTRAINT validacion_usuario_pkey PRIMARY KEY (validacion_id),
  CONSTRAINT validacion_usuario_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id),
  CONSTRAINT validacion_usuario_admin_validador_id_fkey FOREIGN KEY (admin_validador_id) REFERENCES public.usuario(user_id)
);
CREATE TABLE public.visualizacion_producto (
  visualizacion_id integer NOT NULL DEFAULT nextval('visualizacion_producto_visualizacion_id_seq'::regclass),
  usuario_id integer,
  producto_id integer,
  fecha_visualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT visualizacion_producto_pkey PRIMARY KEY (visualizacion_id),
  CONSTRAINT visualizacion_producto_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuario(user_id),
  CONSTRAINT visualizacion_producto_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.producto(producto_id)
);