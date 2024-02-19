import { Reference } from '../../domain/reference';

export interface WebhookDto {
  id: string;
  name: string;
  target: {
    method: 'GET' | 'POST';
    url: string;
  };
  authenticationType: 'API_KEY';
  reportSubscriptions: Reference[];
}

export interface CreateWebhookDto {
  label: string;
  target: {
    method: 'GET' | 'POST';
    url: string;
  };
  authentication: ApiKeyAuthConfig;
}

export interface ApiKeyAuthConfig {
  type: 'API_KEY';
  apiKey: string;
}
