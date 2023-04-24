import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { getBadgeFromType } from '@console/shared/src';
import { RepositoryModel } from '../../../models';
import RepositoryList from './ReppositoryList';

const RepositoriesList: React.FC<React.ComponentProps<typeof ListPage>> = (props) => (
  <ListPage
    {...props}
    createProps={{
      to: `/k8s/ns/${props.namespace || 'default'}/${referenceForModel(RepositoryModel)}/~new/form`,
    }}
    canCreate={props.canCreate ?? true}
    kind={referenceForModel(RepositoryModel)}
    ListComponent={RepositoryList}
    badge={getBadgeFromType(RepositoryModel.badge)}
  />
);

export default RepositoriesList;
