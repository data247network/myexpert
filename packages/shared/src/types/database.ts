// ─── Database Types — auto-kept in sync with Supabase schema ───────────────

export type UserRole = 'customer' | 'worker' | 'admin'

export type VerificationStatus = 'pending' | 'in_progress' | 'approved' | 'rejected'

export type JobStatus =
  | 'open' | 'bidding' | 'booked' | 'accepted'
  | 'en_route' | 'arrived' | 'in_progress'
  | 'done' | 'confirmed' | 'disputed' | 'cancelled'

export type EscrowStatus = 'none' | 'held' | 'released' | 'refunded' | 'disputed' | 'split'

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed'

export type DisputeOutcome =
  | 'refund_full' | 'split_50_50' | 'release_to_worker' | 'custom_split' | 'pending'

export type Penalty = 'none' | 'warn' | 'suspend_7d' | 'ban'

// ─── Table Row Types ────────────────────────────────────────────────────────

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  phone: string | null
  email: string | null
  state_lga: string | null
  avatar_url: string | null
  is_online: boolean
  is_active: boolean
  suspended_until: string | null
  created_at: string
  updated_at: string
}

export interface WorkerProfile {
  id: string
  primary_skill: string
  years_experience: number
  is_verified: boolean
  verification_status: VerificationStatus
  trust_score: number
  current_lat: number | null
  current_lng: number | null
  last_location_update: string | null
  rating: number
  total_reviews: number
  total_jobs: number
  available_balance: number
  escrow_balance: number
  bank_name: string | null
  bank_account_number: string | null
  bank_account_name: string | null
  created_at: string
  updated_at: string
}

export interface VerificationStep {
  id: string
  worker_id: string
  step_number: number
  step_name: string
  status: 'pending' | 'submitted' | 'under_review' | 'passed' | 'failed'
  data: Record<string, unknown>
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  submitted_at: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  icon: string | null
  is_active: boolean
  display_order: number
}

export interface Job {
  id: string
  customer_id: string
  worker_id: string | null
  category_id: string | null
  title: string
  description: string | null
  status: JobStatus
  urgency: 'normal' | 'urgent'
  scheduled_for: string | null
  location_address: string | null
  location_lat: number | null
  location_lng: number | null
  customer_quote: number | null
  final_price: number | null
  service_fee: number | null
  promo_code: string | null
  promo_discount: number
  escrow_amount: number | null
  escrow_status: EscrowStatus
  payment_method: 'card' | 'bank_transfer' | 'mock' | null
  created_at: string
  updated_at: string
}

export interface Bid {
  id: string
  job_id: string
  worker_id: string
  amount: number
  message: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at: string
}

export interface Review {
  id: string
  job_id: string
  reviewer_id: string
  worker_id: string
  rating: number
  tags: string[]
  comment: string | null
  is_public: boolean
  created_at: string
}

export interface Message {
  id: string
  job_id: string
  sender_id: string
  content: string | null
  photo_url: string | null
  is_read: boolean
  created_at: string
}

export interface EscrowLedger {
  id: string
  job_id: string
  customer_id: string
  worker_id: string
  gross_amount: number
  service_fee: number
  net_amount: number
  promo_discount: number
  status: EscrowStatus
  held_at: string
  released_at: string | null
  created_at: string
}

export interface Payout {
  id: string
  worker_id: string
  amount: number
  fee: number
  net_amount: number
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  status: PayoutStatus
  reference: string | null
  notes: string | null
  processed_by: string | null
  processed_at: string | null
  created_at: string
}

export interface Dispute {
  id: string
  job_id: string
  opened_by: string
  status: 'open' | 'under_review' | 'resolved'
  customer_claim: string | null
  worker_response: string | null
  outcome: DisputeOutcome | null
  outcome_amount_customer: number | null
  outcome_amount_worker: number | null
  penalty: Penalty | null
  penalised_user: string | null
  admin_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string | null
  type: string | null
  data: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export interface Promo {
  id: string
  code: string
  description: string | null
  discount_type: 'fixed' | 'percentage'
  discount_value: number
  max_uses: number | null
  used_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
}

// ─── Enriched / Joined Types ────────────────────────────────────────────────

export interface WorkerWithProfile extends WorkerProfile {
  profile: Profile
}

export interface JobWithDetails extends Job {
  customer?: Profile
  worker?: WorkerWithProfile
  category?: Category
  bids?: Bid[]
}

// ─── Verification Step Config ────────────────────────────────────────────────

export const VERIFICATION_STEPS = [
  { number: 1, name: 'NIN verification',    description: '11-digit National ID match' },
  { number: 2, name: 'Selfie & liveness',   description: 'Match face to NIN photo' },
  { number: 3, name: 'Address verification',description: 'Geo-pin + utility bill' },
  { number: 4, name: 'Skill certificate',   description: 'NABTEB / trade school / portfolio' },
  { number: 5, name: 'References (3)',       description: 'Past clients we can call' },
  // v2 steps:
  { number: 6, name: 'Social network check',description: 'We scan friends & locations visited' },
  { number: 7, name: 'Background check',    description: 'Police record (run by us)' },
  { number: 8, name: 'In-person interview', description: 'Admin reviews in person or by call' },
] as const

export const SERVICE_FEE_PERCENT = 10
export const DAILY_WITHDRAWAL_FEE = 100  // ₦100
