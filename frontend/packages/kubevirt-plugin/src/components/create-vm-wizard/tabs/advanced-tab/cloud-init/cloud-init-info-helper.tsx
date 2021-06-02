import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExternalLink, FieldLevelHelp } from '@console/internal/components/utils';
import { CLOUD_INIT_DOC_LINK } from '../../../../../utils/strings';

export const CloudInitInfoHelper = () => {
  const { t } = useTranslation();
  return (
    <FieldLevelHelp>
      <Stack hasGutter>
        <StackItem>
          {t(
            'kubevirt-plugin~You can use cloud-init for post installation configuration of the guest operating system. The guest OS needs to have the cloud-init service running.',
          )}
        </StackItem>
        <StackItem>
          <div className="text-muted">
            {t(
              'kubevirt-plugin~cloud-init is already configured in cloud images of Fedora and RHEL',
            )}
          </div>
        </StackItem>
        <StackItem>
          <ExternalLink text={t('kubevirt-plugin~Learn more')} href={CLOUD_INIT_DOC_LINK} />
        </StackItem>
      </Stack>
    </FieldLevelHelp>
  );
};
