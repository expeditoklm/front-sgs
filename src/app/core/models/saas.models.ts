export type TenantStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PROVISIONING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'FAILED';

export interface Tenant {
  id: string;
  uuid: string;
  code: string;
  name: string;
  email?: string | null;
  status: TenantStatus;
  createdAt?: string;
  founderName?: string | null;
  contactPhone?: string | null;
  rejectionReason?: string | null;
}

export interface SchoolApplication {
  slug: string;
  schoolName: string;
  founderName: string;
  email: string;
  phone: string;
  planId: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export interface SaaSPlan {
  id: string;
  uuid: string;
  code: string;
  name: string;
  description?: string | null;
  monthlyPrice: number;
  currency: string;
  maxUsers?: number | null;
  active: boolean;
  features: string[];
}

export interface Subscription {
  id: string;
  uuid: string;
  tenantId: string;
  tenantName?: string;
  planId: string;
  planName?: string;
  status: 'PENDING' | 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';
  startsAt: string;
  endsAt?: string | null;
  trialEndsAt?: string | null;
}

export type ProvisioningStatus = 'PENDING' | 'DB_CREATING' | 'MIGRATING' | 'SEEDING' | 'ACTIVE' | 'FAILED';

export interface ProvisioningJob {
  id: string;
  tenantId: string;
  status: ProvisioningStatus;
  attemptCount: number;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}
