import * as React from 'react';
import { GitAltIcon, OsImageIcon, FileUploadIcon } from '@patternfly/react-icons';
import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { INCONTEXT_ACTIONS_CONNECTS_TO, QUERY_PROPERTIES } from '../const';

const getQueryParamsForAddAction = (application: string, contextSource: string) => {
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
    return `?${queryParams.toString()}`;
  }
  return '';
};

export const AddActions = {
  FromGit: (
    namespace: string,
    application?: string,
    contextSource?: string,
    path?: string,
    accessReviewDisabled?: boolean,
  ): Action => {
    return {
      id: 'import-from-git',
      label: i18next.t('devconsole~Import from Git'),
      icon: <GitAltIcon />,
      cta: {
        href: `/import/ns/${namespace}${getQueryParamsForAddAction(application, contextSource)}`,
      },
      path,
      disabled: !accessReviewDisabled,
    };
  },
  ContainerImage: (
    namespace: string,
    application?: string,
    contextSource?: string,
    path?: string,
    accessReviewDisabled?: boolean,
  ): Action => {
    return {
      id: 'deploy-image',
      label: i18next.t('devconsole~Container Image'),
      icon: <OsImageIcon />,
      cta: {
        href: `/deploy-image/ns/${namespace}${getQueryParamsForAddAction(
          application,
          contextSource,
        )}`,
      },
      path,
      disabled: !accessReviewDisabled,
    };
  },
  UploadJarFile: (
    namespace: string,
    application?: string,
    contextSource?: string,
    path?: string,
    accessReviewDisabled?: boolean,
  ): Action => {
    return {
      id: 'upload-jar',
      label: i18next.t('devconsole~Upload JAR file'),
      icon: <FileUploadIcon />,
      cta: {
        href: `/import/ns/${namespace}${getQueryParamsForAddAction(application, contextSource)}`,
      },
      path,
      disabled: !accessReviewDisabled,
    };
  },
};
