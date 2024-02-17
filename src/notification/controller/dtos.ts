export interface WebhookDto {
  id: string;
  name: string;
  target: {
    method: 'GET' | 'POST';
    url: string;
  };
  authenticationType: 'API_KEY';
}

export interface CreateWebhookDto {
  label: string;
  target: {
    method: 'GET' | 'POST';
    url: string;
  };
  authentication: {
    type: 'API_KEY';
    apiKey: string;
  };
}

export interface ApiKeyAuthConfig {
  key: string;
  headerName: string;
}
