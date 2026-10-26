import { useState, useEffect } from 'react'
import { api, type SystemStatus } from '../../lib/api'
import { formatRelativeTime } from '../../lib/utils'
import {
  Server,
  Database,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

export function SystemPanel() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStatus = async () => {
    try {
      const data = await api.getSystemStatus()
      setStatus(data)
    } catch (err) {
      console.error('Falha ao carregar status:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 20000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !status) {
    return (
      <div className="h-full flex items-center justify-center font-mono text-xs text-odin-graphite-500">
        Consultando telemetria...
      </div>
    )
  }

  const isHealthy = status?.overall === 'ok'

  return (
    <div className="w-full h-full flex flex-col p-3 font-mono text-xs space-y-3 relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-odin-graphite-800 pb-2">
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <CheckCircle className="w-4 h-4 text-odin-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-odin-amber-400" />
          )}
          <span className="font-bold uppercase text-odin-graphite-100">
            Nó Operacional {isHealthy ? 'Saudável' : 'Degradado'}
          </span>
        </div>

        <button
          onClick={loadStatus}
          className="p-1 rounded text-odin-graphite-400 hover:text-odin-orange-400"
          title="Atualizar"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {/* Core metrics grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-lg bg-odin-surface border border-odin-graphite-800">
            <span className="text-[10px] text-odin-graphite-500 block mb-1">GATEWAY HERMES</span>
            <div className="flex items-center gap-1.5">
              {status?.hermes_connected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-odin-emerald-400" />
                  <span className="font-bold text-odin-emerald-400">ONLINE</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-odin-crimson-400" />
                  <span className="font-bold text-odin-crimson-400">OFFLINE</span>
                </>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-odin-surface border border-odin-graphite-800">
            <span className="text-[10px] text-odin-graphite-500 block mb-1">BANCO DE DADOS</span>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-odin-emerald-400" />
              <span className="font-bold text-odin-emerald-400">
                {status?.database_connected ? 'CONECTADO' : 'FALHA'}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed components */}
        {status?.components && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-odin-graphite-500 uppercase tracking-wider block">
              Subsistemas Reportados
            </span>
            {Object.entries(status.components).map(([name, comp]) => (
              <div
                key={name}
                className="p-2 rounded bg-odin-surface border border-odin-graphite-800 flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <Server className="w-3 h-3 text-odin-orange-400" />
                  <span className="font-bold text-odin-graphite-200 uppercase">{name}</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    comp.status === 'ok'
                      ? 'bg-odin-emerald-500/15 text-odin-emerald-400 border border-odin-emerald-500/30'
                      : 'bg-odin-crimson-500/15 text-odin-crimson-400 border border-odin-crimson-500/30'
                  }`}
                >
                  {comp.status}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="p-2.5 rounded-lg bg-odin-surface-elevated/40 border border-odin-graphite-800/80 text-[10px] text-odin-graphite-400 space-y-1">
          <div className="flex justify-between">
            <span>Versão da API:</span>
            <span className="text-odin-orange-400 font-bold">{status?.version || '2.4.0'}</span>
          </div>
          <div className="flex justify-between">
            <span>Última verificação:</span>
            <span>{status?.timestamp ? formatRelativeTime(status.timestamp) : 'recente'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
