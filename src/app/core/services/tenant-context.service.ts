import { Injectable, signal } from '@angular/core';
import { Tenant } from '../models/saas.models';

const TENANT_KEY = 'sgs_tenant';

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  readonly tenant = signal<Tenant | null>(this.read());

  select(tenant: Tenant): void {
    localStorage.setItem(TENANT_KEY, JSON.stringify(tenant));
    this.tenant.set(tenant);
  }

  clear(): void {
    localStorage.removeItem(TENANT_KEY);
    this.tenant.set(null);
  }

  get tenantId(): string | null {
    return this.tenant()?.id ?? null;
  }

  private read(): Tenant | null {
    try {
      const value = localStorage.getItem(TENANT_KEY);
      return value ? JSON.parse(value) as Tenant : null;
    } catch {
      localStorage.removeItem(TENANT_KEY);
      return null;
    }
  }
}
