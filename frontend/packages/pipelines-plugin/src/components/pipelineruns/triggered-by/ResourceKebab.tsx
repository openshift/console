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
  return (
    <Kebab
      options={options}
      key={resource.metadata.uid}
      isDisabled={isDisabled ?? options.length === 0}
      terminatingTooltip={
        _.has(resource.metadata, 'deletionTimestamp')
          ? terminatingTooltip || t('pipelines-plugin~Resource is being deleted.')
          : ''
      }
    />
  );
});
