import { Stack, StackItem } from '@patternfly/react-core';
import { ExternalLink } from '@console/internal/components/utils';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

const NodeMemoryOvercommitPopover = () => {
  const { t } = useTranslation();
  return (
    <Stack hasGutter>
      <StackItem>
        {t(
          "public~To improve resource utilization you can assign more memory to the VM than the node's physical memory. Please note it requires careful management and monitoring to avoid performance issues and system instability",
        )}
      </StackItem>
      <ExternalLink
        href={'https://www.redhat.com/sysadmin/automate-linux-tasks-cron'}
        text={t('Learn about Memory overcommit')}
      />
    </Stack>
  );
};

export default NodeMemoryOvercommitPopover;
