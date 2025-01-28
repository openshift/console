import * as React from 'react';
import { BoltIcon } from '@patternfly/react-icons/dist/esm/icons/bolt-icon';
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons/catalog-icon';
import { DatabaseIcon } from '@patternfly/react-icons/dist/esm/icons/database-icon';
import { FileUploadIcon } from '@patternfly/react-icons/dist/esm/icons/file-upload-icon';
import { GitAltIcon } from '@patternfly/react-icons/dist/esm/icons/git-alt-icon';
import { LaptopCodeIcon } from '@patternfly/react-icons/dist/esm/icons/laptop-code-icon';
import { OsImageIcon } from '@patternfly/react-icons/dist/esm/icons/os-image-icon';
import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { ServerlessFunctionIcon } from '@console/knative-plugin/src/utils/icons';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import {
  INCONTEXT_ACTIONS_CONNECTS_TO,
  INCONTEXT_ACTIONS_SERVICE_BINDING,
  QUERY_PROPERTIES,
} from '../const';
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
  isServiceBindingAllowed?: boolean,
) => Action;

export const resolvedURLWithParams = (
  unresolvedHref: string,
  namespace: string,
  application?: string,
  contextSource?: string,
  allowServiceBinding?: boolean,
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
        JSON.stringify({
          type: allowServiceBinding
            ? INCONTEXT_ACTIONS_SERVICE_BINDING
            : INCONTEXT_ACTIONS_CONNECTS_TO,
          payload: contextSource,
        }),
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
    id: 'import-from-samples',
    label: i18next.t('devconsole~Samples'),
    icon: <LaptopCodeIcon />,
    cta: {
      href: resolvedURLWithParams('/samples/ns/:namespace', namespace, application, contextSource),
    },
    path,
    disabled: accessReviewDisabled,
  }),
  OperatorBacked: (
    namespace,
    application,
    contextSource,
    path,
    accessReviewDisabled,
    isServiceBindingAllowed,
  ) => ({
    id: 'operator-backed',
    label: i18next.t('devconsole~Operator Backed'),
    icon: <BoltIcon />,
    cta: {
      href: resolvedURLWithParams(
        '/catalog/ns/:namespace?catalogType=OperatorBackedService',
        namespace,
        application,
        contextSource,
        isServiceBindingAllowed,
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
  // Tech debt: ODC-7413: Move Serverless specific actions and providers from devconsole into knative-pluigin
  CreateServerlessFunction: (
    namespace,
    application,
    contextSource,
    path,
    accessReviewDisabled,
  ) => ({
    id: 'create-serverless-function',
    label: i18next.t('devconsole~Create Serverless function'),
    icon: <ServerlessFunctionIcon />,
    cta: {
      href: resolvedURLWithParams(
        '/serverless-function/ns/:namespace',
        namespace,
        application,
        contextSource,
      ),
    },
    path,
    disabled: accessReviewDisabled,
  }),
  CreateServerlessFunctionUsingSamples: (
    namespace,
    application,
    contextSource,
    path,
    accessReviewDisabled,
  ) => ({
    id: 'create-serverless-function-samples',
    label: i18next.t('devconsole~Serverless function using Samples'),
    icon: <ServerlessFunctionIcon />,
    cta: {
      href: resolvedURLWithParams(
        '/samples/ns/:namespace?sampleType=Serverless function',
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
