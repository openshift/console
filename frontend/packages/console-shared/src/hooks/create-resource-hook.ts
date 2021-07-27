import * as React from 'react';
import { isCreateResource, CreateResource, GroupVersionKind } from '@console/dynamic-plugin-sdk';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import { Extension, LoadedExtension, useExtensions } from '@console/plugin-sdk';

export const useCreateResourceExtension = (
  modelReference: GroupVersionKind,
): LoadedExtension<CreateResource> => {
  const createResourceTypeGuard = React.useCallback(
    (e: Extension): e is CreateResource =>
      isCreateResource(e) && referenceForExtensionModel(e.properties.model) === modelReference,
    [modelReference],
  );
  const [extensionPage] = useExtensions<CreateResource>(createResourceTypeGuard);
  return extensionPage;
};
