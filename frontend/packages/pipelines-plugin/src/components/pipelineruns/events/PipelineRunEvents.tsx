import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { match as RMatch } from 'react-router';
import { ResourcesEventStream } from '@console/internal/components/events';
import { PipelineRunKind } from '../../../types';
import { usePipelineRunFilters } from './event-utils';

type PipelineRunEventsProps = {
  obj: PipelineRunKind;
  match: RMatch<{
    ns?: string;
  }>;
};

const PipelineRunEvents: React.FC<PipelineRunEventsProps> = ({
  obj: pipelineRun,
  match: {
    params: { ns: namespace },
  },
}) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t('pipelines-plugin~PipelineRun events')}</title>
      </Helmet>
      <ResourcesEventStream
        filters={usePipelineRunFilters(namespace, pipelineRun)}
        namespace={namespace}
      />
    </>
  );
};
export default PipelineRunEvents;
