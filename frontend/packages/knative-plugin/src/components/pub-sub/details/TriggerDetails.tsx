import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Conditions } from '@console/internal/components/conditions';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { EventingBrokerModel } from '../../../models';
import { getTriggerFilters } from '../../../topology/knative-topology-utils';
import FilterTable from '../../overview/FilterTable';
import DynamicResourceLink from './DynamicResourceLink';

import './DynamicResourceLink.scss';

interface TriggerDetailsProps {
  obj: K8sResourceKind;
}

const TriggerDetails: React.FC<TriggerDetailsProps> = ({ obj: trigger }) => {
  const { t } = useTranslation();
  const { filters: filterData } = getTriggerFilters(trigger);
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('knative-plugin~Trigger details')} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={trigger} />
          </div>
          <div className="col-sm-6">
            {filterData.length > 0 && (
              <div className="kn-resource-link-list kn-resource-link-list--addSpaceBelow">
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('knative-plugin~Filter')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <FilterTable filters={filterData} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </div>
            )}
            {trigger.spec?.broker && (
              <DynamicResourceLink
                title={t('knative-plugin~Broker')}
                name={trigger.spec.broker}
                namespace={trigger.metadata.namespace}
                kind={referenceForModel(EventingBrokerModel)}
              />
            )}
            {trigger.spec?.subscriber?.ref && (
              <DynamicResourceLink
                title={t('knative-plugin~Subscriber')}
                name={trigger.spec.subscriber.ref.name}
                namespace={trigger.metadata.namespace}
                kind={referenceFor(trigger.spec.subscriber.ref)}
              />
            )}
          </div>
        </div>
      </PaneBody>
      {_.isArray(trigger?.status?.conditions) && (
        <PaneBody>
          <SectionHeading text={t('knative-plugin~Conditions')} />
          <Conditions conditions={trigger.status.conditions} />
        </PaneBody>
      )}
    </>
  );
};

export default TriggerDetails;
