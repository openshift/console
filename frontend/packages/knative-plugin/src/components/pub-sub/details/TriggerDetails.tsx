import * as React from 'react';
import * as _ from 'lodash';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { Conditions } from '@console/internal/components/conditions';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { EventingBrokerModel } from '../../../models';
import FilterTable from '../../overview/FilterTable';
import { getTriggerFilters } from '../../../topology/knative-topology-utils';
import DynamicResourceLink from './DynamicResourceLink';

import './DynamicResourceLink.scss';

interface TriggerDetailsProps {
  obj: K8sResourceKind;
}

const TriggerDetails: React.FC<TriggerDetailsProps> = ({ obj: trigger }) => {
  const { filters: filterData } = getTriggerFilters(trigger);
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Trigger Details" />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={trigger} />
          </div>
          <div className="col-sm-6">
            {filterData.length > 0 && (
              <div className="kn-resource-link-list kn-resource-link-list--addSpaceBelow">
                <dl>
                  <dt>Filter</dt>
                  <dd>
                    <FilterTable filters={filterData} />
                  </dd>
                </dl>
              </div>
            )}
            {trigger.spec?.broker && (
              <DynamicResourceLink
                title="Broker"
                name={trigger.spec.broker}
                namespace={trigger.metadata.namespace}
                kind={referenceForModel(EventingBrokerModel)}
              />
            )}
            {trigger.spec?.subscriber?.ref && (
              <DynamicResourceLink
                title="Subscriber"
                name={trigger.spec.subscriber.ref.name}
                namespace={trigger.metadata.namespace}
                kind={referenceFor(trigger.spec.subscriber.ref)}
              />
            )}
          </div>
        </div>
      </div>
      {_.isArray(trigger?.status?.conditions) && (
        <div className="co-m-pane__body">
          <SectionHeading text="Conditions" />
          <Conditions conditions={trigger.status.conditions} />
        </div>
      )}
    </>
  );
};

export default TriggerDetails;
