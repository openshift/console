import i18next from 'i18next';
import { KebabOption } from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor } from '@console/internal/module/k8s';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { ImportOptions } from '../components/import/import-types';
import {
  QUERY_PROPERTIES,
  INCONTEXT_ACTIONS_CONNECTS_TO,
  INCONTEXT_ACTIONS_SERVICE_BINDING,
  SERVICE_BINDING_ENABLED,
} from '../const';

const PART_OF = 'app.kubernetes.io/part-of';

export const getAddPageUrl = (
  obj: K8sResourceKind,
  namespace: string,
  type: string,
  hasApplication: boolean,
  contextSource?: string,
  serviceBindingEnabled?: boolean,
): string => {
  let pageUrl = '';
  const params = new URLSearchParams();
  const appGroup = obj?.metadata?.labels?.[PART_OF] || '';
  const ns = namespace || obj?.metadata?.namespace;
  switch (type) {
    case ImportOptions.GIT:
      pageUrl = `/import/ns/${ns}`;
      params.append('importType', 'git');
      contextSource &&
        params.append(
          QUERY_PROPERTIES.CONTEXT_ACTION,
          JSON.stringify({ type: INCONTEXT_ACTIONS_CONNECTS_TO, payload: contextSource }),
        );
      break;
    case ImportOptions.CONTAINER:
      pageUrl = `/deploy-image/ns/${ns}`;
      contextSource &&
        params.append(
          QUERY_PROPERTIES.CONTEXT_ACTION,
          JSON.stringify({ type: INCONTEXT_ACTIONS_CONNECTS_TO, payload: contextSource }),
        );
      break;
    case ImportOptions.CATALOG:
      pageUrl = `/catalog/ns/${ns}`;
      break;
    case ImportOptions.DOCKERFILE:
      pageUrl = `/import/ns/${ns}`;
      params.append('importType', 'docker');
      contextSource &&
        params.append(
          QUERY_PROPERTIES.CONTEXT_ACTION,
          JSON.stringify({ type: INCONTEXT_ACTIONS_CONNECTS_TO, payload: contextSource }),
        );
      break;
    case ImportOptions.DEVFILE:
      pageUrl = `/import/ns/${ns}`;
      params.append('importType', 'devfile');
      break;
    case ImportOptions.DATABASE:
      pageUrl = `/catalog/ns/${ns}`;
      params.append('category', 'databases');
      break;
    case ImportOptions.EVENTSOURCE:
      pageUrl = `/catalog/ns/${ns}`;
      params.append('catalogType', 'EventSource');
      contextSource && params.append(QUERY_PROPERTIES.CONTEXT_SOURCE, contextSource);
      break;
    case ImportOptions.EVENTPUBSUB:
      pageUrl = `/add/ns/${ns}`;
      break;
    case ImportOptions.OPERATORBACKED:
      pageUrl = `/catalog/ns/${ns}`;
      params.append('catalogType', 'OperatorBackedService');
      contextSource &&
        params.append(
          QUERY_PROPERTIES.CONTEXT_ACTION,
          JSON.stringify({
            type: serviceBindingEnabled
              ? INCONTEXT_ACTIONS_SERVICE_BINDING
              : INCONTEXT_ACTIONS_CONNECTS_TO,
            payload: contextSource,
          }),
        );
      break;
    case ImportOptions.HELMCHARTS:
      pageUrl = `/catalog/ns/${ns}`;
      params.append('catalogType', 'HelmChart');
      break;
    case ImportOptions.SAMPLES:
      pageUrl = `/samples/ns/${ns}`;
      break;
    case ImportOptions.EVENTCHANNEL:
      pageUrl = `/channel/ns/${ns}`;
      break;
    case ImportOptions.UPLOADJAR:
      pageUrl = `/upload-jar/ns/${ns}`;
      contextSource &&
        params.append(
          QUERY_PROPERTIES.CONTEXT_ACTION,
          JSON.stringify({ type: INCONTEXT_ACTIONS_CONNECTS_TO, payload: contextSource }),
        );
      break;
    default:
      throw new Error(i18next.t('devconsole~Invalid import option provided'));
  }
  if (hasApplication && appGroup) {
    params.append(QUERY_PROPERTIES.APPLICATION, appGroup);
  } else {
    params.append(QUERY_PROPERTIES.APPLICATION, UNASSIGNED_KEY);
  }
  return `${pageUrl}?${params.toString()}`;
};

export const getMenuPath = (hasApplication: boolean, connectorSourceContext?: string): string =>
  // t('devconsole~Add to Application')
  // t('devconsole~Add to Project')
  connectorSourceContext?.length
    ? null
    : hasApplication
    ? 'devconsole~Add to Application'
    : 'devconsole~Add to Project';

type KebabFactory = (
  labelKey: string,
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

export const createKebabAction: KebabFactory = (labelKey, icon, importType, checkAccess) => (
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
    labelKey,
    icon,
    pathKey: getMenuPath(hasApplication, connectorSourceContext),
    href: getAddPageUrl(
      obj,
      namespace,
      importType,
      hasApplication,
      connectorSourceContext,
      accessData.includes(SERVICE_BINDING_ENABLED),
    ),
  };
};
