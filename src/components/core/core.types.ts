export type CoreState =
  | 'idle'
  | 'connecting'
  | 'thinking'
  | 'searching'
  | 'working'
  | 'queued'
  | 'waiting_approval'
  | 'stopping'
  | 'completed'
  | 'error'

export interface CoreVisualizerProps {
  state?: CoreState
  statusText?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showStatusBadge?: boolean
  interactive?: boolean
}

export interface StateVisualConfig {
  label: string
  color: string
  secondaryColor: string
  emissiveIntensity: number
  rotationSpeed: number
  pulseSpeed: number
  badgeClass: string
  description: string
}

export const CORE_STATE_CONFIGS: Record<CoreState, StateVisualConfig> = {
  idle: {
    label: 'STANDBY',
    color: '#FF6A00',
    secondaryColor: '#67DFFF',
    emissiveIntensity: 0.6,
    rotationSpeed: 0.4,
    pulseSpeed: 1.0,
    badgeClass: 'badge-primary',
    description: 'Sistema em espera operacional',
  },
  connecting: {
    label: 'SINCRONIZANDO',
    color: '#67DFFF',
    secondaryColor: '#FF9A3D',
    emissiveIntensity: 1.2,
    rotationSpeed: 1.5,
    pulseSpeed: 2.5,
    badgeClass: 'badge-cyan',
    description: 'Estabelecendo canal com gateway Hermes',
  },
  thinking: {
    label: 'PROCESSANDO',
    color: '#FF9A3D',
    secondaryColor: '#67DFFF',
    emissiveIntensity: 1.6,
    rotationSpeed: 1.2,
    pulseSpeed: 2.2,
    badgeClass: 'badge-primary',
    description: 'Raciocínio neural ativo',
  },
  searching: {
    label: 'BUSCA_TELEMETRIA',
    color: '#67DFFF',
    secondaryColor: '#FF6A00',
    emissiveIntensity: 1.8,
    rotationSpeed: 2.0,
    pulseSpeed: 3.0,
    badgeClass: 'badge-cyan',
    description: 'Vascularização de base de conhecimento',
  },
  working: {
    label: 'EXECUTANDO',
    color: '#FF6A00',
    secondaryColor: '#FFB829',
    emissiveIntensity: 2.0,
    rotationSpeed: 2.4,
    pulseSpeed: 3.5,
    badgeClass: 'badge-primary',
    description: 'Operação de ferramentas e subagentes',
  },
  queued: {
    label: 'NA_FILA',
    color: '#8E98A5',
    secondaryColor: '#FF9A3D',
    emissiveIntensity: 0.5,
    rotationSpeed: 0.3,
    pulseSpeed: 0.8,
    badgeClass: 'badge-neutral',
    description: 'Comando aguardando alocação de execução',
  },
  waiting_approval: {
    label: 'APROVAÇÃO_PENDENTE',
    color: '#F59E0B',
    secondaryColor: '#FF6A00',
    emissiveIntensity: 2.2,
    rotationSpeed: 0.6,
    pulseSpeed: 4.0,
    badgeClass: 'badge-warning',
    description: 'Ação crítica requer autorização do operador',
  },
  stopping: {
    label: 'INTERROMPENDO',
    color: '#EF4444',
    secondaryColor: '#F59E0B',
    emissiveIntensity: 1.4,
    rotationSpeed: 0.8,
    pulseSpeed: 1.5,
    badgeClass: 'badge-warning',
    description: 'Desacelerando ciclos de processamento',
  },
  completed: {
    label: 'CONCLUÍDO',
    color: '#10B981',
    secondaryColor: '#67DFFF',
    emissiveIntensity: 1.0,
    rotationSpeed: 0.5,
    pulseSpeed: 1.0,
    badgeClass: 'badge-success',
    description: 'Fluxo concluído com êxito',
  },
  error: {
    label: 'FALHA_OPERACIONAL',
    color: '#EF4444',
    secondaryColor: '#FF6A00',
    emissiveIntensity: 2.5,
    rotationSpeed: 0.2,
    pulseSpeed: 5.0,
    badgeClass: 'badge-error',
    description: 'Exceção ou interrupção de integridade',
  },
}
