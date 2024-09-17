import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { referenceForModel } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/flag';
import { PipelineRunModel } from '../../models';
import { ListPage } from '../ListPage';
import { usePipelineRuns } from '../pipelineruns/hooks/usePipelineRuns';
import { FLAG_PIPELINES_OPERATOR_VERSION_1_16 } from '../pipelines/const';
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
  const IS_PIPELINE_OPERATOR_VERSION_1_16 = useFlag(FLAG_PIPELINES_OPERATOR_VERSION_1_16);
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
    IS_PIPELINE_OPERATOR_VERSION_1_16,
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
        matchLabels: {
          [RepositoryLabels[RepositoryFields.REPOSITORY]]: obj.metadata.name,
        },
      }}
      ListComponent={RunList}
      rowFilters={runFilters(t)}
      data={resources}
    />
  );
};

export default RepositoryPipelineRunListPage;
