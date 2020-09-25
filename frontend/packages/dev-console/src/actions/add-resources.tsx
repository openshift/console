import * as React from 'react';
import {
  GitAltIcon,
  OsImageIcon,
  CatalogIcon,
  CubeIcon,
  LayerGroupIcon,
  DatabaseIcon,
} from '@patternfly/react-icons';
import { ImportOptions } from '../components/import/import-types';
import { KebabAction, createKebabAction } from '../utils/add-resources-menu-utils';

export const allImportResourceAccess = 'allImportResourceAccess';
export const allCatalogImageResourceAccess = 'allCatalogImageResourceAccess';

export const fromGit = createKebabAction(
  'From Git',
  <GitAltIcon />,
  ImportOptions.GIT,
  allImportResourceAccess,
);

export const containerImage = createKebabAction(
  'Container Image',
  <OsImageIcon />,
  ImportOptions.CONTAINER,
  allCatalogImageResourceAccess,
);

export const fromCatalog = createKebabAction(
  'From Catalog',
  <CatalogIcon />,
  ImportOptions.CATALOG,
);

export const fromDockerfile = createKebabAction(
  'From Dockerfile',
  <CubeIcon />,
  ImportOptions.DOCKERFILE,
  allImportResourceAccess,
);

export const fromDevfile = createKebabAction(
  'From Devfile',
  <LayerGroupIcon />,
  ImportOptions.DEVFILE,
  allImportResourceAccess,
);

export const fromDatabaseCatalog = createKebabAction(
  'Database',
  <DatabaseIcon />,
  ImportOptions.DATABASE,
);

export const addResourceMenu: KebabAction[] = [
  fromGit,
  containerImage,
  fromCatalog,
  fromDockerfile,
  fromDevfile,
  fromDatabaseCatalog,
];

export const addResourceMenuWithoutCatalog: KebabAction[] = [
  fromGit,
  containerImage,
  fromDockerfile,
  fromDevfile,
];
