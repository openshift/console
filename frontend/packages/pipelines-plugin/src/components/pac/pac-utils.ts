import {
  k8sCreateResource,
  k8sGetResource,
  k8sListResourceItems,
  k8sPatchResource,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { ConfigMapModel, RouteModel, SecretModel } from '@console/internal/models';
import { RouteKind } from '@console/internal/module/k8s';
import { PIPELINE_NAMESPACE } from '../pipelines/const';
import { EVENT_LISTNER_NAME, PAC_SECRET_NAME, PAC_INFO } from './const';

export const createPACSecret = (
  appId: string,
  privateKey: string,
  webHookSecret: string,
  appName: string,
  appUrl: string,
  namespace: string = PIPELINE_NAMESPACE,
) => {
  const { apiVersion, kind } = SecretModel;
  const secretPayload = {
    apiVersion,
    stringData: {
      'github-application-id': appId,
      'webhook.secret': webHookSecret,
      'github-private-key': privateKey,
    },
    kind,
    metadata: {
      name: PAC_SECRET_NAME,
      namespace,
      annotations: { appName, appUrl },
    },
    type: SecretType.opaque,
  };

  return k8sCreateResource({ model: SecretModel, data: secretPayload });
};

export const getControllerUrl = async () => {
  try {
    const [pacControllerUrl] = await k8sListResourceItems<RouteKind>({
      model: RouteModel,
      queryParams: {
        ns: PIPELINE_NAMESPACE,
        labelSelector: {
          matchLabels: {
            'pipelines-as-code/route': 'controller',
          },
        },
      },
    });
    const [elRouteData] = await k8sListResourceItems<RouteKind>({
      model: RouteModel,
      queryParams: {
        ns: PIPELINE_NAMESPACE,
        labelSelector: {
          matchLabels: {
            eventlistener: EVENT_LISTNER_NAME,
          },
        },
      },
    });
    const controller: RouteKind = pacControllerUrl || elRouteData;
    return (controller?.spec?.host && `https://${controller.spec.host}`) ?? '';
  } catch (e) {
    console.warn('Error while fetching Controlleru url:', e); // eslint-disable-line no-console
    return '';
  }
};

export const getPACInfo = async () =>
  k8sGetResource({
    model: ConfigMapModel,
    name: PAC_INFO,
    ns: PIPELINE_NAMESPACE,
  });

export const updatePACInfo = async (appLink: string = '') => {
  try {
    const controllerUrl = await getControllerUrl();
    const cfg = await getPACInfo();

    await k8sPatchResource({
      model: ConfigMapModel,
      resource: cfg,
      data: [
        {
          op: 'replace',
          path: `/data/controller-url`,
          value: controllerUrl || '',
        },
        { op: 'replace', path: `/data/provider`, value: 'github' },
        { op: 'replace', path: `/data/app-link`, value: appLink },
      ],
    });
  } catch (e) {
    console.warn('Error while updating PAC info:', e); // eslint-disable-line no-console
  }
};
