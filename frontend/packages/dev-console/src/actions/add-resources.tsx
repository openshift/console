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
import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { INCONTEXT_ACTIONS_CONNECTS_TO, QUERY_PROPERTIES } from '../const';
import { resolvedHref } from '../utils/add-page-utils';
import { getDisabledAddActions } from '../utils/useAddActionExtensions';

export const allImportResourceAccess = 'allImportResourceAccess';
export const allCatalogImageResourceAccess = 'allCatalogImageResourceAccess';

type ActionFactory = (
  namespace: string,
  application?: string,
  contextSource?: string,
  path?: string,
  accessReviewDisabled?: boolean,
) => Action;

const resolvedURLWithParams = (
  unresolvedHref: string,
  namespace: string,
  application?: string,
  contextSource?: string,
) => {
  const resolvedURL = resolvedHref(unresolvedHref, namespace);
  const queryParams = new URLSearchParams();
  if (application || contextSource) {
    application
      ? queryParams.append(QUERY_PROPERTIES.APPLICATION, application)
      : queryParams.append(QUERY_PROPERTIES.APPLICATION, UNASSIGNED_KEY);
    contextSource &&
      queryParams.append(
        QUERY_PROPERTIES.CONTEXT_ACTION,
        JSON.stringify({ type: INCONTEXT_ACTIONS_CONNECTS_TO, payload: contextSource }),
      );
    return `${resolvedURL}${resolvedURL.indexOf('?') > -1 ? '&' : '?'}${queryParams.toString()}`;
  }
  return resolvedURL;
};

export const AddActions: { [name: string]: ActionFactory } = {
  FromGit: (namespace, application, contextSource, path, accessReviewDisabled) => ({
    id: 'import-from-git',
    label: i18next.t('devconsole~Import from Git'),
    icon: <GitAltIcon />,
    cta: {
      href: resolvedURLWithParams('/import/ns/:namespace', namespace, application, contextSource),
    },
    path,
    disabled: accessReviewDisabled,
  }),
  ContainerImage: (namespace, application, contextSource, path, accessReviewDisabled) => ({
    id: 'deploy-image',
    label: i18next.t('devconsole~Container Image'),
    icon: <OsImageIcon />,
    cta: {
      href: resolvedURLWithParams(
        '/deploy-image/ns/:namespace',
        namespace,
        application,
        contextSource,
      ),
    },
    path,
    disabled: accessReviewDisabled,
  }),
  DevCatalog: (namespace, application, contextSource, path, accessReviewDisabled) => ({
    id: 'dev-catalog',
    label: i18next.t('devconsole~From Catalog'),
    icon: <CatalogIcon />,
    cta: {
      href: resolvedURLWithParams('/catalog/ns/:namespace', namespace, application, contextSource),
    },
    path,
    disabled: accessReviewDisabled,
  }),
  DatabaseCatalog: (namespace, application, contextSource, path, accessReviewDisabled) => ({
    id: 'dev-catalog-databases',
    label: i18next.t('devconsole~Database'),
    icon: <DatabaseIcon />,
    cta: {
      href: resolvedURLWithParams(
        '/catalog/ns/:namespace?category=databases',
        namespace,
        application,
        contextSource,
      ),
    },
    path,
    disabled: accessReviewDisabled,
  }),
  Samples: (namespace, application, contextSource, path, accessReviewDisabled) => ({
    id: 'import-form-samples',
    label: i18next.t('devconsole~Samples'),
    icon: <LaptopCodeIcon />,
    cta: {
      href: resolvedURLWithParams('/samples/ns/:namespace', namespace, application, contextSource),
    },
    path,
    disabled: accessReviewDisabled,
  }),
  OperatorBacked: (namespace, application, contextSource, path, accessReviewDisabled) => ({
    id: 'operator-backed',
    label: i18next.t('devconsole~Operator Backed'),
    icon: <BoltIcon />,
    cta: {
      href: resolvedURLWithParams(
        '/catalog/ns/:namespace?catalogType=OperatorBackedService',
        namespace,
        application,
        contextSource,
      ),
    },
    path,
    disabled: accessReviewDisabled,
  }),
  UploadJarFile: (namespace, application, contextSource, path, accessReviewDisabled) => ({
    id: 'upload-jar',
    label: i18next.t('devconsole~Upload JAR file'),
    icon: <FileUploadIcon />,
    cta: {
      href: resolvedURLWithParams(
        '/upload-jar/ns/:namespace',
        namespace,
        application,
        contextSource,
      ),
    },
    path,
    disabled: accessReviewDisabled,
  }),
};

const disabledAddActions = getDisabledAddActions();
export const disabledActionsFilter = (item: Action) => !disabledAddActions?.includes(item.id);
