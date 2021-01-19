import {
  RevisionModel,
  ServiceModel,
  RouteModel,
  EventingBrokerModel,
  EventingTriggerModel,
  EventingSubscriptionModel,
} from '../models';

export const serverlessTab = (kind: string) => {
  switch (kind) {
    case ServiceModel.kind:
    case 'EventSource':
      return '';
    case RevisionModel.kind:
      return 'revisions';
    case RouteModel.kind:
      return 'routes';
    case EventingBrokerModel.kind:
      return 'brokers';
    case EventingTriggerModel.kind:
      return 'triggers';
    case EventingSubscriptionModel.kind:
      return 'subscriptions';
    case 'Channel':
      return 'channels';
    default:
      return null;
  }
};
