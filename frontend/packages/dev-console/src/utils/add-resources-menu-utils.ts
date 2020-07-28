import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { KebabOption } from '@console/internal/components/utils';
import { ImportOptions } from '../components/import/import-types';
import { QUERY_PROPERTIES, UNASSIGNED_KEY } from '../const';

const PART_OF = 'app.kubernetes.io/part-of';

export const getAddPageUrl = (
  obj: K8sResourceKind,
  namespace: string,
  type: string,
  hasApplication: boolean,
  contextSource?: string,
): string => {
  let pageUrl = '';
  const params = new URLSearchParams();
  const appGroup = obj?.metadata?.labels?.[PART_OF] || '';
  const ns = namespace || obj?.metadata?.namespace;
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
    case ImportOptions.EVENTSOURCE:
      pageUrl = `/event-source/ns/${ns}`;
      break;
    case ImportOptions.EVENTPUBSUB:
      pageUrl = `/add/ns/${ns}`;
      break;
    default:
      throw new Error('Invalid Import option provided');
  }
  if (hasApplication && appGroup) {
    params.append(QUERY_PROPERTIES.APPLICATION, appGroup);
  } else {
    params.append(QUERY_PROPERTIES.APPLICATION, UNASSIGNED_KEY);
  }
  if (contextSource) {
    params.append(QUERY_PROPERTIES.CONTEXT_SOURCE, contextSource);
  }
  return `${pageUrl}?${params.toString()}`;
};

export const getMenuPath = (hasApplication: boolean, connectorSourceContext?: string): string =>
  connectorSourceContext?.length ? null : hasApplication ? 'Add to Application' : 'Add to Project';

type KebabFactory = (
  label: string,
  icon: React.ReactNode,
  importType: ImportOptions,
  checkAccess?: string,
) => KebabAction;

export type KebabAction = (
  obj?: K8sResourceKind,
  namespace?: string,
  hasApplication?: boolean,
  connectorSourceObj?: K8sResourceKind,
  accessData?: string[],
) => KebabOption;

export type MenuOptions = (KebabAction | KebabOption)[];

export const createKebabAction: KebabFactory = (label, icon, importType, checkAccess) => (
  obj: K8sResourceKind,
  namespace: string,
  hasApplication: boolean,
  connectorSourceObj: K8sResourceKind,
  accessData: string[],
) => {
  if (checkAccess && !accessData.includes(checkAccess)) {
    return null;
  }
  const connectorSourceContext: string = connectorSourceObj?.metadata
    ? `${referenceFor(connectorSourceObj)}/${connectorSourceObj?.metadata?.name}`
    : null;

  return {
    label,
    icon,
    path: getMenuPath(hasApplication, connectorSourceContext),
    href: getAddPageUrl(obj, namespace, importType, hasApplication, connectorSourceContext),
  };
};
