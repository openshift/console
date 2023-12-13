import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../models';
import { ListPage } from '../ListPage';
import { usePipelineRuns } from '../pipelineruns/hooks/usePipelineRuns';
import { runFilters } from '../pipelines/detail-page-tabs/PipelineRuns';
import { RepositoryFields, RepositoryLabels } from './consts';
import RunList from './RepositoryPipelineRunList';
import { RepositoryKind } from './types';

export interface RepositoryPipelineRunListPageProps {
  obj: RepositoryKind;
}

const RepositoryPipelineRunListPage: React.FC<RepositoryPipelineRunListPageProps> = (props) => {
  const { t } = useTranslation();
  const { obj } = props;
  const selector = React.useMemo(() => {
    return {
      matchLabels: { [RepositoryLabels[RepositoryFields.REPOSITORY]]: obj.metadata.name },
    };
  }, [obj.metadata.name]);
  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsLoadError] = usePipelineRuns(
    obj.metadata.namespace,
    {
      selector,
    },
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
      showTitle={false}
      canCreate={false}
      kind={referenceForModel(PipelineRunModel)}
      namespace={obj.metadata.namespace}
      selector={{
        matchLabels: { [RepositoryLabels[RepositoryFields.REPOSITORY]]: obj.metadata.name },
      }}
      ListComponent={RunList}
      rowFilters={runFilters(t)}
      data={resources}
    />
  );
};

export default RepositoryPipelineRunListPage;
