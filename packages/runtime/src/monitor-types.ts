export type MonitorType = 'http' | 'keyword' | 'ping' | 'port' | 'heartbeat' | 'ssl' | 'domain' | 'dns' | 'api';
export interface ApiStep {
  url: string; method?: 'GET' | 'POST'; headers?: Record<string,string>; body?: string;
  expectedStatus?: number; contains?: string; extract?: { name: string; path: string[] }[];
}
export interface MonitorConfig {
  type: MonitorType; target: string; configurationError?: 'CREDENTIALS_UNCONFIGURED'; timeoutMs?: number; port?: number;
  expectedStatus?: number; keyword?: string; keywordAbsent?: boolean; expiryWarningDays?: number;
  dnsRecord?: 'A' | 'AAAA' | 'MX' | 'TXT'; expectedValue?: string; steps?: ApiStep[];
  heartbeatLastSeenAt?: string | null; heartbeatIntervalSeconds?: number; heartbeatGraceSeconds?: number;
}
export interface ProbeResult {
  state: 'up' | 'down' | 'degraded' | 'unknown'; durationMs: number | null;
  statusCode: number | null; errorCode: string | null; observedAt: Date; expiresAt?: Date;
}
export type ChannelType = 'email' | 'sms' | 'voice' | 'slack' | 'teams' | 'discord' | 'telegram' | 'whatsapp' | 'pagerduty' | 'opsgenie' | 'webhook' | 'push';
export interface DeliveryJob {
  id: string; channel: ChannelType; destination: string; credentials: Record<string, string>;
  subject: string; message: string; event: 'alert' | 'recovery' | 'test' | 'summary'; incidentId?: string;
}
