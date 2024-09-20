import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../models';
import { usePipelineTechPreviewBadge } from '../../utils/hooks';
import { ListPage } from '../ListPage';
import { runFilters } from '../pipelines/detail-page-tabs/PipelineRuns';
import { useGetPipelineRuns } from './hooks/useTektonResults';
import PipelineRunsList from './list-page/PipelineRunList';

interface PipelineRunsResourceListProps {
  hideBadge?: boolean;
  canCreate?: boolean;
}

const PipelineRunsResourceList: React.FC<
  Omit<React.ComponentProps<typeof ListPage>, 'kind' | 'ListComponent' | 'rowFilters'> &
    PipelineRunsResourceListProps
> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const ns = props.namespace || params?.ns;
  const badge = usePipelineTechPreviewBadge(ns);
  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsLoadError, getNextPage] = useGetPipelineRuns(
    ns,
  );
  const resources = {
    [referenceForModel(PipelineRunModel)]: {
      data: pipelineRuns,
      kind: referenceForModel(PipelineRunModel),
      loadError: pipelineRunsLoadError,
      loaded: pipelineRunsLoaded,
    },
  };
  return (
    <ListPage
      {...props}
      canCreate={props.canCreate ?? true}
      kind={referenceForModel(PipelineRunModel)}
      ListComponent={PipelineRunsList}
      rowFilters={runFilters(t)}
      badge={props.hideBadge ? null : badge}
      customData={{ nextPage: getNextPage }}
      data={resources}
    />
  );
};

export default PipelineRunsResourceList;
