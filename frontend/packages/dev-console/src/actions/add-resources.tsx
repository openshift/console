import * as React from 'react';
import {
  GitAltIcon,
  OsImageIcon,
  CatalogIcon,
  CubeIcon,
  DatabaseIcon,
} from '@patternfly/react-icons';
import { ImportOptions } from '../components/import/import-types';
import { KebabAction, createKebabAction } from '../utils/add-resources-menu-utils';

export const fromGit = createKebabAction('From Git', <GitAltIcon />, ImportOptions.GIT);

export const containerImage = createKebabAction(
  'Container Image',
  <OsImageIcon />,
  ImportOptions.CONTAINER,
);

export const fromCatalog = createKebabAction(
  'From Catalog',
  <CatalogIcon />,
  ImportOptions.CATALOG,
  false,
);
export const fromDockerfile = createKebabAction(
  'From Dockerfile',
  <CubeIcon />,
  ImportOptions.DOCKERFILE,
);

export const fromDatabaseCatalog = createKebabAction(
  'Database',
  <DatabaseIcon />,
  ImportOptions.DATABASE,
  false,
);

export const addResourceMenu: KebabAction[] = [
  fromGit,
  containerImage,
  fromCatalog,
  fromDockerfile,
  fromDatabaseCatalog,
];
