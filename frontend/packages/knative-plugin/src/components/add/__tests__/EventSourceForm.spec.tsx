import type { ComponentProps, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { kameletSourceTelegram } from '../../../utils/__tests__/knative-eventing-data';
import EventSourceForm from '../EventSourceForm';

jest.mock('@console/shared', () => {
  const { createKnativeTextStub: createTextStub } = jest.requireActual(
    '@console/knative-plugin/src/__tests__/rtl-stub-components',
  );
  return {
    FormFooter: createTextStub('mock-FormFooter'),
    SyncedEditorField: ({ formContext }: { formContext?: { editor?: ReactNode } }) =>
      formContext?.editor ?? null,
    FlexForm: ({ children }: { children?: ReactNode }) => children ?? null,
    CodeEditorField: createTextStub('mock-CodeEditorField'),
    FormBody: ({ children }: { children?: ReactNode }) => children ?? null,
  };
});

jest.mock('../event-sources/EventSourceSection', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-EventSourceSection'),
}));

jest.mock('react-i18next');

let eventSourceFormProps: ComponentProps<typeof EventSourceForm>;

describe('EventSourceForm', () => {
  beforeEach(() => {
    eventSourceFormProps = {
      ...formikFormProps,
      values: {
        formData: {
          type: 'ApiServerSource',
        },
      },
      namespace: 'myapp',
      eventSourceMetaDescription: 'null',
    };
  });

  it('should render EventSourceSection and FormFooter if Source is valid', () => {
    render(<EventSourceForm {...eventSourceFormProps} />);
    expect(screen.getByText('mock-FormFooter')).toBeVisible();
    expect(screen.getByText('mock-EventSourceSection')).toBeVisible();
  });

  it('should render EventSourceSection and FormFooter if is a Kamelet', () => {
    render(<EventSourceForm {...eventSourceFormProps} kameletSource={kameletSourceTelegram} />);
    expect(screen.getByText('mock-FormFooter')).toBeVisible();
    expect(screen.getByText('mock-EventSourceSection')).toBeVisible();
  });
});
