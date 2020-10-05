import * as React from 'react';
import {
  GitAltIcon,
  OsImageIcon,
  CatalogIcon,
  CubeIcon,
  DatabaseIcon,
  LaptopCodeIcon,
  BoltIcon,
} from '@patternfly/react-icons';
import { HelmChartsIcon } from '@console/shared';
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

export const fromDatabaseCatalog = createKebabAction(
  'Database',
  <DatabaseIcon />,
  ImportOptions.DATABASE,
);

export const fromSamples = createKebabAction('Samples', <LaptopCodeIcon />, ImportOptions.SAMPLES);

export const fromOperatorBacked = createKebabAction(
  'Operator Backed',
  <BoltIcon />,
  ImportOptions.OPERATORBACKED,
);

export const fromHelmCharts = createKebabAction(
  'Helm Charts',
  <HelmChartsIcon style={{ height: '1em', width: '1em' }} />,
  ImportOptions.HELMCHARTS,
);

export const addResourceMenu: KebabAction[] = [
  fromSamples,
  fromGit,
  containerImage,
  fromDockerfile,
  fromCatalog,
  fromDatabaseCatalog,
  fromOperatorBacked,
  fromHelmCharts,
];

export const addResourceMenuWithoutCatalog: KebabAction[] = [
  fromGit,
  containerImage,
  fromDockerfile,
];
