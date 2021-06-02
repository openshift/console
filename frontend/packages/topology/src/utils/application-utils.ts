import i18next from 'i18next';
import * as _ from 'lodash';
import { detectGitType } from '@console/dev-console/src/components/import/import-validation-utils';
import { checkAccess } from '@console/internal/components/utils';
import {
  ImageStreamModel,
  BuildConfigModel,
  ServiceModel,
  DeploymentConfigModel,
  DeploymentModel,
  RouteModel,
  SecretModel,
  DaemonSetModel,
  StatefulSetModel,
  JobModel,
  CronJobModel,
  BuildModel,
} from '@console/internal/models';
import {
  K8sKind,
  k8sList,
  k8sPatch,
  k8sKill,
  K8sResourceKind,
  modelFor,
  referenceFor,
} from '@console/internal/module/k8s';
import { ServiceModel as KnativeServiceModel } from '@console/knative-plugin/src/models';
import { isDynamicEventResourceKind } from '@console/knative-plugin/src/utils/fetch-dynamic-eventsources-utils';
import { getBuildConfigsForResource } from '@console/shared';
import { CREATE_APPLICATION_KEY, UNASSIGNED_KEY } from '../const';
import { listInstanceResources } from './connector-utils';

export const sanitizeApplicationValue = (
  application: string,
  applicationType: string = application,
): string => {
  switch (applicationType) {
    case UNASSIGNED_KEY:
    case CREATE_APPLICATION_KEY:
      return '';
    default:
      return application;
  }
};

// Updates the resource's labels to set its application grouping
const updateItemAppLabel = (
  resourceKind: K8sKind,
  item: K8sResourceKind,
  application: string,
): Promise<any> => {
  const labels = { ...item.metadata.labels, 'app.kubernetes.io/part-of': application || undefined };

  if (!resourceKind) {
    return Promise.reject();
  }

  const patch = [
    {
      op: _.isEmpty(labels) ? 'add' : 'replace',
      path: '/metadata/labels',
      value: labels,
    },
  ];

  return k8sPatch(resourceKind, item, patch);
};

// Updates the given resource and its associated resources to the given application grouping
export const updateResourceApplication = (
  resourceKind: K8sKind,
  resource: K8sResourceKind,
  application: string,
): Promise<any> => {
  if (!resource) {
    return Promise.reject(
      new Error(i18next.t('topology~Error: no resource provided to update Application for.')),
    );
  }
  if (!resourceKind) {
    return Promise.reject(
      new Error(
        i18next.t('topology~Error: invalid resource kind provided for updating Application.'),
      ),
    );
  }

  const instanceName = _.get(resource, ['metadata', 'labels', 'app.kubernetes.io/instance']);
  const prevApplication = _.get(resource, ['metadata', 'labels', 'app.kubernetes.io/part-of']);

  const patches: Promise<any>[] = [updateItemAppLabel(resourceKind, resource, application)];

  // If there is no instance label, only update this item
  if (!instanceName) {
    return Promise.all(patches);
  }

  // selector is for the instance name and current application if there is one
  const labelSelector = {
    'app.kubernetes.io/instance': instanceName,
  };
  if (prevApplication) {
    labelSelector['app.kubernetes.io/part-of'] = prevApplication;
  }

  // Update all the instance's resources that were part of the previous application
  return listInstanceResources(resource.metadata.namespace, instanceName, {
    'app.kubernetes.io/part-of': prevApplication,
  }).then((listsValue) => {
    _.forEach(listsValue, (list) => {
      _.forEach(list, (item) => {
        // verify the case of no previous application
        if (prevApplication || !_.get(item, ['metadata', 'labels', 'app.kubernetes.io/part-of'])) {
          patches.push(updateItemAppLabel(modelFor(item.kind), item, application));
        }
      });
    });

    return Promise.all(patches);
  });
};

