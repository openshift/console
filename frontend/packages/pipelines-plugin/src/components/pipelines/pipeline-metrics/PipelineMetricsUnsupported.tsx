import * as React from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { ChartLineIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import PipelineMetricsQuickstart from './PipelineMetricsQuickstart';

type PipelineMetricsUnsupportedProps = {
  updatePermission: boolean;
  metricsLevel: string;
};

const PipelineMetricsUnsupported: React.FC<PipelineMetricsUnsupportedProps> = ({
  updatePermission,
  metricsLevel,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {updatePermission && <PipelineMetricsQuickstart metricsLevel={metricsLevel} />}
      <Stack className="pipeline-metrics-empty-state">
        <StackItem isFilled>
          <Bullseye>
            <EmptyState variant={EmptyStateVariant.full}>
              <EmptyStateIcon icon={ChartLineIcon} />
              <EmptyStateBody>
                {t('pipelines-plugin~Pipeline metrics configuration is unsupported.')}
              </EmptyStateBody>
            </EmptyState>
          </Bullseye>
        </StackItem>
      </Stack>
    </>
  );
};

export default PipelineMetricsUnsupported;
