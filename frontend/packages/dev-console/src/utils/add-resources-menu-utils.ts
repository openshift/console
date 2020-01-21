import * as _ from 'lodash';
import { K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';
import { KebabOption, asAccessReview } from '@console/internal/components/utils';
import { ImportOptions } from '../components/import/import-types';

const PART_OF = 'app.kubernetes.io/part-of';

export const getAddPageUrl = (
  obj: K8sResourceKind,
  type: string,
  hasApplication: boolean,
): string => {
  let pageUrl = '';
  const params = new URLSearchParams();
  const appGroup = _.get(obj, ['metadata', 'labels', PART_OF], '');
  const {
    metadata: { namespace: ns },
  } = obj;
  switch (type) {
    case ImportOptions.GIT:
      pageUrl = `/import/ns/${ns}`;
      params.append('importType', 'git');
      break;
    case ImportOptions.CONTAINER:
      pageUrl = `/deploy-image/ns/${ns}`;
      break;
    case ImportOptions.CATALOG:
      pageUrl = `/catalog/ns/${ns}`;
      break;
    case ImportOptions.DOCKERFILE:
      pageUrl = `/import/ns/${ns}`;
      params.append('importType', 'docker');
      break;
    case ImportOptions.DATABASE:
      pageUrl = `/catalog/ns/${ns}`;
      params.append('category', 'databases');
      break;
    default:
      throw new Error('Invalid Import option provided');
  }
  params.append('isKnativeDisabled', 'true');
  if (hasApplication && appGroup) {
    params.append('application', encodeURIComponent(appGroup));
  }
  return `${pageUrl}?${params.toString()}`;
};

export const getMenuPath = (hasApplication: boolean): string =>
  hasApplication ? 'Add to Application' : 'Add to Project';

type KebabFactory = (
  label: string,
  icon: React.ReactNode,
  importType: ImportOptions,
  checkAccess?: boolean,
) => KebabAction;

export type KebabAction = (obj?: K8sResourceKind, hasApplication?: boolean) => KebabOption;

export const createKebabAction: KebabFactory = (label, icon, importType, checkAccess = true) => (
  obj: K8sResourceKind,
  hasApplication: boolean,
) => {
  const resourceModel = modelFor(referenceFor(obj));
  return {
    label,
    icon,
    path: getMenuPath(hasApplication),
    href: getAddPageUrl(obj, importType, hasApplication),
    accessReview: checkAccess && asAccessReview(resourceModel, obj, 'create'),
  };
};
