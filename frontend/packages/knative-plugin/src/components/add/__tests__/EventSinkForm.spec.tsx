import type { ComponentProps, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { CamelKameletBindingModel } from '../../../models';
import { mockKameletSink } from '../__mocks__/Kamelet-data';
import EventSinkForm from '../EventSinkForm';

jest.mock('@console/shared', () => {
  const { createKnativeTextStub: createTextStub } = jest.requireActual(
    '@console/knative-plugin/src/__tests__/rtl-stub-components',
  );
  return {
    FormFooter: createTextStub('mock-FormFooter'),
    SyncedEditorField: createTextStub('mock-SyncedEditorField'),
    FlexForm: ({ children }: { children?: ReactNode }) => children ?? null,
    FormBody: ({ children }: { children?: ReactNode }) => children ?? null,
    CodeEditorField: createTextStub('mock-CodeEditorField'),
  };
});

jest.mock('../event-sinks/EventSinkSection', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-EventSinkSection'),
}));

jest.mock('react-i18next');

let eventSinkFormProps: ComponentProps<typeof EventSinkForm>;

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

  it('should render SyncedEditorField and FormFooter', () => {
    render(<EventSinkForm {...eventSinkFormProps} />);
    expect(screen.getByText('mock-SyncedEditorField')).toBeVisible();
    expect(screen.getByText('mock-FormFooter')).toBeVisible();
  });
});
