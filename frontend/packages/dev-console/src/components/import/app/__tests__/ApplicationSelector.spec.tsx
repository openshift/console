import * as React from 'react';
import * as formik from 'formik';
import { shallow, ShallowWrapper } from 'enzyme';
import { InputField } from '@console/shared';
import { CREATE_APPLICATION_KEY } from '../../../../const';
import ApplicationDropdown from '../../../dropdown/ApplicationDropdown';
import ApplicationSelector from '../ApplicationSelector';

type ApplicationSelectorProps = React.ComponentProps<typeof ApplicationSelector>;

let applicationSelectorProps: ApplicationSelectorProps;

describe('ApplicationSelector', () => {
  let wrapper: ShallowWrapper<ApplicationSelectorProps>;
  const spyUseFormikContext = jest.spyOn(formik, 'useFormikContext');
  const spyUseField = jest.spyOn(formik, 'useField');
  const setFieldTouched = jest.fn();
  const setFieldValue = jest.fn();

  beforeEach(() => {
    applicationSelectorProps = {
      noProjectsAvailable: true,
      namespace: 'rhd-test-ns',
    };
    spyUseField.mockReturnValue([{ value: CREATE_APPLICATION_KEY }, {}]);
    spyUseFormikContext.mockReturnValue({
      setFieldValue,
      setFieldTouched,
      values: {
        application: {
          initial: '',
          name: '',
          selectedKey: CREATE_APPLICATION_KEY,
        },
      },
    });
    wrapper = shallow(<ApplicationSelector {...applicationSelectorProps} />);
    jest.clearAllMocks();
  });

  it('should show InputField if no projects are available', () => {
    expect(wrapper.find(InputField).exists()).toBe(true);
    expect(wrapper.find(InputField).props().required).toBe(true);
  });

  it('should show ApplicationDropdown if projects are available', () => {
    spyUseField.mockImplementationOnce(() => [{ value: CREATE_APPLICATION_KEY }]);
    wrapper.setProps({ noProjectsAvailable: false });
    expect(wrapper.find(ApplicationDropdown).exists()).toBe(true);
  });

  it('should reset the selectedKey if the applications are not loaded', () => {
    wrapper.setProps({ noProjectsAvailable: false });
    wrapper
      .find(ApplicationDropdown)
      .props()
      .onLoad({});
    expect(setFieldValue).toHaveBeenCalledWith('application.selectedKey', '');
  });

  it('should reset the application name if the application list is empty', () => {
    spyUseField.mockImplementationOnce(() => [{ value: CREATE_APPLICATION_KEY }]);
    wrapper.setProps({ noProjectsAvailable: false });
    wrapper
      .find(ApplicationDropdown)
      .props()
      .onLoad({});
    expect(setFieldValue).toHaveBeenCalledWith('application.selectedKey', '');
    expect(setFieldValue).toHaveBeenCalledWith('application.name', '');
    expect(setFieldValue).toHaveBeenCalledTimes(2);
  });

  it('should set the application name and selectedKey on dropdown change', () => {
    wrapper.setProps({ noProjectsAvailable: false });
    wrapper
      .find(ApplicationDropdown)
      .props()
      .onChange('one', 'test-application');

    expect(setFieldValue).toHaveBeenCalledWith('application.selectedKey', 'one');
    expect(setFieldValue).toHaveBeenCalledWith('application.name', 'test-application');
    expect(setFieldTouched).toHaveBeenCalledWith('application.selectedKey', true);
    expect(setFieldValue).toHaveBeenCalledTimes(2);
  });

  it('should not set the application name on dropdown change if the application is undefined', () => {
    wrapper.setProps({ noProjectsAvailable: false });
    wrapper
      .find(ApplicationDropdown)
      .props()
      .onChange('one', undefined);

    expect(setFieldValue).toHaveBeenCalledWith('application.selectedKey', 'one');
    expect(setFieldTouched).toHaveBeenCalledWith('application.selectedKey', true);
    expect(setFieldValue).toHaveBeenCalledWith('application.name', undefined);
    expect(setFieldValue).toHaveBeenCalledTimes(2);
  });
});
