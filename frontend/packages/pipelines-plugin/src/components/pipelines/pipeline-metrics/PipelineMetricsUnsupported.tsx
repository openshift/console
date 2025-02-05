import * as React from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { ChartLineIcon } from '@patternfly/react-icons/dist/esm/icons/chart-line-icon';
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
            <EmptyState icon={ChartLineIcon} variant={EmptyStateVariant.full}>
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
