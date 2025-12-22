import type { ComponentProps } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { ServiceModel } from '../../../models';
import SinkSourceModal from '../SinkSourceModal';

jest.mock('@console/internal/components/factory/modal', () => ({
  ModalTitle: jest.fn(() => null),
  ModalBody: jest.fn(() => null),
  ModalSubmitFooter: jest.fn(() => null),
}));

jest.mock('../../add/event-sources/form-fields/SinkUriResourcesGroup', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('@console/dev-console/src/components/import/section/FormSection', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: jest.fn(() => null),
}));

type SinkSourceModalProps = ComponentProps<typeof SinkSourceModal>;

describe('SinkSourceModal Form', () => {
  let formProps: SinkSourceModalProps;
  const formValues = {
    formData: {
      sink: {
        apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
        kind: ServiceModel.kind,
        name: 'event-greeter',
        key: 'serving.knative.dev~event-greeter',
      },
    },
  };

  beforeEach(() => {
    formProps = {
      ...formikFormProps,
      values: formValues,
      resourceName: 'myapps',
      namespace: 'myapp',
      initialValues: formValues,
    };
  });

  it('should render form with modal structure', () => {
    const { container } = render(<SinkSourceModal {...formProps} />);
    expect(container.querySelector('form')).toBeInTheDocument();
    expect(container.querySelector('form')).toHaveClass('modal-content');
  });

  it('should call handleSubmit on form submit', () => {
    const { container } = render(<SinkSourceModal {...formProps} />);
    const form = container.querySelector('form');
    if (form) {
      fireEvent.submit(form);
    }
    expect(formProps.handleSubmit).toHaveBeenCalled();
  });

  it('should render with different values without errors', () => {
    const sinkValues = {
      formData: {
        sink: {
          apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
          kind: ServiceModel.kind,
          name: 'event-greeter-new',
        },
      },
    };
    const updatedFormProps = {
      ...formProps,
      values: {
        ...formProps.values,
        ...sinkValues,
      },
    };
    expect(() => render(<SinkSourceModal {...updatedFormProps} />)).not.toThrow();
  });
});
