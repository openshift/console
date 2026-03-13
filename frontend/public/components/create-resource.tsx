import type { FC } from 'react';
import { useParams } from 'react-router';
import { useCreateResourceExtension } from '@console/shared/src/hooks/create-resource-hook';
import { AsyncComponent } from './utils/async';

const CreateResource: FC = () => {
  const params = useParams();
  const createResourceExtension = useCreateResourceExtension(params.plural);

  return createResourceExtension ? (
    <AsyncComponent loader={createResourceExtension.properties.component} namespace={params.ns} />
  ) : (
    <AsyncComponent
      loader={() =>
        import('./create-yaml' /* webpackChunkName: "create-yaml" */).then((m) => m.CreateYAML)
      }
    />
  );
};

export default CreateResource;
