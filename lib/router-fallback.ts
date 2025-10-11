// Fallback para router de Next.js cuando está deshabilitado
import { useCustomRouter, useCustomSearchParams, useCustomPathname } from './custom-router'

export const useRouter = useCustomRouter
export const useSearchParams = useCustomSearchParams
export const usePathname = useCustomPathname