const safeKill = async (model: K8sKind, obj: K8sResourceKind) => {
  const resp = await checkAccess({
    group: model.apiGroup,
    resource: model.plural,
    verb: 'delete',
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
  });
  if (resp.status.allowed) {
    try {
      return await k8sKill(model, obj);
    } catch (error) {
      // 404 when resource is not found
      if (error?.response?.status !== 404) {
        throw error;
      }
    }
  }
  return null;
};

const deleteWebhooks = async (
  resource: K8sResourceKind,
  buildConfigs: K8sResourceKind[],
  isKnativeResource: boolean,
) => {
  const deploymentsAnnotations = resource.metadata?.annotations ?? {};
  const gitType = detectGitType(deploymentsAnnotations['app.openshift.io/vcs-uri']);
  const secretList = await k8sList(SecretModel, {
    ns: resource.metadata.namespace,
  });
  return buildConfigs?.reduce((requests, bc) => {
    const triggers = bc.spec?.triggers ?? [];
    const reqs = triggers.reduce((a, t) => {
      let secretResource: K8sResourceKind;
      const webhookType = t.generic ? 'generic' : gitType;
      const webhookTypeObj = t.generic || (!isKnativeResource && t[gitType]);
      if (webhookTypeObj) {
        const secretName =
          webhookTypeObj.secretReference?.name ??
          `${resource.metadata.name}-${webhookType}-webhook-secret`;
        secretResource = secretList.find(
          (secret: K8sResourceKind) => secret.metadata.name === secretName,
        );
      }
      return secretResource ? [...a, safeKill(SecretModel, secretResource)] : a;
    }, []);
    return [...requests, ...reqs];
  }, []);
};

export const cleanUpWorkload = async (
  resource: K8sResourceKind,
  isKnativeResource: boolean,
): Promise<K8sResourceKind[]> => {
  const reqs = [];
  const buildConfigs = await k8sList(BuildConfigModel, { ns: resource.metadata.namespace });
  const builds = await k8sList(BuildModel, { ns: resource.metadata.namespace });
  const resources = {
    buildConfigs: {
      data: buildConfigs,
      loaded: true,
      loadError: null,
    },
    builds: {
      data: builds,
      loaded: true,
      loadError: null,
    },
  };
  const resourceBuildConfigs = getBuildConfigsForResource(resource, resources);
  const isBuildConfigPresent = !_.isEmpty(resourceBuildConfigs);

  const deleteModels = [ServiceModel, RouteModel, ImageStreamModel];
  const knativeDeleteModels = [KnativeServiceModel, ImageStreamModel];
  if (isBuildConfigPresent) {
    deleteModels.push(BuildConfigModel);
    knativeDeleteModels.push(BuildConfigModel);
  }
  const resourceData = _.cloneDeep(resource);
  const deleteRequest = (model: K8sKind, resourceObj: K8sResourceKind) => {
    const req = safeKill(model, resourceObj);
    req && reqs.push(req);
  };
  const batchDeleteRequests = (models: K8sKind[], resourceObj: K8sResourceKind): void => {
    models.forEach((model) => deleteRequest(model, resourceObj));
  };
  if (isDynamicEventResourceKind(referenceFor(resource)))
    deleteRequest(modelFor(referenceFor(resource)), resource);
  switch (resource.kind) {
    case DaemonSetModel.kind:
    case StatefulSetModel.kind:
    case JobModel.kind:
    case CronJobModel.kind:
      deleteRequest(modelFor(resource.kind), resource);
      break;
    case DeploymentModel.kind:
    case DeploymentConfigModel.kind:
      deleteRequest(modelFor(resource.kind), resource);
      batchDeleteRequests(deleteModels, resource);
      break;
    case KnativeServiceModel.kind:
      batchDeleteRequests(knativeDeleteModels, resourceData);
      break;
    default:
      break;
  }
  isBuildConfigPresent &&
    reqs.push(...(await deleteWebhooks(resource, resourceBuildConfigs, isKnativeResource)));
  return Promise.all(reqs);
};
