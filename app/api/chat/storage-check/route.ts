import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase-client'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 [API] Verificando configuración de Supabase Storage...')
    
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase client no disponible',
        status: 'ERROR'
      }, { status: 500 })
    }

    // 1. Verificar variables de entorno
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    // 2. Listar buckets disponibles
    let buckets = []
    let bucketError = null
    try {
      const { data, error } = await supabase.storage.listBuckets()
      if (error) {
        bucketError = error.message
      } else {
        buckets = data || []
      }
    } catch (error: any) {
      bucketError = error.message
    }

    // 3. Verificar si el bucket 'Ecoswap' existe
    const ecoswapBucket = buckets.find(bucket => bucket.name === 'Ecoswap')
    
    // 4. Intentar listar contenido del bucket Ecoswap
    let bucketContent = []
    let contentError = null
    if (ecoswapBucket) {
      try {
        const { data, error } = await supabase.storage
          .from('Ecoswap')
          .list('', { limit: 5 })
        if (error) {
          contentError = error.message
        } else {
          bucketContent = data || []
        }
      } catch (error: any) {
        contentError = error.message
      }
    }

    const result = {
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      buckets: {
        available: buckets.map(b => ({ name: b.name, public: b.public })),
        ecoswapExists: !!ecoswapBucket,
        ecoswapBucket: ecoswapBucket || null,
        bucketError
      },
      storage: {
        bucketContent: bucketContent.slice(0, 5), // Solo primeros 5 elementos
        contentError,
        canAccess: !contentError
      },
      recommendations: []
    }

    // Agregar recomendaciones basadas en los resultados
    if (!envCheck.supabaseUrl || !envCheck.supabaseAnonKey) {
      result.recommendations.push('Configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    
    if (!ecoswapBucket) {
      result.recommendations.push("Crear bucket 'Ecoswap' en Supabase Storage")
    }
    
    if (contentError) {
      result.recommendations.push('Verificar permisos del bucket Ecoswap')
    }

    console.log('📊 [API] Resultado del storage check:', result)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ 
      error: e?.message || 'Server error',
      status: 'ERROR',
      stack: e?.stack
    }, { status: 500 })
  }
}
