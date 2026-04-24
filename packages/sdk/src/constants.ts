export const DEMO_TENANT_ID = 'demo-tenant-id'

export function resolveTenantId(apiKey?: string | undefined): string {
  return apiKey ?? DEMO_TENANT_ID
}
