import * as _ from 'lodash';
import { getRandomChars } from '@console/shared';
import {
  Pipeline,
  PipelineResource,
  PipelineRun,
  PipelineRunInlineResource,
  PipelineRunInlineResourceParam,
  PipelineRunReferenceResource,
  PipelineRunResource,
} from '../../../../utils/pipeline-augment';
import { PipelineRunModel } from '../../../../models';
import { getPipelineRunParams, getPipelineRunWorkspaces } from '../../../../utils/pipeline-utils';
import { CREATE_PIPELINE_RESOURCE, initialResourceFormValues } from './const';
import { CommonPipelineModalFormikValues, PipelineModalFormResource } from './types';

/**
 * Migrates a PipelineRun from one version to another to support auto-upgrades with old (and invalid) PipelineRuns.
 *
 * Note: Each check within this method should be driven by the apiVersion number if the API is properly up-versioned
 * for these breaking changes. (should be done moving from 0.10.x forward)
 */
export const migratePipelineRun = (pipelineRun: PipelineRun): PipelineRun => {
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

export const getPipelineRunData = (
  pipeline: Pipeline = null,
  latestRun?: PipelineRun,
): PipelineRun => {
  if (!pipeline && !latestRun) {
    // eslint-disable-next-line no-console
    console.error('Missing parameters, unable to create new PipelineRun');
    return null;
  }

  const pipelineName = pipeline ? pipeline.metadata.name : latestRun.spec.pipelineRef.name;

  const resources = latestRun?.spec.resources;
  const workspaces = latestRun?.spec.workspaces;

  const latestRunParams = latestRun?.spec.params;
  const pipelineParams = pipeline?.spec.params;
  const params = latestRunParams || getPipelineRunParams(pipelineParams);

  const newPipelineRun = {
    apiVersion: pipeline ? pipeline.apiVersion : latestRun.apiVersion,
    kind: PipelineRunModel.kind,
    metadata: {
      name: `${pipelineName}-${getRandomChars(6)}`,
      namespace: pipeline ? pipeline.metadata.namespace : latestRun.metadata.namespace,
      labels: _.merge({}, pipeline?.metadata?.labels, latestRun?.metadata?.labels, {
        'tekton.dev/pipeline': pipelineName,
      }),
    },
    spec: {
      ...(latestRun?.spec || {}),
      pipelineRef: {
        name: pipelineName,
      },
      resources,
      ...(params && { params }),
      workspaces,
    },
  };
  return migratePipelineRun(newPipelineRun);
};

export const convertPipelineToModalData = (
  pipeline: Pipeline,
  alwaysCreateResources: boolean = false,
): CommonPipelineModalFormikValues => {
  const {
    metadata: { namespace },
    spec: { params, resources },
  } = pipeline;

  return {
    namespace,
    parameters: params || [],
    resources: (resources || []).map((resource: PipelineResource) => ({
      name: resource.name,
      selection: alwaysCreateResources ? CREATE_PIPELINE_RESOURCE : null,
      data: {
        ...initialResourceFormValues[resource.type],
        type: resource.type,
      },
    })),
  };
};

export const convertMapToNameValueArray = (map: {
  [key: string]: any;
}): PipelineRunInlineResourceParam[] => {
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
    } as PipelineRunInlineResource;
  }

  return {
    name: resource.name,
    resourceRef: {
      name: resource.selection,
    },
  } as PipelineRunReferenceResource;
};

export const getPipelineRunFromForm = (
  pipeline: Pipeline,
  formValues: CommonPipelineModalFormikValues,
  labels?: { [key: string]: string },
) => {
  const { parameters, resources, workspaces } = formValues;

  const pipelineRunData: PipelineRun = {
    metadata: {
      labels,
    },
    spec: {
      pipelineRef: {
        name: pipeline.metadata.name,
      },
      params: getPipelineRunParams(parameters),
      resources: resources.map(convertResources),
      workspaces: getPipelineRunWorkspaces(workspaces),
    },
  };
  return getPipelineRunData(pipeline, pipelineRunData);
};
