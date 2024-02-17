import { Reference } from '../../domain/reference';

export interface Webhook {
  id: string;
  label: string;
  target: {
    method: 'GET' | 'POST';
    url: string;
  };
  authentication: {
    type: 'API_KEY';
    apiKey: string;
  };
  owner: {
    type: 'USER'; // TODO: group support?
    id: string;
  };
  reportSubscriptions: Reference[];
}

export interface CreateWebhookRequest {
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
