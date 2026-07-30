import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { machineConfigReference } from '@console/internal/components/machine-config';
import { ResourceLink, SectionHeading } from '@console/internal/components/utils';
import type { MachineConfigPoolKind } from '@console/internal/module/k8s';

type MachineConfigPoolCharacteristicsProps = {
  obj: MachineConfigPoolKind;
};

const MachineConfigPoolCharacteristics: FC<MachineConfigPoolCharacteristicsProps> = ({ obj }) => {
  const { t } = useTranslation('console-app');
  const configuration = obj?.status?.configuration;

  return (
    <DescriptionList>
      {configuration && (
        <>
          <SectionHeading text={t('MachineConfigs')} />
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Current configuration')}</DescriptionListTerm>
            <DescriptionListDescription>
              {configuration.name ? (
                <ResourceLink
                  kind={machineConfigReference}
                  name={configuration.name}
                  title={configuration.name}
                />
              ) : (
                '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Current configuration source')}</DescriptionListTerm>
            <DescriptionListDescription>
              {configuration.source?.length
                ? configuration.source.map((nextSource) => (
                    <ResourceLink
                      key={`${nextSource.apiVersion}-${nextSource.kind}-${nextSource.name}`}
                      kind={machineConfigReference}
                      name={nextSource.name}
                      title={nextSource.name}
                    />
                  ))
                : '-'}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </>
      )}
    </DescriptionList>
  );
};

export default MachineConfigPoolCharacteristics;
