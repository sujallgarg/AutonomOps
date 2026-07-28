import { AgentId, StructuredExecutionLog, PricingBreakdown } from '@/types/agent';

const LOG_STORAGE_KEY = 'autonomops_execution_logs';

export function createExecutionLog(
  agentId: AgentId,
  customerId: string,
  decision: string,
  pricingBreakdown: Partial<PricingBreakdown>,
  actionTaken: string,
  safetyFlags?: string[],
  zipValid?: boolean
): StructuredExecutionLog {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    agent_id: agentId,
    customer_id: customerId,
    decision,
    pricing_breakdown: pricingBreakdown,
    action_taken: actionTaken,
    safety_flags: safetyFlags || [],
    zip_valid: zipValid ?? true
  };
}

// In-memory fallback array for SSR or initial state
let memoryLogs: StructuredExecutionLog[] = [
  {
    id: 'log_init_01',
    timestamp: '2026-07-26T09:40:12.184Z',
    agent_id: 'discovery',
    customer_id: 'cust_johndoe_12202',
    decision: 'INTAKE_VALIDATED',
    pricing_breakdown: {},
    action_taken: 'Service ZIP 12202 verified within coverage area. Forwarding scope to estimator.',
    zip_valid: true
  },
  {
    id: 'log_init_02',
    timestamp: '2026-07-26T09:40:15.820Z',
    agent_id: 'estimator',
    customer_id: 'cust_johndoe_12202',
    decision: 'ESTIMATE_GENERATED_AUTO_DISPATCH',
    pricing_breakdown: {
      base_fee: 150,
      estimated_hours: 2,
      hourly_rate: 95,
      materials_est: 145,
      complexity_factor: 1.2,
      min_quote: 341.2,
      max_quote: 415.5,
      deposit_amount: 85.3
    },
    action_taken: 'Matched scope against pricing matrix. Calculated quote $341.2-$415.5. Auto dispatch path approved.',
    safety_flags: []
  },
  {
    id: 'log_init_03',
    timestamp: '2026-07-26T09:40:18.905Z',
    agent_id: 'operations',
    customer_id: 'cust_johndoe_12202',
    decision: 'STRIPE_INVOICE_CREATED',
    pricing_breakdown: {
      min_quote: 341.2,
      deposit_amount: 85.3
    },
    action_taken: 'Called stripe.invoices.create for 25% deposit ($85.30). Checkout URL delivered to customer.'
  }
];

export function getLogs(): StructuredExecutionLog[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read execution logs from localStorage', e);
    }
  }
  return memoryLogs;
}

export function saveLog(log: StructuredExecutionLog): StructuredExecutionLog[] {
  memoryLogs = [log, ...memoryLogs];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(memoryLogs));
    } catch (e) {
      console.error('Failed to persist execution log', e);
    }
  }
  return memoryLogs;
}

export function clearLogs(): StructuredExecutionLog[] {
  memoryLogs = [];
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOG_STORAGE_KEY);
  }
  return [];
}
