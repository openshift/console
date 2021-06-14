import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import { mockDeploymentConfig } from '../__mocks__/edit-deployment-data';
import EditDeployment from '../EditDeployment';

type EditDeploymentProps = React.ComponentProps<typeof EditDeployment>;
type FormProps = React.ComponentProps<typeof Formik>;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('EditDeployment Form', () => {
  let formProps: EditDeploymentProps;
  let EditDeploymentWrapper: ShallowWrapper<EditDeploymentProps>;

  beforeEach(() => {
    formProps = {
      heading: 'Edit DeploymentConfig',
      resource: mockDeploymentConfig,
      name: 'nationalparks-py-dc',
      namespace: 'div',
    };
    EditDeploymentWrapper = shallow(<EditDeployment {...formProps} />);
  });

  it('should render a Formik component', () => {
    const EditDeploymentForm = EditDeploymentWrapper.find(Formik);
    expect(EditDeploymentForm).toHaveLength(1);
  });

  it('should have form view as default option', () => {
    const EditDeploymentForm = EditDeploymentWrapper.find(Formik);
    const props = EditDeploymentForm.props() as FormProps;
    expect(props.initialValues.editorType).toBe('form');
  });

  it('should contain the given deployment values in intialValues', () => {
    const EditDeploymentForm = EditDeploymentWrapper.find(Formik);
    const props = EditDeploymentForm.props() as FormProps;
    const { name, project } = props.initialValues.formData;

    expect(name).toBe(mockDeploymentConfig.metadata.name);
    expect(project.name).toBe(mockDeploymentConfig.metadata.namespace);
  });
});
