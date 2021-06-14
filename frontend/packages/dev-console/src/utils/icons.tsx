import * as React from 'react';
import {
  BoltIcon,
  CatalogIcon,
  DatabaseIcon,
  LaptopCodeIcon,
  OsImageIcon,
  FileUploadIcon,
} from '@patternfly/react-icons';
import * as devfileIcon from '../images/devfile.svg';
import * as dockerfileIcon from '../images/dockerfile.svg';
import * as gitIcon from '../images/from-git.svg';
import * as yamlIcon from '../images/yaml.svg';

export const gitIconSVG = gitIcon;

export const devfileIconSVG = devfileIcon;

export const dockerfileIconSVG = dockerfileIcon;

export const yamlIconSVG = yamlIcon;

export const deployIconElement = <OsImageIcon />;

export const samplesIconElement = <LaptopCodeIcon />;

export const devCatalogIconElement = <CatalogIcon />;

export const databaseCatalogIconElement = <DatabaseIcon />;

export const operatorCatalogIconElement = <BoltIcon />;

export const uploadJarIconElement = <FileUploadIcon />;
