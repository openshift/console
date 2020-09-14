import * as React from 'react';
import { useField } from 'formik';
import { connectToFlags, FlagsObject } from '@console/internal/reducers/features';
import { K8sKind } from '@console/internal/module/k8s';
import { DeploymentModel, DeploymentConfigModel } from '@console/internal/models';
import { FLAG_KNATIVE_SERVING_SERVICE, ServiceModel } from '@console/knative-plugin';
import { RadioGroupField, RadioGroupOption } from '@console/shared';
import { useAccessReview } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { Resources, ReadableResourcesNames } from '../import-types';
import FormSection from './FormSection';
import './ResourceSection.scss';

type ResourceSectionProps = {
  flags: FlagsObject;
};

const createHelpText = (k8sModel: K8sKind, helpText: string) => {
  return (
    <>
      <div className="odc-resource-section__help-text">
        {k8sModel.apiGroup}/{k8sModel.kind}
      </div>
      <div>{helpText}</div>
    </>
  );
};

const ResourceSection: React.FC<ResourceSectionProps> = ({ flags }) => {
  const [field] = useField<Resources[]>('resourceTypesNotValid');
  const invalidTypes = field.value || [];

  const radioOptions: RadioGroupOption[] = [];
  if (!invalidTypes.includes(Resources.Kubernetes)) {
    radioOptions.push({
      label: ReadableResourcesNames[Resources.Kubernetes],
      value: Resources.Kubernetes,
      children: createHelpText(
        DeploymentModel,
        `A ${DeploymentModel.label} enables declarative updates for Pods and ReplicaSets.`,
      ),
    });
  }
  if (!invalidTypes.includes(Resources.OpenShift)) {
    radioOptions.push({
      label: ReadableResourcesNames[Resources.OpenShift],
      value: Resources.OpenShift,
      children: createHelpText(
        DeploymentConfigModel,
        `A ${DeploymentConfigModel.label} defines the template for a pod \
        and manages deploying new images or configuration changes.`,
      ),
    });
  }

  const knativeServiceAccess = useAccessReview({
    group: ServiceModel.apiGroup,
    resource: ServiceModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });
  const canIncludeKnative =
    !invalidTypes.includes(Resources.KnativeService) &&
    flags[FLAG_KNATIVE_SERVING_SERVICE] &&
    knativeServiceAccess;
  if (canIncludeKnative) {
    radioOptions.push({
      label: ReadableResourcesNames[Resources.KnativeService],
      value: Resources.KnativeService,
      children: createHelpText(
        ServiceModel,
        `A type of deployment that enables Serverless scaling to 0 when idle.`,
      ),
    });
  }
  return (
    <FormSection title="Resources" fullWidth>
      <div>Select the resource type to generate</div>
      <RadioGroupField name="resources" options={radioOptions} />
    </FormSection>
  );
};

export default connectToFlags(FLAG_KNATIVE_SERVING_SERVICE)(ResourceSection);
