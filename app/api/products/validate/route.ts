import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

async function authAdmin(req: NextRequest) {
    const auth = req.headers.get('authorization') || ''
    
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    
    if (!token) {
        console.error('❌ API: No hay token en el header')
        return null
    }
    
    try {
        const { data, error } = await supabaseAdmin.auth.getUser(token)
        
        if (!data?.user) {
            console.error('❌ API: No hay usuario en la respuesta de auth')
            return null
        }

        // Verificar si el usuario es administrador
        const { data: userData, error: userError } = await supabaseAdmin
            .from('usuario')
            .select('user_id, email, es_admin')
            .eq('auth_user_id', data.user.id)
            .single()


        if (!userData) {
            console.error('❌ API: Usuario no encontrado en BD')
            return null
        }

        if (!userData.es_admin) {
            console.error('❌ API: Usuario no es admin')
            return null
        }

        return userData
    } catch (error) {
        console.error('❌ API: Error verificando admin:', error)
        return null
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await authAdmin(req)
        if (!admin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const body = await req.json()
        const { producto_id, estado_validacion, comentarios } = body

        if (!producto_id || !estado_validacion) {
            return NextResponse.json({ 
                error: 'producto_id y estado_validacion son requeridos' 
            }, { status: 400 })
        }

        if (!['approved', 'rejected'].includes(estado_validacion)) {
            return NextResponse.json({ 
                error: 'estado_validacion debe ser "approved" o "rejected"' 
            }, { status: 400 })
        }

        // Actualizar el producto directamente
        const { data: productData, error: productError } = await supabaseAdmin
            .from('producto')
            .select('user_id, titulo')
            .eq('producto_id', producto_id)
            .single()

        if (productError || !productData) {
            console.error('Error obteniendo producto:', productError)
            return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
        }

        // Actualizar el estado de validación
        const { error: updateError } = await supabaseAdmin
            .from('producto')
            .update({
                estado_validacion: estado_validacion,
                fecha_validacion: new Date().toISOString(),
                validado_por: admin.user_id,
                comentarios_validacion: comentarios || null,
                fecha_actualizacion: new Date().toISOString()
            })
            .eq('producto_id', producto_id)

        if (updateError) {
            console.error('Error actualizando producto:', updateError)
            return NextResponse.json({ error: updateError.message }, { status: 400 })
        }

        // Crear notificación para el usuario propietario del producto
        const { error: notificationError } = await supabaseAdmin
            .from('notificacion')
            .insert({
                usuario_id: productData.user_id,
                tipo: 'product_validation',
                titulo: estado_validacion === 'approved' ? 'Producto Aprobado' : 'Producto Rechazado',
                mensaje: estado_validacion === 'approved' 
                    ? `Tu producto "${productData.titulo}" ha sido aprobado y publicado en la plataforma.`
                    : `Tu producto "${productData.titulo}" ha sido rechazado. ${comentarios ? comentarios : ''}`,
                fecha_creacion: new Date().toISOString(),
                leida: false
            })

        if (notificationError) {
            console.error('Error creando notificación:', notificationError)
            // No fallar la operación por un error de notificación
        }

        return NextResponse.json({ 
            success: true, 
            message: `Producto ${estado_validacion === 'approved' ? 'aprobado' : 'rechazado'} exitosamente` 
        })

    } catch (error: any) {
        console.error('Error en validación:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const admin = await authAdmin(req)
        if (!admin) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Obtener productos
        const { data: products, error } = await supabaseAdmin
            .from('producto')
            .select(`
                producto_id,
                titulo,
                descripcion,
                precio,
                estado,
                tipo_transaccion,
                estado_validacion,
                fecha_creacion,
                fecha_validacion,
                comentarios_validacion,
                validado_por,
                usuario:user_id(
                    user_id,
                    nombre,
                    apellido,
                    email
                ),
                categoria:categoria_id(
                    nombre
                )
            `)
            .order('fecha_creacion', { ascending: false })

        if (error) {
            console.error('Error obteniendo productos:', error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Transformar los datos
        const transformedProducts = products?.map(product => ({
            producto_id: product.producto_id,
            titulo: product.titulo,
            descripcion: product.descripcion,
            precio: product.precio,
            categoria_nombre: product.categoria?.nombre || 'Sin categoría',
            estado: product.estado,
            tipo_transaccion: product.tipo_transaccion,
            estado_validacion: product.estado_validacion,
            fecha_creacion: product.fecha_creacion,
            fecha_validacion: product.fecha_validacion,
            user_id: product.usuario?.user_id,
            usuario_nombre: product.usuario?.nombre || 'Usuario',
            usuario_apellido: product.usuario?.apellido || 'Sin apellido',
            usuario_email: product.usuario?.email || '',
            comentarios_validacion: product.comentarios_validacion,
            validado_por: product.validado_por
        })) || []

        return NextResponse.json({ products: transformedProducts })

    } catch (error: any) {
        console.error('Error obteniendo productos:', error)
        return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
    }
}
