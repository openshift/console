import * as React from 'react';
import { BoltIcon } from '@patternfly/react-icons/dist/esm/icons/bolt-icon';
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons/catalog-icon';
import { DatabaseIcon } from '@patternfly/react-icons/dist/esm/icons/database-icon';
import { ExportIcon } from '@patternfly/react-icons/dist/esm/icons/export-icon';
import { FileUploadIcon } from '@patternfly/react-icons/dist/esm/icons/file-upload-icon';
import { GitAltIcon } from '@patternfly/react-icons/dist/esm/icons/git-alt-icon';
import { LaptopCodeIcon } from '@patternfly/react-icons/dist/esm/icons/laptop-code-icon';
import { OsImageIcon } from '@patternfly/react-icons/dist/esm/icons/os-image-icon';
import { OutlinedFileCodeIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-file-code-icon';
import { ShareSquareIcon } from '@patternfly/react-icons/dist/esm/icons/share-square-icon';
import devfileIcon from '../images/devfile.svg';
import dockerfileIcon from '../images/dockerfile.svg';

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

export const shareProjectIconElement = <ShareSquareIcon />;

export const exportApplicationIconElement = <ExportIcon />;
