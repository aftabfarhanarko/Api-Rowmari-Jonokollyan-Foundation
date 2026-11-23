export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VERIFIED = 'VERIFIED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ApplicationCategory {
  MEDICAL = 'MEDICAL',
  EDUCATION = 'EDUCATION',
  DISASTER_RELIEF = 'DISASTER_RELIEF',
  WIDOW_ORPHAN = 'WIDOW_ORPHAN',
  HOUSING = 'HOUSING',
  FOOD_AID = 'FOOD_AID',
  OTHER = 'OTHER',
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

export enum BloodRequestUrgency {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

export enum BloodRequestStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum DonorMatchStatus {
  PENDING = 'PENDING',
  CONTACTED = 'CONTACTED',
  AGREED = 'AGREED',
  DECLINED = 'DECLINED',
  DONATED = 'DONATED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum DonationStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  SSLCOMMERZ = 'SSLCOMMERZ',
  OTHER = 'OTHER',
}

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum NotificationChannel {
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  BLOOD_COORDINATOR = 'BLOOD_COORDINATOR',
  MEDICAL_COORDINATOR = 'MEDICAL_COORDINATOR',
  EDUCATION_COORDINATOR = 'EDUCATION_COORDINATOR',
  VOLUNTEER_MANAGER = 'VOLUNTEER_MANAGER',
  VOLUNTEER_COORDINATOR = 'VOLUNTEER_COORDINATOR',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  CASE_WORKER = 'CASE_WORKER',
  COMMUNITY_MEMBER = 'COMMUNITY_MEMBER',
}

export const PERMISSION_KEYS = {
  // Applications
  APPLICATIONS_VIEW: 'applications.view',
  APPLICATIONS_ASSIGN: 'applications.assign',
  APPLICATIONS_REVIEW: 'applications.review',
  APPLICATIONS_APPROVE: 'applications.approve',
  APPLICATIONS_REJECT: 'applications.reject',
  // Donors & Blood
  DONORS_VIEW_PRIVATE: 'donors.view_private',
  DONORS_VERIFY: 'donors.verify',
  BLOOD_REQUESTS_MANAGE: 'blood_requests.manage',
  // Volunteers & Camps
  VOLUNTEERS_MANAGE: 'volunteers.manage',
  CAMPS_MANAGE: 'camps.manage',
  // Campaigns & Content
  CAMPAIGNS_CREATE: 'campaigns.create',
  CAMPAIGNS_MANAGE: 'campaigns.manage',
  CONTENT_MANAGE: 'content.manage',
  // Finance & Donations
  DONATIONS_VIEW: 'donations.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_APPROVE: 'expenses.approve',
  // Administration
  ROLES_MANAGE: 'roles.manage',
  USERS_MANAGE: 'users.manage',
  AUDIT_LOGS_VIEW: 'audit_logs.view',
  REPORTS_VIEW: 'reports.view',
} as const;
