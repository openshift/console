import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../models';
import { ListPage } from '../ListPage';
import { useGetPipelineRuns } from '../pipelineruns/hooks/useTektonResults';
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
  const [pipelineRuns, pipelineRunsLoaded, pipelineRunsLoadError] = useGetPipelineRuns(
    obj.metadata.namespace,
    { name: obj.metadata.name, kind: obj.kind },
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
