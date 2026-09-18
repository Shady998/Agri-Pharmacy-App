import { Injectable, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable({ scope: Scope.DEFAULT })
export class TenantContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<string>();

  run<R>(tenantId: string, callback: () => R): R {
    return this.asyncLocalStorage.run(tenantId, callback);
  }

  getTenantId(): string | undefined {
    return this.asyncLocalStorage.getStore();
  }

  getTenantIdOrThrow(): string {
    const tenantId = this.asyncLocalStorage.getStore();
    if (!tenantId) {
      throw new Error('Tenant context not available. Ensure request passes through TenantGuard.');
    }
    return tenantId;
  }
}