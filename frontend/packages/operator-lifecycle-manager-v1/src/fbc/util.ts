import { FileBasedCatalogObject, FileBasedCatalogSchema } from './types';

export const getFileBasedCatalogObjectUID = (
  catalog: string,
  { schema, package: pkg, name }: FileBasedCatalogObject,
) => {
  switch (schema) {
    case FileBasedCatalogSchema.Package:
      return `${catalog}~${name}`;
    default:
      return `${catalog}~${pkg}~${name}`;
  }
};
