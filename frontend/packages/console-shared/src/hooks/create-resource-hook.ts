import { useCallback } from 'react';
import { isCreateResource, CreateResource, GroupVersionKind } from '@console/dynamic-plugin-sdk';
import { ExtensionDeclaration, LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';

export const useCreateResourceExtension = (
  modelReference: GroupVersionKind,
): LoadedExtension<CreateResource> => {
  const createResourceTypeGuard = useCallback(
    (e: ExtensionDeclaration): e is CreateResource =>
      isCreateResource(e) && referenceForExtensionModel(e.properties.model) === modelReference,
    [modelReference],
  );
  const [extensionPage] = useExtensions<CreateResource>(createResourceTypeGuard);
  return extensionPage;
};
