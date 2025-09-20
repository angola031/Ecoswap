// =============================================
// 🚀 MEJOR CONSULTA PARA SISTEMA DE ADMINISTRACIÓN - ECOSWAP
// =============================================

// CONSULTA PRINCIPAL: Obtener usuarios con información completa de administración
const { data, error } = await supabase
    .from("usuario")
    .select(`
    user_id,
    nombre,
    apellido,
    email,
    telefono,
    es_admin,
    admin_desde,
    verificado,
    activo,
    ultima_conexion,
    usuario_rol!usuario_rol_usuario_id_fkey (
      rol_id,
      activo,
      fecha_asignacion,
      rol_usuario (
        nombre,
        descripcion,
        permisos
      ),
      asignado_por:usuario!usuario_rol_asignado_por_fkey (
        nombre,
        email
      )
    )
  `)
    .eq('usuario_rol.activo', true)
    .order('admin_desde', { ascending: false });

if (error) {
    console.error('Error al obtener usuarios:', error);
} else {
    console.log('Usuarios con roles:', data);
}

// =============================================
// CONSULTAS ESPECÍFICAS SEGÚN NECESIDAD
// =============================================

// 1. SOLO SUPER ADMINS
const getSuperAdmins = async () => {
    const { data, error } = await supabase
        .from("usuario")
        .select(`
      user_id,
      nombre,
      apellido,
      email,
      es_admin,
      admin_desde,
      usuario_rol!usuario_rol_usuario_id_fkey (
        rol_usuario!inner (
          nombre
        )
      )
    `)
        .eq('usuario_rol.activo', true)
        .eq('usuario_rol.rol_usuario.nombre', 'super_admin');

    return { data, error };
};

// 2. USUARIOS CON PERMISOS ESPECÍFICOS
const getUsersWithPermission = async (permission) => {
    const { data, error } = await supabase
        .from("usuario")
        .select(`
      user_id,
      nombre,
      email,
      es_admin,
      usuario_rol!usuario_rol_usuario_id_fkey (
        rol_usuario (
          nombre,
          permisos
        )
      )
    `)
        .eq('usuario_rol.activo', true)
        .contains('usuario_rol.rol_usuario.permisos', [permission]);

    return { data, error };
};

// 3. VERIFICAR SI UN USUARIO ES ADMIN
const isUserAdmin = async (email) => {
    const { data, error } = await supabase
        .from("usuario")
        .select(`
      user_id,
      es_admin,
      usuario_rol!usuario_rol_usuario_id_fkey (
        rol_usuario (
          nombre
        )
      )
    `)
        .eq('email', email)
        .eq('usuario_rol.activo', true)
        .single();

    if (error) return { isAdmin: false, roles: [] };

    const roles = data.usuario_rol?.map(ur => ur.rol_usuario.nombre) || [];
    return {
        isAdmin: data.es_admin || roles.length > 0,
        roles
    };
};

// 4. OBTENER ROLES DISPONIBLES
const getAvailableRoles = async () => {
    const { data, error } = await supabase
        .from("rol_usuario")
        .select(`
      rol_id,
      nombre,
      descripcion,
      permisos,
      activo
    `)
        .eq('activo', true)
        .order('nombre');

    return { data, error };
};

// 5. HISTORIAL DE ASIGNACIONES DE ROLES
const getRoleAssignmentHistory = async () => {
    const { data, error } = await supabase
        .from("usuario_rol")
        .select(`
      fecha_asignacion,
      activo,
      usuario!usuario_rol_usuario_id_fkey (
        nombre,
        email
      ),
      rol_usuario (
        nombre,
        descripcion
      ),
      asignado_por:usuario!usuario_rol_asignado_por_fkey (
        nombre,
        email
      )
    `)
        .order('fecha_asignacion', { ascending: false });

    return { data, error };
};

// =============================================
// FUNCIONES DE UTILIDAD
// =============================================

// Función para procesar los datos de usuario con roles
const processUserWithRoles = (userData) => {
    if (!userData) return null;

    const roles = userData.usuario_rol?.map(ur => ({
        id: ur.rol_id,
        nombre: ur.rol_usuario.nombre,
        descripcion: ur.rol_usuario.descripcion,
        permisos: ur.rol_usuario.permisos,
        fechaAsignacion: ur.fecha_asignacion,
        asignadoPor: ur.asignado_por?.nombre || 'Sistema'
    })) || [];

    return {
        ...userData,
        roles,
        hasRole: (roleName) => roles.some(r => r.nombre === roleName),
        hasPermission: (permission) => roles.some(r =>
            r.permisos?.includes(permission) || r.permisos?.includes('all')
        )
    };
};

// =============================================
// EJEMPLO DE USO COMPLETO
// =============================================

const ejemploUsoCompleto = async () => {
    try {
        // 1. Obtener todos los administradores
        const { data: admins, error: adminError } = await supabase
            .from("usuario")
            .select(`
        user_id,
        nombre,
        apellido,
        email,
        es_admin,
        admin_desde,
        usuario_rol!usuario_rol_usuario_id_fkey (
          rol_usuario (
            nombre,
            descripcion
          )
        )
      `)
            .eq('es_admin', true)
            .eq('usuario_rol.activo', true);

        if (adminError) throw adminError;

        // 2. Procesar los datos
        const processedAdmins = admins.map(processUserWithRoles);

        // 3. Filtrar por roles específicos
        const superAdmins = processedAdmins.filter(admin =>
            admin.hasRole('super_admin')
        );

        const validationAdmins = processedAdmins.filter(admin =>
            admin.hasRole('admin_validacion')
        );

        console.log('Super Admins:', superAdmins);
        console.log('Admins de Validación:', validationAdmins);

        return processedAdmins;

    } catch (error) {
        console.error('Error en consulta:', error);
        return [];
    }
};

// =============================================
// EXPORTAR FUNCIONES
// =============================================

export {
    getSuperAdmins,
    getUsersWithPermission,
    isUserAdmin,
    getAvailableRoles,
    getRoleAssignmentHistory,
    processUserWithRoles,
    ejemploUsoCompleto
};
