import type { FC } from 'react';
import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { machineConfigReference } from '@console/internal/components/machine-config';
import {
  Selector,
  DetailsItem,
  ResourceLink,
  SectionHeading,
} from '@console/internal/components/utils';
import { NodeModel } from '@console/internal/models';
import type { MachineConfigPoolKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';

type MachineConfigPoolSummaryProps = {
  obj?: MachineConfigPoolKind;
  loadError?: any;
};

const MachineConfigPoolSummary: FC<MachineConfigPoolSummaryProps> = ({ obj, loadError }) => {
  const { t } = useTranslation('console-app');
  const maxUnavailable = obj?.spec?.maxUnavailable ?? 1;
  const machineConfigSelector = obj?.spec?.machineConfigSelector;

  return (
    <>
      <SectionHeading text={t('MachineConfigPool')} />
      {loadError ? (
        <Alert isInline variant="danger" title={t('MachineConfigPools are not available')}>
          {loadError.message || t('Unable to load MachineConfigPool resources')}
        </Alert>
      ) : !obj ? (
        <Alert variant="info" title={t('This node has no associated MachineConfigPool.')} />
      ) : (
        <DescriptionList>
          <DetailsItem label={t('Name')} obj={obj}>
            <ResourceLink
              groupVersionKind={getGroupVersionKindForResource(obj)}
              name={obj.metadata.name}
            />
          </DetailsItem>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Max unavailable machines')}</DescriptionListTerm>
            <DescriptionListDescription>{maxUnavailable}</DescriptionListDescription>
          </DescriptionListGroup>
          <DetailsItem label={t('Paused')} obj={obj} path={'spec.paused'}>
            {obj?.spec?.paused ? t('True') : t('False')}
          </DetailsItem>
          <DetailsItem label={t('Node selector')} obj={obj} path="spec.nodeSelector">
            <Selector kind={referenceForModel(NodeModel)} selector={obj?.spec?.nodeSelector} />
          </DetailsItem>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('MachineConfig selector')}</DescriptionListTerm>
            <DescriptionListDescription>
              <Selector kind={machineConfigReference} selector={machineConfigSelector} />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      )}
    </>
  );
};

export default MachineConfigPoolSummary;
