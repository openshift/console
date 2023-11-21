import * as React from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Stack,
  StackItem,
  EmptyStateHeader,
} from '@patternfly/react-core';
import { ChartLineIcon } from '@patternfly/react-icons/dist/esm/icons/chart-line-icon';
import { useTranslation } from 'react-i18next';

import './PipelineMetrics.scss';

const PipelineMetricsEmptyState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Stack className="pipeline-metrics-empty-state">
      <StackItem isFilled>
        <Bullseye>
          <EmptyState variant={EmptyStateVariant.full}>
            <EmptyStateHeader icon={<EmptyStateIcon icon={ChartLineIcon} />} />
            <EmptyStateBody>
              {t('pipelines-plugin~Start your pipeline to view pipeline metrics.')}
            </EmptyStateBody>
          </EmptyState>
        </Bullseye>
      </StackItem>
    </Stack>
  );
};

export default PipelineMetricsEmptyState;
