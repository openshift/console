import { useCallback } from 'react';
import { isCreateResource, CreateResource, GroupVersionKind } from '@console/dynamic-plugin-sdk';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import { Extension, LoadedExtension } from '@console/plugin-sdk';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';

export const useCreateResourceExtension = (
  modelReference: GroupVersionKind,
): LoadedExtension<CreateResource> => {
  const createResourceTypeGuard = useCallback(
    (e: Extension): e is CreateResource =>
      isCreateResource(e) && referenceForExtensionModel(e.properties.model) === modelReference,
    [modelReference],
  );
  const [extensionPage] = useExtensions<CreateResource>(createResourceTypeGuard);
  return extensionPage;
};
