import * as React from 'react';
import {
  BoltIcon,
  CatalogIcon,
  DatabaseIcon,
  LaptopCodeIcon,
  OsImageIcon,
  FileUploadIcon,
  GitAltIcon,
  OutlinedFileCodeIcon,
} from '@patternfly/react-icons';
import * as devfileIcon from '../images/devfile.svg';
import * as dockerfileIcon from '../images/dockerfile.svg';

export const gitIconElement = <GitAltIcon />;

export const devfileIconSVG = devfileIcon;

export const dockerfileIconSVG = dockerfileIcon;

export const yamlIconElement = <OutlinedFileCodeIcon />;

export const deployIconElement = <OsImageIcon />;

export const samplesIconElement = <LaptopCodeIcon />;

export const devCatalogIconElement = <CatalogIcon />;

export const databaseCatalogIconElement = <DatabaseIcon />;

export const operatorCatalogIconElement = <BoltIcon />;

export const uploadJarIconElement = <FileUploadIcon />;
