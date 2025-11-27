export type FoundationDocumentStatus = 'pendiente' | 'aprobado' | 'rechazado'

export interface FoundationDocumentEntry {
    url?: string | null
    estado?: FoundationDocumentStatus
    comentario_admin?: string | null
    revisado_por?: number | null
    fecha_revision?: string | null
    fecha_actualizacion?: string | null
}

export type FoundationDocuments = Record<string, FoundationDocumentEntry | string | null>

export interface FoundationDocumentDefinition {
    key: string
    label: string
    required: boolean
    description: string
}

export const FOUNDATION_DOCUMENT_DEFINITIONS: FoundationDocumentDefinition[] = [
    {
        key: 'acta_constitucion',
        label: 'Acta de Constitución',
        required: true,
        description: 'Documento privado o escritura pública con lista de asociados'
    },
    {
        key: 'estatutos',
        label: 'Estatutos',
        required: true,
        description: 'Estatutos aprobados de la fundación'
    },
    {
        key: 'pre_rut',
        label: 'PRE-RUT',
        required: true,
        description: 'PRE-RUT expedido por la DIAN'
    },
    {
        key: 'cartas_aceptacion',
        label: 'Cartas de Aceptación',
        required: false,
        description: 'Cartas de aceptación de cargos en junta directiva y revisor fiscal'
    },
    {
        key: 'formulario_rues',
        label: 'Formulario RUES',
        required: false,
        description: 'Formulario Único Empresarial y Social'
    }
]

export const REQUIRED_FOUNDATION_DOCUMENT_KEYS = FOUNDATION_DOCUMENT_DEFINITIONS
    .filter(def => def.required)
    .map(def => def.key)

