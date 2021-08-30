import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../models';
import { runFilters } from '../pipelines/detail-page-tabs/PipelineRuns';
import { RepositoryLabels, RepositoryFields } from './consts';
import RunList from './RepositoryPipelineRunList';
import { RepositoryKind } from './types';

export interface RepositoryPipelineRunListPageProps {
  obj: RepositoryKind;
}

const RepositoryPipelineRunListPage: React.FC<RepositoryPipelineRunListPageProps> = ({ obj }) => (
  <ListPage
    showTitle={false}
    canCreate={false}
    kind={referenceForModel(PipelineRunModel)}
    namespace={obj.metadata.namespace}
    selector={{
      matchLabels: { [RepositoryLabels[RepositoryFields.REPOSITORY]]: obj.metadata.name },
    }}
    ListComponent={RunList}
    rowFilters={runFilters}
  />
);

export default RepositoryPipelineRunListPage;
