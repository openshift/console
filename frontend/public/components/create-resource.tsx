import * as React from 'react';
import { match as RouterMatch } from 'react-router';
import { useCreateResourceExtension } from '@console/shared/src/hooks/create-resource-hook';
import { AsyncComponent } from './utils';

type CreateResourceProps = {
  match: RouterMatch<{ plural: string; ns?: string }>;
};

const CreateResource: React.FC<CreateResourceProps> = ({ match }) => {
  const createResourceExtension = useCreateResourceExtension(match.params.plural);
  return createResourceExtension ? (
    <AsyncComponent
      loader={createResourceExtension.properties.component}
      namespace={match.params.ns}
    />
  ) : (
    <AsyncComponent
      loader={() =>
        import('./create-yaml' /* webpackChunkName: "create-yaml" */).then((m) => m.CreateYAML)
      }
      match={match}
    />
  );
};

export default CreateResource;
