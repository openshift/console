import * as React from 'react';
import { Helmet } from 'react-helmet';
import { AsyncComponent } from './utils';

export const ImportYamlPage = () => {
  const title = 'Import YAML';

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <AsyncComponent
        loader={() => import('./droppable-edit-yaml').then((c) => c.DroppableEditYAML)}
        allowMultiple
        create={true}
        download={false}
        header={title}
      />
    </>
  );
};
