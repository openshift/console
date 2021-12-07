import * as React from 'react';
import i18next from 'i18next';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { helmCatalogIconSVG } from '../utils';

export const AddHelmChartAction = (
  namespace: string,
  path?: string,
  accessReviewDisabled?: boolean,
): Action => ({
  id: 'helm',
  label: i18next.t('helm-plugin~Helm Charts'),
  icon: (
    <img style={{ height: '1em', width: '1em' }} src={helmCatalogIconSVG} alt="Helm Charts Logo" />
  ),
  cta: {
    href: `/catalog/ns/${namespace}?catalogType=HelmChart`,
  },
  path,
  disabled: !accessReviewDisabled,
  insertAfter: 'operator-backed',
});
