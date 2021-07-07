import * as React from 'react';
import { match as RouterMatch } from 'react-router';
import { Extension, useExtensions } from '@console/plugin-sdk';
import {
  CreateResource as CreateResourceExtension,
  isCreateResource,
} from '@console/dynamic-plugin-sdk';
import { AsyncComponent } from './utils';
import { referenceForExtensionModel } from '../module/k8s';

type CreateYAMLPageProps = {
  match: RouterMatch<{ plural: string; ns?: string; csvName?: string }>;
};

const CreateYAMLPage: React.FC<CreateYAMLPageProps> = ({ match }) => (
  <AsyncComponent
    loader={() =>
      import('./create-yaml' /* webpackChunkName: "create-yaml" */).then((m) => m.CreateYAML)
    }
    match={match}
  />
);

type CreateResourceProps = CreateYAMLPageProps & {
  DefaultPage?: React.ComponentType<CreateYAMLPageProps>;
};

const CreateResource: React.FC<CreateResourceProps> = ({ match, DefaultPage = CreateYAMLPage }) => {
  const createResourceTypeGuard = React.useCallback(
    (e: Extension): e is CreateResourceExtension => {
      return (
        isCreateResource(e) &&
        referenceForExtensionModel(e.properties.model) === match.params.plural
      );
    },
    [match.params.plural],
  );
  const extensionPages = useExtensions<CreateResourceExtension>(createResourceTypeGuard);
  return extensionPages.length ? (
    <AsyncComponent loader={extensionPages[0].properties.component} match={match} />
  ) : (
    <DefaultPage match={match} />
  );
};

export default CreateResource;
