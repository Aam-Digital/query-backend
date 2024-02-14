import { Reference } from '../../domain/reference';
import { WebhookConfigurationDto } from '../controller/dtos';

export interface Webhook extends WebhookConfiguration {
  id: string;
  name: string; // TODO: why name?

  reportSubscriptions: Reference[];
}

export type WebhookConfiguration = WebhookConfigurationDto;
