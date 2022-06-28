import * as React from 'react';
import { Text, Title, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  DOC_URL_PODDISRUPTIONBUDGET_POLICY,
  ExternalLink,
} from '@console/internal/components/utils';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';

const AvailabilityRequirementPopover: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FieldLevelHelp>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h3">{t('console-app~Availability requirement')}</Title>
        </StackItem>
        <StackItem>
          <Title headingLevel="h4">{t('console-app~maxUnavailable')}</Title>
        </StackItem>
        <StackItem>
          <Text className="pdb-form-popover__description">
            {t(
              'console-app~An eviction is allowed if at most "maxUnavailable" pods selected by "selector" are unavailable after the eviction, i.e. even in absence of the evicted pod. For example, one can prevent all voluntary evictions by specifying 0. This is a mutually exclusive setting with "minAvailable".',
            )}
          </Text>
        </StackItem>
        <StackItem>
          <Title headingLevel="h4">{t('console-app~minAvailable')}</Title>
        </StackItem>
        <StackItem>
          <Text>
            {t(
              'console-app~An eviction is allowed if at least "minAvailable" pods selected by "selector" will still be available after the eviction, i.e. even in the absence of the evicted pod. So for example you can prevent all voluntary evictions by specifying "100%".',
            )}
          </Text>
        </StackItem>
        <StackItem>
          <Title headingLevel="h5">{t('console-app~More information:')}</Title>
        </StackItem>
        <StackItem>
          <ExternalLink
            // no downstream URL
            href={DOC_URL_PODDISRUPTIONBUDGET_POLICY}
            text={t('console-app~PodDisruptionBudget documentation')}
          />
        </StackItem>
      </Stack>
    </FieldLevelHelp>
  );
};

export default AvailabilityRequirementPopover;
