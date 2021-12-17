import * as React from 'react';
import { shallow } from 'enzyme';
import { SelectInputField } from '@console/shared/src';
import { Resources } from '../../import-types';
import PortInputField from '../../route/PortInputField';
import RouteSection from '../RouteSection';

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    values: {
      image: { ports: [] },
    },
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
  })),
}));

describe('RouteSection', () => {
  let props: React.ComponentProps<typeof RouteSection>;

  beforeEach(() => {
    props = {
      route: {
        create: true,
        defaultUnknownPort: 8080,
        disable: false,
        hostname: '',
        path: '',
        secure: false,
        targetPort: '',
        tls: {
          caCertificate: '',
          certificate: '',
          destinationCACertificate: '',
          insecureEdgeTerminationPolicy: '',
          key: '',
          termination: '',
        },
        unknownTargetPort: '',
      },
      resources: Resources.OpenShift,
    };
  });

  it('Render RouteCheckbox', () => {
    const component = shallow(<RouteSection {...props} />);
    expect(component.isEmptyRender()).toBe(false);
  });

  it('should show the Target port field if the create route checkbox is checked ', () => {
    const component = shallow(<RouteSection {...props} />);
    expect(component.find(PortInputField).exists()).toBe(true);
    expect(
      component
        .find(PortInputField)
        .dive()
        .find(SelectInputField)
        .props().label,
    ).toEqual('Target port');
  });

  it('should not show the Target port field if the create route checkbox is not checked ', () => {
    props.route.create = false;
    const component = shallow(<RouteSection {...props} />);
    expect(component.find(PortInputField).exists()).toBe(false);
  });
});
