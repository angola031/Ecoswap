

const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

export const supabaseServer = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '', {
    auth: { persistSession: false },
    global: {
        headers: {
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
    }
})


