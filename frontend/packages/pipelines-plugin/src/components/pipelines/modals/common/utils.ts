import * as _ from 'lodash';
import { getRandomChars } from '@console/shared';
import { PipelineRunModel } from '../../../../models';
import {
  PipelineKind,
  TektonResource,
  PipelineRunKind,
  PipelineRunEmbeddedResource,
  PipelineRunEmbeddedResourceParam,
  PipelineRunReferenceResource,
  PipelineRunResource,
  VolumeClaimTemplateType,
  TektonWorkspace,
  PipelineRunParam,
} from '../../../../types';
import { getPipelineRunParams, getPipelineRunWorkspaces } from '../../../../utils/pipeline-utils';
import { TektonResourceLabel, VolumeTypes, preferredNameAnnotation } from '../../const';
import { CREATE_PIPELINE_RESOURCE, initialResourceFormValues } from './const';
import {
  CommonPipelineModalFormikValues,
  PipelineModalFormResource,
  PipelineModalFormWorkspace,
  PipelineModalFormWorkspaceStructure,
} from './types';

/**
 * Migrates a PipelineRun from one version to another to support auto-upgrades with old (and invalid) PipelineRuns.
 *
 * Note: Each check within this method should be driven by the apiVersion number if the API is properly up-versioned
 * for these breaking changes. (should be done moving from 0.10.x forward)
 */
export const migratePipelineRun = (pipelineRun: PipelineRunKind): PipelineRunKind => {
  let newPipelineRun = pipelineRun;

  const serviceAccountPath = 'spec.serviceAccount';
  if (_.has(newPipelineRun, serviceAccountPath)) {
    // .spec.serviceAccount was removed for .spec.serviceAccountName in 0.9.x
    // Note: apiVersion was not updated for this change and thus we cannot gate this change behind a version number
    const serviceAccountName = _.get(newPipelineRun, serviceAccountPath);
    newPipelineRun = _.omit(newPipelineRun, [serviceAccountPath]);
    newPipelineRun = _.merge(newPipelineRun, {
      spec: {
        serviceAccountName,
      },
    });
  }

  return newPipelineRun;
};

export const getPipelineName = (pipeline?: PipelineKind, latestRun?: PipelineRunKind): string => {
  if (pipeline) {
    return pipeline.metadata.name;
  }

  if (latestRun) {
    return (
      latestRun.spec.pipelineRef?.name ??
      (latestRun.metadata.annotations?.[preferredNameAnnotation] || latestRun.metadata.name)
    );
  }
  return null;
};

export const getPipelineRunData = (
  pipeline: PipelineKind = null,
  latestRun?: PipelineRunKind,
  options?: { generateName: boolean },
): PipelineRunKind => {
  if (!pipeline && !latestRun) {
    // eslint-disable-next-line no-console
    console.error('Missing parameters, unable to create new PipelineRun');
    return null;
  }

  const pipelineName = getPipelineName(pipeline, latestRun);

  const resources = latestRun?.spec.resources;
  const workspaces = latestRun?.spec.workspaces;

  const latestRunParams = latestRun?.spec.params;
  const pipelineParams = pipeline?.spec.params;
  const params = latestRunParams || getPipelineRunParams(pipelineParams);
  // TODO: We should craft a better method to allow us to provide configurable annotations and labels instead of
  // blinding merging existing content from potential real Pipeline and PipelineRun resources
  const annotations = _.merge(
    {},
    pipeline?.metadata?.annotations,
    latestRun?.metadata?.annotations,
    !latestRun?.spec.pipelineRef &&
      !latestRun?.metadata.annotations?.[preferredNameAnnotation] && {
        [preferredNameAnnotation]: pipelineName,
      },
  );
  delete annotations['kubectl.kubernetes.io/last-applied-configuration'];

  const newPipelineRun = {
    apiVersion: pipeline ? pipeline.apiVersion : latestRun.apiVersion,
    kind: PipelineRunModel.kind,
    metadata: {
      ...(options?.generateName
        ? {
            generateName: `${pipelineName}-`,
          }
        : {
            name: `${pipelineName}-${getRandomChars()}`,
          }),
      annotations,
      namespace: pipeline ? pipeline.metadata.namespace : latestRun.metadata.namespace,
      labels: _.merge(
        {},
        pipeline?.metadata?.labels,
        latestRun?.metadata?.labels,
        (latestRun?.spec.pipelineRef || pipeline) && {
          'tekton.dev/pipeline': pipelineName,
        },
      ),
    },
    spec: {
      ...(latestRun?.spec || {}),
      ...((latestRun?.spec.pipelineRef || pipeline) && {
        pipelineRef: {
          name: pipelineName,
        },
      }),
      resources,
      ...(params && { params }),
      workspaces,
      status: null,
    },
  };
  return migratePipelineRun(newPipelineRun);
};

