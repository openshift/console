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
  K8sModel,
  k8sList,
  k8sPatch,
  k8sKill,
  K8sResourceKind,
  modelFor,
  referenceFor,
} from '@console/internal/module/k8s';
import {
  CamelKameletBindingModel,
  EventingBrokerModel,
  KafkaSinkModel,
  ServiceModel as KnativeServiceModel,
} from '@console/knative-plugin/src/models';
import {
  fetchChannelsCrd,
  isDynamicEventResourceKind,
} from '@console/knative-plugin/src/utils/fetch-dynamic-eventsources-utils';
import {
  EventListenerKind,
  TriggerTemplateKind,
} from '@console/pipelines-plugin/src/components/pipelines/resource-types';
import {
  EventListenerModel,
  PipelineModel,
  TriggerTemplateModel,
} from '@console/pipelines-plugin/src/models';
import {
  getEventListeners,
  getPipeline,
  getTriggerTemplates,
} from '@console/pipelines-plugin/src/utils/pipeline-utils';
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
  resourceKind: K8sModel,
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
  resourceKind: K8sModel,
  resource: K8sResourceKind,
  application: string,
): Promise<any> => {
  if (!resource) {
    return Promise.reject(
      new Error(i18next.t('topology~Error: no resource provided to update application for.')),
    );
  }
  if (!resourceKind) {
    return Promise.reject(
      new Error(
        i18next.t('topology~Error: invalid resource kind provided for updating application.'),
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

const safeLoadList = async (
  model: K8sModel,
  queryParams: { [key: string]: any } = {},
  accessCheckRequired?: boolean,
) => {
  try {
    if (accessCheckRequired) {
      const canListResource = await checkAccess({
        group: model.apiGroup,
        resource: model.plural,
        verb: 'list',
        namespace: queryParams?.ns,
      });
      if (!canListResource?.status?.allowed) {
        return [];
      }
    }
    return await k8sList(model, queryParams);
  } catch (error) {
    // Ignore when resource is not found
    if (error?.response?.status === 404) {
      // eslint-disable-next-line no-console
      console.warn(`Ignore that model ${model.plural} was not found:`, error);
      return [];
    }
    // eslint-disable-next-line no-console
    console.warn(`Error while loading model ${model.plural}:`, error);
    throw error;
  }
};

const safeKill = async (model: K8sModel, obj: K8sResourceKind) => {
  const resp = await checkAccess({
    group: model.apiGroup,
    resource: model.plural,
    verb: 'delete',
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
  });
  if (!resp.status.allowed) {
    // eslint-disable-next-line no-console
    console.warn(`User is not allowed to delete resource ${model.plural} ${obj.metadata.name}.`);
    return null;
  }
  try {
    return await k8sKill(model, obj);
  } catch (error) {
    // Ignore when resource is not found
    if (error?.response?.status === 404) {
      // eslint-disable-next-line no-console
      console.warn(
        `Resource ${model.plural} ${obj.metadata.name} was not found. Ignore this error.`,
        error,
      );
      return null;
    }
    // eslint-disable-next-line no-console
    console.warn(`Error while deleting resource ${model.plural} ${obj.metadata.name}:`, error);
    throw error;
  }
};

const deleteWebhooks = async (resource: K8sResourceKind, buildConfigs?: K8sResourceKind[]) => {
  const deploymentsAnnotations = resource.metadata?.annotations ?? {};
  const gitType = detectGitType(deploymentsAnnotations['app.openshift.io/vcs-uri']);
  const secretList = await k8sList(SecretModel, {
    ns: resource.metadata.namespace,
  });
  let webhooks;
  if (buildConfigs?.length > 0) {
    webhooks = buildConfigs?.reduce((requests, bc) => {
      const triggers = bc.spec?.triggers ?? [];
      const reqs = triggers.reduce((a, t) => {
        let secretResource: K8sResourceKind;
        const webhookType = t.generic ? 'generic' : gitType;
        const webhookTypeObj = t.generic || t[gitType];
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
  } else {
    const secretGenericResource = secretList.find(
      (secret: K8sResourceKind) =>
        secret.metadata.name === `${resource.metadata.name}-generic-webhook-secret`,
    );
    const secretGittypeResource = secretList.find(
      (secret: K8sResourceKind) =>
        secret.metadata.name === `${resource.metadata.name}-${gitType}-webhook-secret`,
    );
    webhooks = [
      safeKill(SecretModel, secretGenericResource),
      safeKill(SecretModel, secretGittypeResource),
    ];
  }
  return webhooks;
};

export const cleanUpWorkload = async (resource: K8sResourceKind): Promise<K8sResourceKind[]> => {
  const reqs = [];

  const buildConfigs = await safeLoadList(BuildConfigModel, { ns: resource.metadata.namespace });
  const builds = await safeLoadList(BuildModel, { ns: resource.metadata.namespace });
  const pipelines = await safeLoadList(PipelineModel, { ns: resource.metadata.namespace }, true);
  const triggerTemplates = await safeLoadList(
    TriggerTemplateModel,
    {
      ns: resource.metadata.namespace,
    },
    true,
  );
  const eventListeners = await safeLoadList(
    EventListenerModel,
    {
      ns: resource.metadata.namespace,
    },
    true,
  );
  const channelModels = await fetchChannelsCrd();

  const resourceModel = modelFor(referenceFor(resource));
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
  const pipeline = getPipeline(resource, pipelines);
  let resourceTriggerTemplates: TriggerTemplateKind[] = [];
  let resourceEventListeners: EventListenerKind[] = [];

  const deleteModels = [ServiceModel, RouteModel, ImageStreamModel];
  const knativeDeleteModels = [KnativeServiceModel, ImageStreamModel];

  if (!_.isEmpty(pipeline)) {
    deleteModels.push(PipelineModel);
    knativeDeleteModels.push(PipelineModel);
    resourceTriggerTemplates = getTriggerTemplates(pipeline, triggerTemplates);
    resourceEventListeners = getEventListeners(resourceTriggerTemplates, eventListeners);
  }
  const resourceData = _.cloneDeep(resource);
  const deleteRequest = (model: K8sModel, resourceObj: K8sResourceKind) => {
    const req = safeKill(model, resourceObj);
    req && reqs.push(req);
  };
  if (isBuildConfigPresent) {
    resourceBuildConfigs.forEach((bc) => {
      deleteRequest(BuildConfigModel, bc);
    });
  }
  const batchDeleteRequests = (models: K8sModel[], resourceObj: K8sResourceKind): void => {
    models.forEach((model) => deleteRequest(model, resourceObj));
  };
  if (isDynamicEventResourceKind(referenceFor(resource)))
    deleteRequest(modelFor(referenceFor(resource)), resource);
  if (channelModels.find((channel) => channel.kind === resource.kind)) {
    deleteRequest(resourceModel, resource);
  }
  if (resourceTriggerTemplates.length > 0) {
    resourceTriggerTemplates.forEach((tt) => deleteRequest(TriggerTemplateModel, tt));
  }

  if (resourceEventListeners.length > 0) {
    resourceEventListeners.forEach((et) => deleteRequest(EventListenerModel, et));
  }

  switch (resource.kind) {
    case DaemonSetModel.kind:
    case StatefulSetModel.kind:
    case JobModel.kind:
    case CronJobModel.kind:
    case EventingBrokerModel.kind:
      deleteRequest(resourceModel, resource);
      break;
    case DeploymentModel.kind:
    case DeploymentConfigModel.kind:
      deleteRequest(resourceModel, resource);
      batchDeleteRequests(deleteModels, resource);
      break;
    case KnativeServiceModel.kind:
      batchDeleteRequests(knativeDeleteModels, resourceData);
      break;
    case CamelKameletBindingModel.kind:
    case KafkaSinkModel.kind:
      deleteRequest(resourceModel, resource);
      break;
    default:
      break;
  }

  if (isBuildConfigPresent) {
    reqs.push(...(await deleteWebhooks(resource, resourceBuildConfigs)));
  }
  if (pipeline) {
    reqs.push(...(await deleteWebhooks(resource)));
  }

  return Promise.all(reqs);
};
