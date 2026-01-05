import type { FC } from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { useCreateResourceExtension } from '@console/shared/src/hooks/create-resource-hook';
import { ErrorBoundaryPage } from '@console/shared/src/components/error';
import { AsyncComponent } from './utils/async';

const CreateResource: FC = () => {
  const params = useParams();
  const createResourceExtension = useCreateResourceExtension(params.plural);

  return createResourceExtension ? (
    <ErrorBoundaryPage>
      <AsyncComponent loader={createResourceExtension.properties.component} namespace={params.ns} />
    </ErrorBoundaryPage>
  ) : (
    <AsyncComponent
      loader={() =>
        import('./create-yaml' /* webpackChunkName: "create-yaml" */).then((m) => m.CreateYAML)
      }
    />
  );
};

export default CreateResource;
