export type Role = 'admin' | 'doctor' | 'receptionist';

export interface User {
  id: number;
  name: string;
  username: string;
  role: Role;
  is_active?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: Role;
  name: string;
}

export interface Service {
  id: number;
  name: string;
  category?: string;
  price: number;
  is_active: boolean;
}

export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  expiry_date?: string;
  cost_price?: number;
  updated_at: string;
}

export interface InventoryLog {
  id: number;
  item_id: number;
  change_qty: number;
  reason?: string;
  performed_by?: number;
  created_at: string;
}

export interface Appointment {
  id: number;
  owner_id: number;
  pet_id: number;
  appointment_date: string;
  appointment_time: string;
  type: 'walk-in' | 'scheduled';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  owner_name?: string;
  pet_name?: string;
}

export interface Owner {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface Pet {
  id: number;
  owner_id: number;
  name: string;
  species: string;
  breed?: string;
  age?: number;
}

export interface MedicalRecord {
  id: number;
  appointment_id: number;
  doctor_id: number;
  diagnosis: string;
  symptoms?: string;
  treatment?: string;
  prescription?: string;
  notes?: string;
  created_at: string;
  // Enriched fields
  pet_name?: string;
  pet_id?: number;
  owner_name?: string;
  owner_id?: number;
  doctor_name?: string;
  appointment_date?: string;
  species?: string;
}

export interface InvoiceItem {
  id: number;
  service_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Invoice {
  id: number;
  appointment_id: number;
  owner_id: number;
  total_amount: number;
  discount_pct: number;
  final_amount: number;
  payment_status: string;
  payment_method?: string;
  created_at: string;
  items: InvoiceItem[];
}

export interface NotificationLog {
  id: number;
  owner_id: number;
  appointment_id?: number;
  channel: string;
  message: string;
  status: string;
  sent_at: string;
}

export interface DashboardStats {
  todays_appointments: number;
  total_revenue_today: number;
  low_stock_count: number;
  active_staff: number;
}

export interface RevenueData {
  date: string;
  amount: number;
}

export interface ServiceUsage {
  service_name: string;
  count: number;
  revenue: number;
}

export interface AppointmentStats {
  total: number;
  completed: number;
  cancelled: number;
  walk_in: number;
  scheduled: number;
}

export interface StaffCreateRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  role: 'doctor' | 'receptionist';
}

export interface InvoiceItemInput {
  service_id: number;
  quantity: number;
}

export interface InvoiceCreateRequest {
  appointment_id: number;
  owner_id: number;
  items: InvoiceItemInput[];
  discount_pct?: number;
}

export interface NotificationSendRequest {
  owner_id: number;
  appointment_id?: number;
  channel: string;
  message: string;
}

export interface ExpiryAlertItem {
  id: number;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  expiry_date?: string;
  days_until_expiry: number;
  alert_level: 'expired' | 'critical' | 'warning' | 'upcoming';
}

export interface ExpiryAlertSummary {
  expired: ExpiryAlertItem[];
  critical: ExpiryAlertItem[];
  warning: ExpiryAlertItem[];
  upcoming: ExpiryAlertItem[];
  total_alerts: number;
}
