/**
 * TypeScript types mapping 1:1 với Database Schema.
 * Tuân thủ AGENTS.md Quy Tắc 3: Khi thay đổi cột trong DB, BẮT BUỘC cập nhật file này.
 */

// ==================== Row Types ====================

export interface School {
  id: string;
  school_name: string;
  school_code: string;
  created_at: string;
}

export interface PricingPackage {
  id: string;
  package_name: string;
  subject: string;
  subject_id: string | null; // FK to subjects table
  price: number;
  sessions_count: number;
  duration_type: string; // 'Month' | 'Period'
  print_ticket: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  full_name: string;
  dob: string | null;
  class_name: string | null;
  phone_number: string | null;
  school_id: string | null;
  other_school_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface Registration {
  id: string;
  student_id: string;
  package_id: string;
  card_code: string; // Format: HE26<MÃ TRƯỜNG><MÃ NGẪU NHIÊN 6 KÝ TỰ>
  status: string; // 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  remaining_sessions: number | null;
  shift_id?: string | null; // liên kết với ca học
  is_card_issued: boolean;
  card_reissue_count: number;
  receipt_number: string | null;
  payment_method_id: string | null;
  created_at: string;
}

export interface Shift {
  id: string;
  shift_name: string;
  start_time: string; // TIME format: HH:MM
  end_time: string;   // TIME format: HH:MM
  subject: string;
  subject_id: string | null; // FK to subjects table
  days_of_week: string[]; // e.g. ['T2','T4','T6']
  room_name?: string; // Thông tin phòng học
  created_at: string;
}

export interface CheckinLog {
  id: string;
  registration_id: string;
  card_code: string;
  ticket_code: string; // Format: HE26 + 8 ký tự ngẫu nhiên
  sessions_before: number;
  sessions_after: number;
  checked_in_at: string;
}

export interface Subject {
  id: string;
  subject_name: string;
  description: string | null;
  icon: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_code: string;
  account_number: string;
  account_holder: string;
  branch: string | null;
  is_default: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  method_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Staff {
  id: string;
  full_name: string;
  username: string;
  phone_number: string | null;
  role: 'ADMIN' | 'STAFF' | 'ACCOUNTANT';
  password?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

// ==================== Insert Types (omit auto-generated fields) ====================

export type SchoolInsert = Omit<School, "id" | "created_at">;
export type PricingPackageInsert = Omit<PricingPackage, "id" | "created_at">;
export type StudentInsert = Omit<Student, "id" | "created_at">;
export type RegistrationInsert = Omit<Registration, "id" | "created_at">;
export type ShiftInsert = Omit<Shift, "id" | "created_at">;
export type CheckinLogInsert = Omit<CheckinLog, "id" | "checked_in_at">;
export type SubjectInsert = Omit<Subject, "id" | "created_at">;
export type BankAccountInsert = Omit<BankAccount, "id" | "created_at">;
export type PaymentMethodInsert = Omit<PaymentMethod, "id" | "created_at">;
export type StaffInsert = Omit<Staff, "id" | "created_at">;

// ==================== Update Types (all fields optional) ====================

// Batch interfaces
export interface BatchCheckin {
  id: string;
  shift_id: string;
  performed_by_id: string;
  performed_at: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface CheckinBatchEntry {
  log_id: string;
  student_name: string;
  school_name: string;
  subject_name: string;
  sessions_used: number;
  sessions_total: number;
  location: { lat: number; lng: number };
  performed_by_name: string;
  performed_by_username: string;
}

export type SchoolUpdate = Partial<SchoolInsert>;
export type PricingPackageUpdate = Partial<PricingPackageInsert>;
export type StudentUpdate = Partial<StudentInsert>;
export type RegistrationUpdate = Partial<RegistrationInsert>;
export type ShiftUpdate = Partial<ShiftInsert>;
export type SubjectUpdate = Partial<SubjectInsert>;
export type BankAccountUpdate = Partial<BankAccountInsert>;
export type PaymentMethodUpdate = Partial<PaymentMethodInsert>;
export type StaffUpdate = Partial<StaffInsert>;

// ==================== Supabase Database Type (for typed client) ====================

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: School;
        Insert: SchoolInsert;
        Update: SchoolUpdate;
      };
      pricing_packages: {
        Row: PricingPackage;
        Insert: PricingPackageInsert;
        Update: PricingPackageUpdate;
      };
      students: {
        Row: Student;
        Insert: StudentInsert;
        Update: StudentUpdate;
      };
      registrations: {
        Row: Registration;
        Insert: RegistrationInsert;
        Update: RegistrationUpdate;
      };
      shifts: {
        Row: Shift;
        Insert: ShiftInsert;
        Update: ShiftUpdate;
      };
      checkin_logs: {
        Row: CheckinLog;
        Insert: CheckinLogInsert;
        Update: Partial<CheckinLogInsert>;
      };
      subjects: {
        Row: Subject;
        Insert: SubjectInsert;
        Update: SubjectUpdate;
      };
      bank_accounts: {
        Row: BankAccount;
        Insert: BankAccountInsert;
        Update: BankAccountUpdate;
      };
      payment_methods: {
        Row: PaymentMethod;
        Insert: PaymentMethodInsert;
        Update: PaymentMethodUpdate;
      };
      staffs: {
        Row: Staff;
        Insert: StaffInsert;
        Update: StaffUpdate;
      };
      batch_checkins: {
        Row: BatchCheckin;
        Insert: Omit<BatchCheckin, "id" | "performed_at">;
        Update: Partial<Omit<BatchCheckin, "id" | "performed_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
