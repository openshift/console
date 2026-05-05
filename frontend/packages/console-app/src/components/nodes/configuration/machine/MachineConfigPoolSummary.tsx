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
  const { t } = useTranslation();
  const maxUnavailable = obj?.spec?.maxUnavailable ?? 1;
  const machineConfigSelector = obj?.spec?.machineConfigSelector;

  return (
    <>
      <SectionHeading text={t('console-app~MachineConfigPool')} />
      {loadError ? (
        <Alert
          isInline
          variant="danger"
          title={t('console-app~MachineConfigPools are not available')}
        >
          {loadError.message || t('console-app~Unable to load MachineConfigPool resources')}
        </Alert>
      ) : !obj ? (
        <Alert
          variant="info"
          title={t('console-app~There is no MachineConfigPool associated with this node')}
        />
      ) : (
        <DescriptionList>
          <DetailsItem label={t('console-app~Name')} obj={obj}>
            <ResourceLink
              groupVersionKind={getGroupVersionKindForResource(obj)}
              name={obj.metadata.name}
            />
          </DetailsItem>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('console-app~Max unavailable machines')}</DescriptionListTerm>
            <DescriptionListDescription>{maxUnavailable}</DescriptionListDescription>
          </DescriptionListGroup>
          <DetailsItem label={t('console-app~Paused')} obj={obj} path={'spec.paused'}>
            {obj?.spec?.paused ? t('console-app~True') : t('console-app~False')}
          </DetailsItem>
          <DetailsItem label={t('console-app~Node selector')} obj={obj} path="spec.nodeSelector">
            <Selector kind={referenceForModel(NodeModel)} selector={obj?.spec?.nodeSelector} />
          </DetailsItem>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('console-app~MachineConfig selector')}</DescriptionListTerm>
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
