import {
  FileBasedCatalogSchema,
  FileBasedCatalogBundle,
  FileBasedCatalogItem,
  FileBasedCatalogChannel,
  FileBasedCatalogPackage,
} from './types';

export const isFileBasedCatalogBundle = (
  object: FileBasedCatalogItem,
): object is FileBasedCatalogBundle => object.schema === FileBasedCatalogSchema.bundle;

export const isFileBasedCatalogChannel = (
  object: FileBasedCatalogItem,
): object is FileBasedCatalogChannel => object.schema === FileBasedCatalogSchema.channel;

export const isFileBasedCatalogPackage = (
  object: FileBasedCatalogItem,
): object is FileBasedCatalogPackage => object.schema === FileBasedCatalogSchema.package;
