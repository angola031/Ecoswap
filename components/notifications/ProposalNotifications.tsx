import React, { useState } from 'react'
import { useProposalNotifications } from '../../hooks/useProposalNotifications'

interface ProposalNotificationsProps {
  onNavigateToProposals: () => void
  onNavigateToChat: (chatId: string) => void
}

export const ProposalNotifications: React.FC<ProposalNotificationsProps> = ({
  onNavigateToProposals,
  onNavigateToChat
}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead
  } = useProposalNotifications()

  const [isOpen, setIsOpen] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_proposal': return '📋'
      case 'proposal_accepted': return '✅'
      case 'proposal_rejected': return '❌'
      case 'proposal_response': return '💬'
      default: return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_proposal': return 'text-green-600'
      case 'proposal_accepted': return 'text-green-600'
      case 'proposal_rejected': return 'text-red-600'
      case 'proposal_response': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    
    if (notification.chatId) {
      onNavigateToChat(notification.chatId)
    } else {
      onNavigateToProposals()
    }
    
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            loadNotifications()
          }
        }}
        className="relative p-2 text-gray-600 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-green-600 hover:text-green-800"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-gray-400 text-4xl mb-2">🔔</div>
                <p className="text-sm text-gray-500">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notification.timestamp).toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 10 && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  onNavigateToProposals()
                  setIsOpen(false)
                }}
                className="w-full text-center text-sm text-green-600 hover:text-green-800"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
