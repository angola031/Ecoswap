'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TagIcon,
  GiftIcon,
  MapPinIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface Product {
  id: number
  title: string
  price: number | null
  type: string
  exchangeConditions: string | null
  exchangeSeeking: string | null
  negotiable: boolean
  image: string | null
  category: string | null
  condition: string
  status: string
  location: string | null
}

interface Proposal {
  id: number
  type: string
  description: string
  proposedPrice: number | null
  conditions: string | null
  status: string
  createdAt: string
  updatedAt: string
  respondedAt: string | null
  response: string | null
  meetingDate: string | null
  meetingPlace: string | null
  archivo_url: string | null
  nota_intercambio: string | null
  proposer: {
    id: number
    name: string
    lastName: string
    avatar: string | null
  }
  receiver: {
    id: number
    name: string
    lastName: string
    avatar: string | null
  }
  product: Product | null
  chatId: number
  isMyProposal: boolean
}

interface ProposalGroup {
  product: Product | null
  proposals: Proposal[]
}

interface Donation {
  id: number
  title: string
  description: string
  status: string
  condition: string
  location: string | null
  createdAt: string | null
  updatedAt: string | null
  image: string | null
  price: number | null
  negotiable: boolean | null
}

interface PropuestasPageProps {
  currentUser?: any
}

