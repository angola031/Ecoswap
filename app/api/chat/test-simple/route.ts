import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 [TEST SIMPLE] Endpoint funcionando')
    
    return NextResponse.json({ 
      success: true,
      message: 'Endpoint de test funcionando correctamente',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ [TEST SIMPLE] Error:', error.message)
    return NextResponse.json({ 
      error: 'Error en test simple',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [TEST SIMPLE] POST recibido')
    
    const formData = await request.formData()
    const file = formData.get('image') as File
    const chatId = formData.get('chatId') as string
    const userId = formData.get('userId') as string
    
    console.log('📋 [TEST SIMPLE] Datos recibidos:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      chatId,
      userId
    })
    
    return NextResponse.json({ 
      success: true,
      message: 'Test POST funcionando',
      data: {
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        fileType: file?.type,
        chatId,
        userId
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ [TEST SIMPLE] Error en POST:', error.message)
    return NextResponse.json({ 
      error: 'Error en test POST',
      details: error.message
    }, { status: 500 })
  }
}

