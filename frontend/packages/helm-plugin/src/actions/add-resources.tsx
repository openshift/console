import i18next from 'i18next';
import type { Action } from '@console/dynamic-plugin-sdk/src';
import { helmCatalogIconSVG } from '../utils/icons';

export const AddHelmChartAction = (
  namespace: string,
  path?: string,
  accessReviewDisabled?: boolean,
): Action => ({
  id: 'helm',
  label: i18next.t('helm-plugin~Helm Charts'),
  icon: helmCatalogIconSVG,
  cta: {
    href: `/catalog/ns/${namespace}?catalogType=HelmChart`,
  },
  path,
  disabled: !accessReviewDisabled,
  insertAfter: 'operator-backed',
});
