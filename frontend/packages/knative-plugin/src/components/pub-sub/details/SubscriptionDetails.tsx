import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Conditions } from '@console/internal/components/conditions';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import DynamicResourceLink from './DynamicResourceLink';

interface SubscriptionDetails {
  obj: K8sResourceKind;
}

const SubscriptionDetails: React.FC<SubscriptionDetails> = ({ obj: subscription }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('knative-plugin~Subscription details')} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={subscription} />
          </div>
          <div className="col-sm-6">
            {subscription.spec?.channel?.kind && (
              <DynamicResourceLink
                title={t('knative-plugin~Channel')}
                name={subscription.spec.channel.name}
                namespace={subscription.metadata.namespace}
                kind={referenceFor(subscription.spec.channel)}
              />
            )}
            {subscription.spec?.subscriber?.ref && (
              <DynamicResourceLink
                title={t('knative-plugin~Subscriber')}
                name={subscription.spec.subscriber.ref.name}
                namespace={subscription.metadata.namespace}
                kind={referenceFor(subscription.spec.subscriber.ref)}
              />
            )}
          </div>
        </div>
      </div>
      {_.isArray(subscription?.status?.conditions) && (
        <div className="co-m-pane__body">
          <SectionHeading text={t('knative-plugin~Conditions')} />
          <Conditions conditions={subscription.status.conditions} />
        </div>
      )}
    </>
  );
};

export default SubscriptionDetails;
