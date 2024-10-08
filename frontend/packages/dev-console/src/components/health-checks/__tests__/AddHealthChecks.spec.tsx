import * as React from 'react';
import { shallow } from 'enzyme';
import { ContainerSelect, ResourceLink } from '@console/internal/components/utils';
import * as utils from '@console/internal/components/utils/rbac';
import { FormFooter } from '@console/shared';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { sampleDeployments } from '@console/shared/src/utils/__tests__/test-resource-data';
import { getResourcesType } from '../../edit-application/edit-application-utils';
import AddHealthChecks from '../AddHealthChecks';
import { getHealthChecksData } from '../create-health-checks-probe-utils';
import HealthChecks from '../HealthChecks';

let addHealthCheckProbs: React.ComponentProps<typeof AddHealthChecks>;

describe('AddHealthCheck', () => {
  let spyUseAccessReview;

  beforeEach(() => {
    addHealthCheckProbs = {
      ...formikFormProps,
      currentContainer: 'wit-deployment',
      resource: sampleDeployments.data[2],
      values: {
        containerName: 'wit-deployment',
      },
      initialValues: {
        healthChecks: getHealthChecksData(sampleDeployments.data[1]),
        containerName: 'wit-deployment',
        resources: getResourcesType(sampleDeployments.data[1]),
        image: {
          ports: sampleDeployments.data[1].spec.template.spec.containers[0].ports,
        },
      },
    };
    spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(true);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should load AddHealthCheck', () => {
    const wrapper = shallow(<AddHealthChecks {...addHealthCheckProbs} />);
    expect(wrapper.find(ContainerSelect).exists()).toBe(false);
    expect(wrapper.find(ResourceLink).exists()).toBe(true);
    expect(wrapper.find(HealthChecks).exists()).toBe(true);
    expect(wrapper.find(FormFooter).exists()).toBe(true);
  });
});
