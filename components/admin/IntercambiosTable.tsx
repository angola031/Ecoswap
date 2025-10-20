export default function IntercambiosTable({ items, loading }: { items: Array<{
  intercambio_id: number
  usuario_propone_id: number
  usuario_recibe_id: number
  estado: string
  fecha_propuesta?: string
  fecha_respuesta?: string
  fecha_completado?: string
}>; loading: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          {loading ? 'Cargando…' : `${items.length} resultado(s)`}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Propone</th>
              <th className="px-3 py-2 text-left">Recibe</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Propuesta</th>
              <th className="px-3 py-2 text-left">Respuesta</th>
              <th className="px-3 py-2 text-left">Completado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.intercambio_id} className="border-t border-gray-100">
                <td className="px-3 py-2 font-mono">{it.intercambio_id}</td>
                <td className="px-3 py-2">{it.usuario_propone_id}</td>
                <td className="px-3 py-2">{it.usuario_recibe_id}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    it.estado === 'completado' ? 'bg-emerald-100 text-emerald-800' :
                    it.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    it.estado === 'rechazado' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{it.estado}</span>
                </td>
                <td className="px-3 py-2">{it.fecha_propuesta ? new Date(it.fecha_propuesta).toLocaleString('es-CO') : '-'}</td>
                <td className="px-3 py-2">{it.fecha_respuesta ? new Date(it.fecha_respuesta).toLocaleString('es-CO') : '-'}</td>
                <td className="px-3 py-2">{it.fecha_completado ? new Date(it.fecha_completado).toLocaleString('es-CO') : '-'}</td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-500">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
