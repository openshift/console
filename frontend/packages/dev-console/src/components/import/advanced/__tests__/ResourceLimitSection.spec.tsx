import * as React from 'react';
import { shallow } from 'enzyme';
import { useFormikContext } from 'formik';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import FormSection from '../../section/FormSection';
import ResourceLimitSection from '../ResourceLimitSection';

let resourceLimitSectionProps: React.ComponentProps<typeof ResourceLimitSection>;
const useFormikContextMock = useFormikContext as jest.Mock;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    values: {
      limits: {
        cpu: {
          request: '',
          requestUnit: '',
          defaultRequestUnit: '',
          limit: '',
          limitUnit: '',
          defaultLimitUnit: '',
        },
        memory: {
          request: '',
          requestUnit: 'Mi',
          defaultRequestUnit: 'Mi',
          limit: '',
          limitUnit: 'Mi',
          defaultLimitUnit: 'Mi',
        },
      },
      container: 'nodejs-container',
    },
  })),
}));

const i18nNS = 'devconsole';

describe('ResourceLimitSection', () => {
  beforeEach(() => {
    resourceLimitSectionProps = {
      ...formikFormProps,
      hideTitle: true,
    };
  });

  it('should render helptext for resource limit section', () => {
    const wrapper = shallow(<ResourceLimitSection {...resourceLimitSectionProps} />);
    expect(wrapper.find(FormSection).props().subTitle).toEqual(
      `${i18nNS}~Resource limits control how much CPU and memory a container will consume on a node.`,
    );
  });

  it('should not render Title for resource limit section', () => {
    const wrapper = shallow(<ResourceLimitSection {...resourceLimitSectionProps} />);
    expect(wrapper.find(FormSection).props().title).toBe(false);
  });

  it('should render container name for resource limit section', () => {
    const wrapper = shallow(<ResourceLimitSection {...resourceLimitSectionProps} />);
    expect(
      wrapper
        .find('span')
        .at(0)
        .props().children,
    ).toContainEqual('nodejs-container');
  });

  it('should not render container for resource limit section', () => {
    useFormikContextMock.mockReturnValue({
      values: {
        limits: {
          cpu: {
            request: '',
            requestUnit: '',
            defaultRequestUnit: '',
            limit: '',
            limitUnit: '',
            defaultLimitUnit: '',
          },
          memory: {
            request: '',
            requestUnit: 'Mi',
            defaultRequestUnit: 'Mi',
            limit: '',
            limitUnit: 'Mi',
            defaultLimitUnit: 'Mi',
          },
        },
        container: undefined,
      },
    });
    const wrapper = shallow(<ResourceLimitSection {...resourceLimitSectionProps} />);

    expect(wrapper.find('span').exists()).toBe(false);
  });
});
