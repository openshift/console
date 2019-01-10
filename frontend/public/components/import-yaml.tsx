import * as React from 'react';
import { AsyncComponent } from './utils';

export const ImportYamlPage = () => {

  return <React.Fragment>
    <AsyncComponent loader={() => import('./droppable-edit-yaml').then(c => c.DroppableEditYAML)} create={true} download={false} header="Import YAML" />
  </React.Fragment>;

};
