import * as React from 'react';
import {
  GitAltIcon,
  OsImageIcon,
  CatalogIcon,
  CubeIcon,
  LayerGroupIcon,
  DatabaseIcon,
  LaptopCodeIcon,
  BoltIcon,
} from '@patternfly/react-icons';
import * as helmIcon from '@console/internal/imgs/logos/helm.svg';
import { ImportOptions } from '../components/import/import-types';
import { KebabAction, createKebabAction } from '../utils/add-resources-menu-utils';

export const allImportResourceAccess = 'allImportResourceAccess';
export const allCatalogImageResourceAccess = 'allCatalogImageResourceAccess';

export const fromGit = createKebabAction(
  // t('devconsole~From Git')
  'devconsole~From Git',
  <GitAltIcon />,
  ImportOptions.GIT,
  allImportResourceAccess,
);

export const containerImage = createKebabAction(
  // t('devconsole~Container Image')
  'devconsole~Container Image',
  <OsImageIcon />,
  ImportOptions.CONTAINER,
  allCatalogImageResourceAccess,
);

export const fromCatalog = createKebabAction(
  // t('devconsole~From Catalog')
  'devconsole~From Catalog',
  <CatalogIcon />,
  ImportOptions.CATALOG,
);

export const fromDockerfile = createKebabAction(
  // t('devconsole~From Dockerfile')
  'devconsole~From Dockerfile',
  <CubeIcon />,
  ImportOptions.DOCKERFILE,
  allImportResourceAccess,
);

export const fromDevfile = createKebabAction(
  // t('devconsole~From Devfile')
  'devconsole~From Devfile',
  <LayerGroupIcon />,
  ImportOptions.DEVFILE,
  allImportResourceAccess,
);

export const fromDatabaseCatalog = createKebabAction(
  // t('devconsole~Database')
  'devconsole~Database',
  <DatabaseIcon />,
  ImportOptions.DATABASE,
);

export const fromSamples = createKebabAction(
  // t('devconsole~Samples')
  'devconsole~Samples',
  <LaptopCodeIcon />,
  ImportOptions.SAMPLES,
);

export const fromOperatorBacked = createKebabAction(
  // t('devconsole~Operator Backed')
  'devconsole~Operator Backed',
  <BoltIcon />,
  ImportOptions.OPERATORBACKED,
);

export const fromHelmCharts = createKebabAction(
  // t('devconsole~Helm Charts')
  'devconsole~Helm Charts',
  <img style={{ height: '1em', width: '1em' }} src={helmIcon} alt="Helm Charts Logo" />,
  ImportOptions.HELMCHARTS,
);

export const addResourceMenu: KebabAction[] = [
  fromSamples,
  fromGit,
  containerImage,
  fromDockerfile,
  fromDevfile,
  fromCatalog,
  fromDatabaseCatalog,
  fromOperatorBacked,
  fromHelmCharts,
];

export const addGroupResourceMenu: KebabAction[] = [
  fromGit,
  containerImage,
  fromDockerfile,
  fromDevfile,
];

export const addResourceMenuWithoutCatalog: KebabAction[] = [
  fromGit,
  containerImage,
  fromDockerfile,
  fromDevfile,
  fromOperatorBacked,
];
