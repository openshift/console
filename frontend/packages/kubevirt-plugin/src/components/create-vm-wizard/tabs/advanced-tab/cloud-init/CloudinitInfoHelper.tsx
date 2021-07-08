import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';
import { CLOUD_INIT_DOC_LINK } from '../../../../../utils/strings';

const CloudInitInfoHelper = () => {
  const { t } = useTranslation();
  return (
    <Stack className="kv-cloudinit-info-helper--main">
      <StackItem>
        {t(
          'kubevirt-plugin~You can use Cloudinit for post installation configuration of the guest operating system.',
        )}
      </StackItem>
      <StackItem>
        {t('kubevirt-plugin~The guest OS needs to have the Cloudinit service running.')}
      </StackItem>
      <StackItem>
        <div className="text-muted">
          {t('kubevirt-plugin~Cloudinit is already configured in cloud images of Fedora and RHEL')}{' '}
          <ExternalLink text={t('kubevirt-plugin~Learn more')} href={CLOUD_INIT_DOC_LINK} />
        </div>
      </StackItem>
    </Stack>
  );
};

export default CloudInitInfoHelper;
