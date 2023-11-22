import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Kebab, ResourceKebabProps } from '@console/internal/components/utils';
import { connectToModel } from '@console/internal/kinds';

export const ResourceKebab = connectToModel((props: ResourceKebabProps) => {
  const { t } = useTranslation();
  const { actions, kindObj, resource, isDisabled, customData, terminatingTooltip } = props;
  if (!kindObj) {
    return null;
  }
  const options = _.reject(
    actions.map((a) => a(kindObj, resource, null, customData)),
    'hidden',
  );
  const isResourceLoadedFromTR =
    resource?.metadata?.annotations?.['resource.loaded.from.tektonResults'];
  const isResourceDeletedInK8s = resource?.metadata?.annotations?.['resource.deleted.in.k8s'];
  return (
    <Kebab
      options={options}
      key={resource.metadata.uid}
      isDisabled={
        isDisabled ??
        ((_.has(resource.metadata, 'deletionTimestamp') && !isResourceLoadedFromTR) ||
          options.length === 0)
      }
      terminatingTooltip={
        _.has(resource.metadata, 'deletionTimestamp') && !isResourceLoadedFromTR
          ? terminatingTooltip || t('pipelines-plugin~Resource is being deleted.')
          : isResourceDeletedInK8s
          ? t('pipelines-plugin~Resource is being fetched from Tekton Results.')
          : ''
      }
    />
  );
});