export const getDefaultVolumeClaimTemplate = (pipelineName: string): VolumeClaimTemplateType => {
  return {
    volumeClaimTemplate: {
      metadata: {
        labels: { [TektonResourceLabel.pipeline]: pipelineName },
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
      },
    },
  };
};

const supportWorkspaceDefaults = (preselectPVC: string) => (
  workspace: TektonWorkspace,
): PipelineModalFormWorkspace => {
  let workspaceSetting: PipelineModalFormWorkspaceStructure = {
    type: VolumeTypes.EmptyDirectory,
    data: { emptyDir: {} },
  };

  if (preselectPVC) {
    workspaceSetting = {
      type: VolumeTypes.PVC,
      data: {
        persistentVolumeClaim: {
          claimName: preselectPVC,
        },
      },
    };
  }
  if (workspace.optional) {
    workspaceSetting = {
      type: VolumeTypes.NoWorkspace,
      data: {},
    };
  }

  return {
    ...workspace,
    ...workspaceSetting,
  };
};

export const convertPipelineToModalData = (
  pipeline: PipelineKind,
  alwaysCreateResources: boolean = false,
  preselectPVC: string = '',
): CommonPipelineModalFormikValues => {
  const {
    metadata: { namespace },
    spec: { params, resources },
  } = pipeline;

  return {
    namespace,
    parameters: (params || []).map((param) => ({
      ...param,
      value: param.default, // setup the default if it exists
    })),
    resources: (resources || []).map((resource: TektonResource) => ({
      name: resource.name,
      selection: alwaysCreateResources ? CREATE_PIPELINE_RESOURCE : '',
      data: {
        ...initialResourceFormValues[resource.type],
        type: resource.type,
      },
    })),
    workspaces: (pipeline.spec.workspaces || []).map(supportWorkspaceDefaults(preselectPVC)),
  };
};

export const convertMapToNameValueArray = (map: {
  [key: string]: any;
}): PipelineRunEmbeddedResourceParam[] => {
  return Object.keys(map).map((name) => {
    const value = map[name];
    return { name, value };
  });
};

const convertResources = (resource: PipelineModalFormResource): PipelineRunResource => {
  if (resource.selection === CREATE_PIPELINE_RESOURCE) {
    return {
      name: resource.name,
      resourceSpec: {
        params: convertMapToNameValueArray(resource.data.params),
        type: resource.data.type,
      },
    } as PipelineRunEmbeddedResource;
  }

  return {
    name: resource.name,
    resourceRef: {
      name: resource.selection,
    },
  } as PipelineRunReferenceResource;
};

export const getPipelineRunFromForm = (
  pipeline: PipelineKind,
  formValues: CommonPipelineModalFormikValues,
  labels?: { [key: string]: string },
  annotations?: { [key: string]: string },
  options?: { generateName: boolean },
) => {
  const { parameters, resources, workspaces } = formValues;

  const pipelineRunData: PipelineRunKind = {
    metadata: {
      annotations,
      labels,
    },
    spec: {
      pipelineRef: {
        name: pipeline.metadata.name,
      },
      params: parameters.map(({ name, value }): PipelineRunParam => ({ name, value })),
      resources: resources.map(convertResources),
      workspaces: getPipelineRunWorkspaces(workspaces),
    },
  };
  return getPipelineRunData(pipeline, pipelineRunData, options);
};
