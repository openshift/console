import * as React from 'react';
import {
  GitAltIcon,
  OsImageIcon,
  CatalogIcon,
  DatabaseIcon,
  LaptopCodeIcon,
  BoltIcon,
  FileUploadIcon,
} from '@patternfly/react-icons';
import * as helmIcon from '@console/internal/imgs/logos/helm.svg';
import { ImportOptions } from '../components/import/import-types';
import { KebabAction, createKebabAction } from '../utils/add-resources-menu-utils';
import { getDisabledAddActions } from '../utils/useAddActionExtensions';

export const allImportResourceAccess = 'allImportResourceAccess';
export const allCatalogImageResourceAccess = 'allCatalogImageResourceAccess';

type AddActionItem = { id: string; action: KebabAction };

export const fromGit: AddActionItem = {
  id: 'import-from-git',
  action: createKebabAction(
    // t('devconsole~From Git')
    'devconsole~Import from Git',
    <GitAltIcon />,
    ImportOptions.GIT,
    allImportResourceAccess,
  ),
};

export const containerImage: AddActionItem = {
  id: 'deploy-image',
  action: createKebabAction(
    // t('devconsole~Container Image')
    'devconsole~Container Image',
    <OsImageIcon />,
    ImportOptions.CONTAINER,
    allCatalogImageResourceAccess,
  ),
};

export const fromCatalog: AddActionItem = {
  id: 'dev-catalog',
  action: createKebabAction(
    // t('devconsole~From Catalog')
    'devconsole~From Catalog',
    <CatalogIcon />,
    ImportOptions.CATALOG,
  ),
};

export const fromDatabaseCatalog: AddActionItem = {
  id: 'dev-catalog-databases',
  action: createKebabAction(
    // t('devconsole~Database')
    'devconsole~Database',
    <DatabaseIcon />,
    ImportOptions.DATABASE,
  ),
};

export const fromSamples: AddActionItem = {
  id: 'import-from-samples',
  action: createKebabAction(
    // t('devconsole~Samples')
    'devconsole~Samples',
    <LaptopCodeIcon />,
    ImportOptions.SAMPLES,
  ),
};

export const fromOperatorBacked: AddActionItem = {
  id: 'operator-backed',
  action: createKebabAction(
    // t('devconsole~Operator Backed')
    'devconsole~Operator Backed',
    <BoltIcon />,
    ImportOptions.OPERATORBACKED,
  ),
};

export const fromHelmCharts: AddActionItem = {
  id: 'helm',
  action: createKebabAction(
    // t('devconsole~Helm Charts')
    'devconsole~Helm Charts',
    <img style={{ height: '1em', width: '1em' }} src={helmIcon} alt="Helm Charts Logo" />,
    ImportOptions.HELMCHARTS,
  ),
};

export const uploadJarFile: AddActionItem = {
  id: 'upload-jar',
  action: createKebabAction(
    // t('devconsole~Upload JAR file')
    'devconsole~Upload JAR file',
    <FileUploadIcon />,
    ImportOptions.UPLOADJAR,
    allCatalogImageResourceAccess,
  ),
};

const disabledAddActions = getDisabledAddActions();
export const disabledFilter = (item) => !disabledAddActions?.includes(item.id);
export const actionMapper = (item) => item.action;

export const addResourceMenu: KebabAction[] = [
  fromSamples,
  fromGit,
  containerImage,
  fromCatalog,
  fromDatabaseCatalog,
  fromOperatorBacked,
  fromHelmCharts,
  uploadJarFile,
]
  .filter(disabledFilter)
  .map(actionMapper);

export const addGroupResourceMenu: KebabAction[] = [fromGit, containerImage, uploadJarFile]
  .filter(disabledFilter)
  .map(actionMapper);

export const addResourceMenuWithoutCatalog: KebabAction[] = [
  fromGit,
  containerImage,
  fromOperatorBacked,
  uploadJarFile,
]
  .filter(disabledFilter)
  .map(actionMapper);
