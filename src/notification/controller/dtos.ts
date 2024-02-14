export interface WebhookDto {}

export interface WebhookConfigurationDto {
  name: string;
  method: 'GET' | 'POST';
  targetUrl: string;
  authenticationType: 'API_KEY';
  authentication: ApiKeyAuthConfig;
}

export interface ApiKeyAuthConfig {
  key: string;
  headerName: string;
}
