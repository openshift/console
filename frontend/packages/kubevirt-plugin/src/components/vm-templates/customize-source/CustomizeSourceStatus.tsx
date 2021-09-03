import * as React from 'react';
import { Alert, Bullseye, Button, Spinner, Stack, StackItem, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExternalLink, ResourceLink } from '@console/internal/components/utils';
import { SEAL_BOOT_SOURCE_URL } from '../../../constants';
import { VirtualMachineModel } from '../../../models';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';
import { VMStatusBundle } from '../../../statuses/vm/types';
import { VMIKind, VMKind } from '../../../types';
import cancelCustomizationModal from '../../modals/template-customization/CancelCustomizationModal';
import { VMStatus } from '../../vm-status/vm-status';
import './customize-source.scss';

const CustomizeSourceStatus: React.FC<CustomizeSourceStatusProps> = ({
  vm,
  vmi,
  vmStatusBundle,
}) => {
  const { t } = useTranslation();
  return (
    <Bullseye data-test="template-source">
      <Stack hasGutter className="kv-customize-source__status">
        <StackItem>
          <Stack hasGutter className="kv-customize-source__status--center">
            <StackItem>
              <Spinner size="xl" />
            </StackItem>
            <StackItem>
              <Title headingLevel="h1">
                {t('kubevirt-plugin~Preparing boot source customization')}
              </Title>
            </StackItem>
            <StackItem>
              <VMStatus vm={vm} vmi={vmi} vmStatusBundle={vmStatusBundle} />
            </StackItem>
            <StackItem>
              <Stack>
                <StackItem>{t('kubevirt-plugin~This might take a few minutes.')}</StackItem>
                <StackItem>
                  {t(
                    'kubevirt-plugin~You can exit this screen and return later by launching console from the following virtual machine.',
                  )}
                </StackItem>
              </Stack>
            </StackItem>
            <StackItem>
              <ResourceLink
                kind={kubevirtReferenceForModel(VirtualMachineModel)}
                name={vm.metadata.name}
                namespace={vm.metadata.namespace}
                className="kv-customize-source__status-link"
                inline
              />
            </StackItem>
          </Stack>
        </StackItem>
        <StackItem>
          <Alert
            isInline
            variant="info"
            title={t(
              'kubevirt-plugin~This flow will require you to generalize your custom boot source.',
            )}
          >
            <ExternalLink
              text={t('kubevirt-plugin~Learn how to generalize a boot source')}
              href={SEAL_BOOT_SOURCE_URL}
            />
          </Alert>
        </StackItem>
        <StackItem className="kv-customize-source__status--center">
          <Button variant="link" onClick={() => cancelCustomizationModal({ vm, backToVirt: true })}>
            {t('kubevirt-plugin~Cancel customization')}
          </Button>
        </StackItem>
      </Stack>
    </Bullseye>
  );
};

type CustomizeSourceStatusProps = {
  vmStatusBundle: VMStatusBundle;
  vm: VMKind;
  vmi: VMIKind;
};

export default CustomizeSourceStatus;