export default function PropuestasPage({ currentUser: propCurrentUser }: PropuestasPageProps = {}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'todas' | 'pendiente' | 'aceptada' | 'rechazada'>('todas')
  const [proposalsByProduct, setProposalsByProduct] = useState<ProposalGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [donationsError, setDonationsError] = useState<string | null>(null)

  // Calcular el total de propuestas (sumando todas las propuestas de todos los grupos)
  const totalProposals = proposalsByProduct.reduce((total, group) => total + group.proposals.length, 0)
  const shouldEnableScroll = totalProposals > 3

  useEffect(() => {
    loadProposals()
  }, [activeTab])

  const loadProposals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setDonationsError(null)

      const supabase = getSupabaseClient()
      if (!supabase) {
        setError('Error de configuración')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('No autenticado')
        router.push('/login')
        setDonations([])
        return
      }

      const statusParam = activeTab === 'todas' ? null : activeTab
      const url = statusParam 
        ? `/api/proposals/user?status=${statusParam}`
        : '/api/proposals/user'

      const headers = {
        'Authorization': `Bearer ${session.access_token}`
      }

      const [proposalsOutcome, donationsOutcome] = await Promise.allSettled([
        fetch(url, { headers }),
        fetch('/api/donations/user', { headers })
      ])

      if (proposalsOutcome.status === 'rejected') {
        throw proposalsOutcome.reason instanceof Error
          ? proposalsOutcome.reason
          : new Error('Error cargando propuestas')
      }

      const proposalsResponse = proposalsOutcome.value
      if (!proposalsResponse.ok) {
        const errorData = await proposalsResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error cargando propuestas')
      }

      const proposalsData = await proposalsResponse.json()
      setProposalsByProduct(proposalsData.proposalsByProduct || [])

      if (donationsOutcome.status === 'fulfilled') {
        if (donationsOutcome.value.ok) {
          const donationsData = await donationsOutcome.value.json()
          setDonations(donationsData.donations || [])
        } else {
          const donationErrorData = await donationsOutcome.value.json().catch(() => ({}))
          setDonationsError(donationErrorData.error || 'No se pudieron cargar las donaciones')
          setDonations([])
        }
      } else {
        setDonationsError('No se pudieron cargar las donaciones')
        setDonations([])
      }
    } catch (err) {
      console.error('Error cargando propuestas:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setDonationsError((prev) => prev ?? (err instanceof Error ? err.message : 'Error desconocido'))
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aceptada':
        return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
      case 'rechazada':
        return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
      case 'pendiente':
        return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
      case 'contrapropuesta':
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
      case 'cancelada':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aceptada':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'rechazada':
        return <XCircleIcon className="w-4 h-4" />
      case 'pendiente':
        return <ClockIcon className="w-4 h-4" />
      default:
        return <TagIcon className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'precio': '💰 Precio',
      'intercambio': '🔄 Intercambio',
      'encuentro': '📅 Encuentro',
      'condiciones': '📋 Condiciones',
      'otro': '📝 Otro',
      'donacion': '🎁 Donación'
    }
    return labels[type] || type
  }

  const formatPrice = (price: number | null) => {
    if (!price) return null
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8 space-y-3 sm:space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Propuestas</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Gestiona todas tus propuestas de intercambio</p>
          </div>
        </div>

        {/* Tabs - Scrollable en móvil */}
        <div className="mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto overflow-y-hidden">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'pendiente', label: 'Pendientes' },
              { id: 'aceptada', label: 'Aceptadas' },
              { id: 'rechazada', label: 'Rechazadas' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-green-500 dark:border-green-400 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (error && proposalsByProduct.length === 0) ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        ) : proposalsByProduct.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay propuestas {activeTab !== 'todas' ? `con estado "${activeTab}"` : ''}</p>
          </div>
        ) : (
          <div className={`space-y-4 sm:space-y-8 ${shouldEnableScroll ? 'max-h-[65vh] overflow-y-auto pr-1 sm:pr-2 proposals-scroll-container' : ''}`}>
            {proposalsByProduct.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-white dark:bg-product-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                {/* Product Header */}
                {group.product ? (
                  <div className="bg-gray-50 dark:bg-product-dark/80 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                      {group.product.image && (
                        <img
                          src={group.product.image}
                          alt={group.product.title}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">{group.product.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                          {group.product.price && (
                            <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                              {formatPrice(group.product.price)}
                            </span>
                          )}
                          {group.product.category && (
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{group.product.category}</span>
                          )}
                          {group.product.location && (
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">📍 {group.product.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-product-dark/80 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Propuestas sin producto asociado</h3>
                  </div>
                )}

                {/* Proposals List */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {group.proposals.map((proposal) => (
                    <div key={proposal.id} className="px-3 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-product-dark/60 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                              <span className="flex items-center space-x-1">
                                {getStatusIcon(proposal.status)}
                                <span className="hidden sm:inline">{proposal.status}</span>
                                <span className="sm:hidden">{proposal.status.substring(0, 3)}</span>
                              </span>
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-yellow-900/50 text-blue-800 dark:text-yellow-300">
                              {getTypeLabel(proposal.type)}
                            </span>
                            {proposal.isMyProposal && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                                Mi propuesta
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 break-words">{proposal.description}</p>

                          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                            {proposal.proposedPrice && (
                              <span>💰 {formatPrice(proposal.proposedPrice)}</span>
                            )}
                            {proposal.meetingDate && (
                              <span className="flex items-center gap-1">
                                <span>📅</span>
                                <span className="break-words">{formatDate(proposal.meetingDate)}</span>
                              </span>
                            )}
                            {proposal.meetingPlace && (
                              <span className="flex items-center gap-1">
                                <span>📍</span>
                                <span className="break-words">{proposal.meetingPlace}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <span>🕐</span>
                              <span className="break-words">{formatDate(proposal.createdAt)}</span>
                            </span>
                          </div>

                          {proposal.response && (
                            <div className="mt-3 p-2 sm:p-3 bg-blue-50 dark:bg-gray-700/40 border-l-4 border-blue-500 dark:border-blue-600 rounded">
                              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 break-words">
                                <strong>Respuesta:</strong> {proposal.response}
                              </p>
                            </div>
                          )}

                          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 sm:space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="break-words">
                              De: {proposal.proposer.name} {proposal.proposer.lastName}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="break-words">
                              Para: {proposal.receiver.name} {proposal.receiver.lastName}
                            </span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col sm:ml-4 sm:flex-shrink-0">
                          <button
                            onClick={() => {
                              // Guardar la ruta actual para poder volver después
                              sessionStorage.setItem('lastPageBeforeChat', '/propuestas')
                              router.push(`/chat/${proposal.chatId}`)
                            }}
                            className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm bg-blue-600 dark:bg-blue-800 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-900 transition-colors whitespace-nowrap"
                          >
                            Ver Chat
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Donaciones Section */}
        <div className="mt-8 sm:mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <GiftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                Mis Donaciones
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Consulta y gestiona los productos que ofreces como donación.
              </p>
            </div>
            <span className="inline-flex items-center text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full self-start sm:self-auto">
              {donations.length} donación{donations.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {isLoading && donations.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : donationsError && donations.length === 0 ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800">{donationsError}</p>
            </div>
          ) : donations.length === 0 ? (
            <div className="bg-white dark:bg-product-dark border-2 border-dashed border-purple-200 dark:border-purple-800 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">🎁</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No tienes donaciones activas
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm max-w-md mx-auto">
                Publica un producto como donación desde la sección de publicaciones para que aparezca aquí y puedas gestionarlo fácilmente.
              </p>
            </div>
          ) : (
            <div className={`${donations.length > 3 ? 'max-h-[65vh] overflow-y-auto pr-1 sm:pr-3 space-y-3 sm:space-y-4' : 'space-y-3 sm:space-y-4'}`}>
              {donations.map((donation) => (
                <div key={donation.id} className="bg-white dark:bg-product-dark border border-purple-200 dark:border-purple-800 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="w-full sm:w-32 sm:h-32 flex-shrink-0">
                      {donation.image ? (
                        <img
                          src={donation.image}
                          alt={donation.title}
                          className="w-full h-48 sm:h-full object-cover rounded-lg border border-purple-100"
                        />
                      ) : (
                        <div className="w-full h-48 sm:h-full bg-purple-50 border border-dashed border-purple-200 rounded-lg flex items-center justify-center text-3xl text-purple-300">
                          🎁
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">{donation.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 break-words">{donation.description}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 sm:px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                          donation.status === 'activo'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : donation.status === 'pausado'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {donation.status === 'activo' && 'Activo'}
                          {donation.status === 'pausado' && 'Pausado'}
                          {!['activo', 'pausado'].includes(donation.status) && donation.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{donation.location || 'Ubicación no especificada'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CalendarIcon className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                          <span className="break-words">
                            Publicado: {donation.createdAt ? formatDate(donation.createdAt) : 'No disponible'}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <GiftIcon className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                          <span className="break-words">Estado: {donation.condition || 'No especificado'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


