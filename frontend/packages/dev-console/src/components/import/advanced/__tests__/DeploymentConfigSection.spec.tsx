import * as React from 'react';
import { shallow } from 'enzyme';
import { EnvironmentField } from '@console/shared';
import DeploymentConfigSection from '../DeploymentConfigSection';

let deploymentConfigSectionProps: React.ComponentProps<typeof DeploymentConfigSection>;

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    values: {
      project: {
        name: 'my-app',
      },
      resources: 'kubernetes',
      deployment: {
        env: [
          {
            name: 'GREET',
            value: 'hi',
          },
        ],
      },
    },
  })),
}));

describe('DeploymentConfigSection', () => {
  beforeEach(() => {
    deploymentConfigSectionProps = {
      namespace: 'my-app',
    };
  });

  it('should render EnvironmentField and have values of Environment', () => {
    const wrapper = shallow(<DeploymentConfigSection {...deploymentConfigSectionProps} />);
    expect(wrapper.find(EnvironmentField).exists()).toBe(true);
    expect(wrapper.find(EnvironmentField).props().envs).toEqual([
      {
        name: 'GREET',
        value: 'hi',
      },
    ]);
  });
});
