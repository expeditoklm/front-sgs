import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import { ProvisioningJob, SaaSPlan, SchoolApplication, Subscription, Tenant } from '../models/saas.models';

@Injectable({ providedIn: 'root' })
export class SaasService {
  private readonly endpoint = `${environment.apiUrl}/saas`;
  constructor(private readonly http: HttpClient) {}

  tenants(): Observable<Tenant[]> {
    return this.http.get<ApiResponse<Tenant[]>>(`${this.endpoint}/tenants`).pipe(map(r => r.data ?? []));
  }
  publicTenants(): Observable<Tenant[]> {
    return this.http.get<ApiResponse<Tenant[]>>(`${this.endpoint}/public/tenants`).pipe(map(r => r.data ?? []));
  }
  publicPlans(): Observable<SaaSPlan[]> {
    return this.http.get<ApiResponse<SaaSPlan[]>>(`${this.endpoint}/public/plans`).pipe(map(r => r.data ?? []));
  }
  applyForSchool(payload: SchoolApplication): Observable<Tenant> {
    return this.http.post<ApiResponse<Tenant>>(`${this.endpoint}/public/school-applications`, payload).pipe(map(r => r.data));
  }
  askPublicAssistant(message: string, history: Array<{role: 'user' | 'assistant'; content: string}>): Observable<{answer: string; aiPowered: boolean}> {
    return this.http.post<ApiResponse<{answer: string; aiPowered: boolean}>>(`${this.endpoint}/public/assistant/chat`, { message, history }).pipe(map(r => r.data));
  }
  sendPublicSupportMessage(payload: {name: string; email: string; subject: string; message: string}): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.endpoint}/public/support/messages`, payload).pipe(map(() => void 0));
  }
  createTenant(payload: Partial<Tenant>): Observable<Tenant> {
    return this.http.post<ApiResponse<Tenant>>(`${this.endpoint}/tenants`, payload).pipe(map(r => r.data));
  }
  plans(): Observable<SaaSPlan[]> {
    return this.http.get<ApiResponse<SaaSPlan[]>>(`${this.endpoint}/plans`).pipe(map(r => r.data ?? []));
  }
  createPlan(payload: Partial<SaaSPlan>): Observable<SaaSPlan> {
    return this.http.post<ApiResponse<SaaSPlan>>(`${this.endpoint}/plans`, payload).pipe(map(r => r.data));
  }
  updatePlan(id: string, payload: Partial<SaaSPlan>): Observable<SaaSPlan> {
    return this.http.put<ApiResponse<SaaSPlan>>(`${this.endpoint}/plans/${id}`, payload).pipe(map(r => r.data));
  }
  currentSubscription(): Observable<Subscription | null> {
    return this.http.get<ApiResponse<Subscription | null>>(`${this.endpoint}/subscriptions/current`).pipe(map(r => r.data));
  }
  subscriptions(tenantId: string): Observable<Subscription[]> {
    return this.http.get<ApiResponse<Subscription[]>>(`${this.endpoint}/tenants/${tenantId}/subscriptions`).pipe(map(r => r.data ?? []));
  }
  subscribe(payload: {tenantId: string; planId: string; status: Subscription['status']; startsAt: string; endsAt?: string | null}): Observable<Subscription> {
    return this.http.post<ApiResponse<Subscription>>(`${this.endpoint}/subscriptions`, payload).pipe(map(r => r.data));
  }
  provision(tenantId: string): Observable<ProvisioningJob> {
    return this.http.post<ApiResponse<ProvisioningJob>>(`${this.endpoint}/tenants/${tenantId}/provision`, {}).pipe(map(r => r.data));
  }
  approveSchool(tenantId: string): Observable<ProvisioningJob> {
    return this.http.post<ApiResponse<ProvisioningJob>>(`${this.endpoint}/tenants/${tenantId}/approve`, {}).pipe(map(r => r.data));
  }
  rejectSchool(tenantId: string, reason: string): Observable<Tenant> {
    return this.http.post<ApiResponse<Tenant>>(`${this.endpoint}/tenants/${tenantId}/reject`, { reason }).pipe(map(r => r.data));
  }
  sendAdministratorInvitation(tenantId: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.endpoint}/tenants/${tenantId}/administrator/invitation`, {})
      .pipe(map(() => void 0));
  }
  provisioningJobs(tenantId: string): Observable<ProvisioningJob[]> {
    return this.http.get<ApiResponse<ProvisioningJob[]>>(`${this.endpoint}/tenants/${tenantId}/provisioning-jobs`).pipe(map(r => r.data ?? []));
  }
}
