export type AgentId = 'discovery' | 'estimator' | 'operations';

export type DispatchPath = 'AUTO' | 'REQUIRES_HUMAN_REVIEW';

// Universal category string to support ANY industry or business type
export type IndustryCategory = string;

export type LeadStatus = 
  | 'intake_received'
  | 'pending_owner_approval'
  | 'owner_approved_awaiting_payment'
  | 'estimate_delivered'
  | 'deposit_paid'
  | 'escalated'
  | 'declined_out_of_area';

export interface PricingMatrix {
  industry_category: string;
  category_name?: string;
  base_fee: number;
  hourly_rate: number;
  material_base_cost: number;
  standard_complexity_min: number;
  standard_complexity_max: number;
  autopay_threshold: number;
  deposit_percentage: number;
  service_zip_codes: string[];
  safety_flag_keywords: string[];
}

export interface PricingBreakdown {
  base_fee: number;
  estimated_hours: number;
  hourly_rate: number;
  materials_est: number;
  complexity_factor: number;
  min_quote: number;
  max_quote: number;
  deposit_amount: number;
}

export interface StructuredExecutionLog {
  id?: string;
  timestamp: string;
  agent_id: AgentId;
  customer_id: string;
  decision: string;
  pricing_breakdown: Partial<PricingBreakdown>;
  action_taken: string;
  safety_flags?: string[];
  zip_valid?: boolean;
  industry?: string;
}

export interface Lead {
  id: string;
  customer_id: string;
  full_name: string;
  email: string;
  phone: string;
  zip_code: string;
  industry_category: string;
  project_type: string;
  preferred_timeline: string;
  scope: string;
  photo_url?: string;
  dispatch_path: DispatchPath;
  status: LeadStatus;
  pricing_breakdown?: PricingBreakdown;
  safety_flags: string[];
  stripe_payment_link?: string;
  stripe_invoice_id?: string;
  calendar_slot?: string;
  assigned_owner_name?: string;
  assigned_owner_email?: string;
  assigned_owner_phone?: string;
  created_at: string;
  notes?: string;
}

export interface BusinessConfig {
  business_name: string;
  industry_category: string;
  service_type: string;
  service_area_zips: string[];
  pricing_matrix: PricingMatrix;
}

export interface CustomServiceOffering {
  id: string;
  name: string;
  desc: string;
  baseFee: number;
  hourlyRate: number;
  ownerEmail?: string;
}
