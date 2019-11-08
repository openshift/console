import * as React from 'react';
import { connectToFlags, FlagsObject } from '@console/internal/reducers/features';
import { K8sKind } from '@console/internal/module/k8s';
import { DeploymentModel, DeploymentConfigModel } from '@console/internal/models';
import {
  FLAG_KNATIVE_SERVING_SERVICE,
  ServiceModel,
  KnativeServingModel,
} from '@console/knative-plugin';
import { getBadgeFromType } from '@console/shared';
import { useAccessReview } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { Resources } from '../import-types';
import { RadioOption } from '../../formik-fields/field-types';
import { RadioButtonField } from '../../formik-fields';
import FormSection from './FormSection';
import './ResourceSection.scss';

type ResourceSectionProps = {
  flags: FlagsObject;
};

const createHelpText = (k8sModel: K8sKind, helpText: string) => {
  return (
    <>
      <p>
        {k8sModel.apiGroup}/{k8sModel.kind}
      </p>
      <p>{helpText}</p>
    </>
  );
};

const ResourceSection: React.FC<ResourceSectionProps> = ({ flags }) => {
  const radioOptions: RadioOption[] = [
    {
      label: DeploymentModel.label,
      value: Resources.Kubernetes,
      helperText: createHelpText(
        DeploymentModel,
        `A ${DeploymentModel.label} enables declarative updates for Pods and ReplicaSets.`,
      ),
    },
    {
      label: DeploymentConfigModel.label,
      value: Resources.OpenShift,
      helperText: createHelpText(
        DeploymentConfigModel,
        `A ${DeploymentConfigModel.label} defines the template for a pod \
        and manages deploying new images or configuration changes`,
      ),
    },
  ];

  const knativeServiceAccess = useAccessReview({
    group: ServiceModel.apiGroup,
    resource: ServiceModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });

  if (flags[FLAG_KNATIVE_SERVING_SERVICE] && knativeServiceAccess) {
    radioOptions.push({
      label: (
        <div>
          Knative Service
          <span className="odc-resource-section__badge">
            {getBadgeFromType(KnativeServingModel.badge)}
          </span>
        </div>
      ),
      value: Resources.KnativeService,
      helperText: createHelpText(
        ServiceModel,
        `A Knative Service enables scaling to zero when idle`,
      ),
    });
  }
  return (
    <FormSection title="Resources" fullWidth>
      <div>Select the resource type to generate</div>
      <RadioButtonField
        name="resources"
        options={radioOptions}
        className="odc-resource-section__radio"
      />
    </FormSection>
  );
};

export default connectToFlags(FLAG_KNATIVE_SERVING_SERVICE)(ResourceSection);
