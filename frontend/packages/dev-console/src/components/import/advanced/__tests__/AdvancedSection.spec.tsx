import * as React from 'react';
import { shallow } from 'enzyme';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import HealthChecks from '../../../health-checks/HealthChecks';
import { Resources } from '../../import-types';
import AdvancedSection from '../AdvancedSection';
import BuildConfigSection from '../BuildConfigSection';
import DeploymentConfigSection from '../DeploymentConfigSection';
import LabelSection from '../LabelSection';
import ResourceLimitSection from '../ResourceLimitSection';
import RouteSection from '../RouteSection';
import ScalingSection from '../ScalingSection';
import ServerlessScalingSection from '../ServerlessScalingSection';

let advanceSectionProps: React.ComponentProps<typeof AdvancedSection>;

describe('AdvancedSection', () => {
  beforeEach(() => {
    advanceSectionProps = {
      ...formikFormProps,
      values: {
        route: {
          disable: true,
        },
        project: {
          name: 'my-app',
        },
        resources: Resources.Kubernetes,
        deployment: {
          env: [],
        },
        pipeline: {
          enabled: false,
        },
      },
    };
  });

  it('Should render advance section for Kubernetes(D) resource and not serverless sections', () => {
    const wrapper = shallow(<AdvancedSection {...advanceSectionProps} />);
    const list = wrapper.find('List');
    const listItems = list.shallow();
    expect(wrapper.find(RouteSection).exists()).toBe(true);
    expect(listItems.find(HealthChecks).exists()).toBe(true);
    expect(listItems.find(BuildConfigSection).exists()).toBe(true);
    expect(listItems.find(DeploymentConfigSection).exists()).toBe(true);
    expect(listItems.find(ScalingSection).exists()).toBe(true);
    expect(listItems.find(ResourceLimitSection).exists()).toBe(true);

    expect(listItems.find(LabelSection).exists()).toBe(true);
    expect(listItems.find(ServerlessScalingSection).exists()).toBe(false);
  });

  it('Should render advance section for openshift(DC) resource and not show BuildConfigSection if pipelines enabled', () => {
    const newAdvanceSectionProps = {
      ...advanceSectionProps,
      values: {
        ...advanceSectionProps.values,
        resources: Resources.OpenShift,
        pipeline: {
          enabled: true,
        },
      },
    };

    const wrapper = shallow(<AdvancedSection {...newAdvanceSectionProps} />);
    const list = wrapper.find('List');
    const listItems = list.shallow();
    expect(wrapper.find(RouteSection).exists()).toBe(true);
    expect(listItems.find(HealthChecks).exists()).toBe(true);
    expect(listItems.find(DeploymentConfigSection).exists()).toBe(true);
    expect(listItems.find(ScalingSection).exists()).toBe(true);
    expect(listItems.find(ResourceLimitSection).exists()).toBe(true);
    expect(listItems.find(LabelSection).exists()).toBe(true);

    expect(listItems.find(BuildConfigSection).exists()).toBe(false);
    expect(listItems.find(ServerlessScalingSection).exists()).toBe(false);
  });

  it('Should render advance section specifiic for knative(KSVC) resource', () => {
    const newAdvanceSectionProps = {
      ...advanceSectionProps,
      values: {
        ...advanceSectionProps.values,
        resources: Resources.KnativeService,
      },
    };
    const wrapper = shallow(<AdvancedSection {...newAdvanceSectionProps} />);
    const list = wrapper.find('List');
    const listItems = list.shallow();
    expect(wrapper.find(RouteSection).exists()).toBe(true);
    expect(listItems.find(HealthChecks).exists()).toBe(true);
    expect(listItems.find(BuildConfigSection).exists()).toBe(true);
    expect(listItems.find(DeploymentConfigSection).exists()).toBe(true);
    expect(listItems.find(ServerlessScalingSection).exists()).toBe(true);
    expect(listItems.find(ResourceLimitSection).exists()).toBe(true);
    expect(listItems.find(LabelSection).exists()).toBe(true);

    expect(wrapper.find(ScalingSection).exists()).toBe(false);
  });
});
