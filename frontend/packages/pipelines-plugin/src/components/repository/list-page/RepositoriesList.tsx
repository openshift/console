import * as React from 'react';
import { ListPage } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { RepositoryModel } from '../../../models';
import RepositoryList from './ReppositoryList';

const RepositoriesList: React.FC<React.ComponentProps<typeof ListPage>> = (props) => (
  <ListPage
    {...props}
    canCreate={props.canCreate ?? true}
    kind={referenceForModel(RepositoryModel)}
    ListComponent={RepositoryList}
  />
);

export default RepositoriesList;
