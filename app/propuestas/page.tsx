'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase-client'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TagIcon,
  ArrowLeftIcon,
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

export default function PropuestasPage() {
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
        return 'bg-green-100 text-green-800'
      case 'rechazada':
        return 'bg-red-100 text-red-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      case 'contrapropuesta':
        return 'bg-blue-100 text-blue-800'
      case 'cancelada':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Volver
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Propuestas</h1>
            <p className="mt-2 text-gray-600">Gestiona todas tus propuestas de intercambio</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
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
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          <div className={`space-y-8 ${shouldEnableScroll ? 'max-h-[65vh] overflow-y-auto pr-2 proposals-scroll-container' : ''}`}>
            {proposalsByProduct.map((group, groupIndex) => (
              <div key={groupIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Product Header */}
                {group.product ? (
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                      {group.product.image && (
                        <img
                          src={group.product.image}
                          alt={group.product.title}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{group.product.title}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          {group.product.price && (
                            <span className="text-sm font-medium text-green-600">
                              {formatPrice(group.product.price)}
                            </span>
                          )}
                          {group.product.category && (
                            <span className="text-sm text-gray-500">{group.product.category}</span>
                          )}
                          {group.product.location && (
                            <span className="text-sm text-gray-500">📍 {group.product.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Propuestas sin producto asociado</h3>
                  </div>
                )}

                {/* Proposals List */}
                <div className="divide-y divide-gray-200">
                  {group.proposals.map((proposal) => (
                    <div key={proposal.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
                              <span className="flex items-center space-x-1">
                                {getStatusIcon(proposal.status)}
                                <span>{proposal.status}</span>
                              </span>
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {getTypeLabel(proposal.type)}
                            </span>
                            {proposal.isMyProposal && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                Mi propuesta
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 mb-2">{proposal.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            {proposal.proposedPrice && (
                              <span>💰 {formatPrice(proposal.proposedPrice)}</span>
                            )}
                            {proposal.meetingDate && (
                              <span>📅 {formatDate(proposal.meetingDate)}</span>
                            )}
                            {proposal.meetingPlace && (
                              <span>📍 {proposal.meetingPlace}</span>
                            )}
                            <span>🕐 {formatDate(proposal.createdAt)}</span>
                          </div>

                          {proposal.response && (
                            <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                              <p className="text-sm text-gray-700">
                                <strong>Respuesta:</strong> {proposal.response}
                              </p>
                            </div>
                          )}

                          <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                            <span>
                              De: {proposal.proposer.name} {proposal.proposer.lastName}
                            </span>
                            <span>•</span>
                            <span>
                              Para: {proposal.receiver.name} {proposal.receiver.lastName}
                            </span>
                          </div>
                        </div>

                        <div className="ml-4">
                          <button
                            onClick={() => {
                              // Guardar la ruta actual para poder volver después
                              sessionStorage.setItem('lastPageBeforeChat', '/propuestas')
                              router.push(`/chat/${proposal.chatId}`)
                            }}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
        <div className="mt-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <GiftIcon className="w-6 h-6 text-purple-600" />
                Mis Donaciones
              </h2>
              <p className="text-sm text-gray-600">
                Consulta y gestiona los productos que ofreces como donación.
              </p>
            </div>
            <span className="inline-flex items-center text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
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
            <div className="bg-white border-2 border-dashed border-purple-200 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">🎁</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tienes donaciones activas
              </h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Publica un producto como donación desde la sección de publicaciones para que aparezca aquí y puedas gestionarlo fácilmente.
              </p>
            </div>
          ) : (
            <div className={`${donations.length > 3 ? 'max-h-[65vh] overflow-y-auto pr-3 space-y-4' : 'space-y-4'}`}>
              {donations.map((donation) => (
                <div key={donation.id} className="bg-white border border-purple-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="sm:w-32 sm:h-32 flex-shrink-0">
                      {donation.image ? (
                        <img
                          src={donation.image}
                          alt={donation.title}
                          className="w-full h-full object-cover rounded-lg border border-purple-100"
                        />
                      ) : (
                        <div className="w-full h-full bg-purple-50 border border-dashed border-purple-200 rounded-lg flex items-center justify-center text-3xl text-purple-300">
                          🎁
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{donation.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{donation.description}</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                          donation.status === 'activo'
                            ? 'bg-green-100 text-green-700'
                            : donation.status === 'pausado'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}>
                          {donation.status === 'activo' && 'Activo'}
                          {donation.status === 'pausado' && 'Pausado'}
                          {!['activo', 'pausado'].includes(donation.status) && donation.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="w-4 h-4 text-purple-500" />
                          <span>{donation.location || 'Ubicación no especificada'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-purple-500" />
                          <span>
                            Publicado: {donation.createdAt ? formatDate(donation.createdAt) : 'No disponible'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GiftIcon className="w-4 h-4 text-purple-500" />
                          <span>Estado del artículo: {donation.condition || 'No especificado'}</span>
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


