import * as React from 'react';
import { render } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { CamelKameletBindingModel } from '../../../models';
import { mockKameletSink } from '../__mocks__/Kamelet-data';
import EventSinkForm from '../EventSinkForm';
import '@testing-library/jest-dom';

jest.mock('@console/shared', () => ({
  FormFooter: 'FormFooter',
  SyncedEditorField: 'SyncedEditorField',
  FlexForm: 'FlexForm',
  FormBody: 'FormBody',
  CodeEditorField: 'CodeEditorField',
}));

jest.mock('../event-sinks/EventSinkSection', () => 'EventSinkSection');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: any) => Component,
}));

let eventSinkFormProps: React.ComponentProps<typeof EventSinkForm>;

describe('EventSinkForm', () => {
  beforeEach(() => {
    eventSinkFormProps = {
      ...formikFormProps,
      values: {
        formData: {
          type: CamelKameletBindingModel.kind,
        },
      },
      namespace: 'myapp',
      eventSinkMetaDescription: 'null',
      kameletSink: mockKameletSink,
    };
  });

  it('should render FlexForm, SyncedEditorField and FormFooter', () => {
    const { container } = render(<EventSinkForm {...eventSinkFormProps} />);
    expect(container.querySelector('FlexForm')).toBeInTheDocument();
    expect(container.querySelector('SyncedEditorField')).toBeInTheDocument();
    expect(container.querySelector('FormFooter')).toBeInTheDocument();
  });
});
