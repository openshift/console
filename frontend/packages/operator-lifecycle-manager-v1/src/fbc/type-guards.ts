import {
  FileBasedCatalogSchema,
  FileBasedCatalogBundle,
  FileBasedCatalogObject,
  FileBasedCatalogChannel,
  FileBasedCatalogPackage,
} from './types';

export const isFileBasedCatalogBundle = (
  object: FileBasedCatalogObject,
): object is FileBasedCatalogBundle => object.schema === FileBasedCatalogSchema.Bundle;

export const isFileBasedCatalogChannel = (
  object: FileBasedCatalogObject,
): object is FileBasedCatalogChannel => object.schema === FileBasedCatalogSchema.Channel;

export const isFileBasedCatalogPackage = (
  object: FileBasedCatalogObject,
): object is FileBasedCatalogPackage => object.schema === FileBasedCatalogSchema.Package;
