import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { EventListenerModel } from '../../../models';
import { getResourceModelFromBindingKind } from '../../../utils/pipeline-augment';
import ResourceLinkList from '../resource-overview/ResourceLinkList';
import { TriggerBindingKind } from '../resource-types';
import { useTriggerBindingEventListenerNames } from '../utils/triggers';

export interface TriggerBindingDetailsProps {
  obj: TriggerBindingKind;
}

const TriggerBindingDetails: React.FC<TriggerBindingDetailsProps> = ({ obj: triggerBinding }) => {
  const { t } = useTranslation();
  const eventListeners: string[] = useTriggerBindingEventListenerNames(triggerBinding);
  return (
    <div className="co-m-pane__body">
      <SectionHeading
        text={t('pipelines-plugin~{{triggerBindingLabel}} details', {
          triggerBindingLabel: t(getResourceModelFromBindingKind(triggerBinding.kind).labelKey),
        })}
      />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={triggerBinding} />
        </div>
        <div className="col-sm-6">
          <ResourceLinkList
            namespace={triggerBinding.metadata.namespace}
            model={EventListenerModel}
            links={eventListeners}
          />
        </div>
      </div>
    </div>
  );
};

export default TriggerBindingDetails;
