import type { ComponentProps } from 'react';
import { render } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { kameletSourceTelegram } from '../../../utils/__tests__/knative-eventing-data';
import EventSourceForm from '../EventSourceForm';

jest.mock('@console/shared', () => ({
  FormFooter: 'FormFooter',
  SyncedEditorField: 'SyncedEditorField',
  FlexForm: 'FlexForm',
  CodeEditorField: 'CodeEditorField',
  FormBody: 'FormBody',
}));

jest.mock('../event-sources/EventSourceSection', () => 'EventSourceSection');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: any) => Component,
}));

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

  it('should render FlexForm, SyncedEditorField and FormFooter if Source is valid', () => {
    const { container } = render(<EventSourceForm {...eventSourceFormProps} />);
    expect(container.querySelector('FlexForm')).toBeInTheDocument();
    expect(container.querySelector('SyncedEditorField')).toBeInTheDocument();
    expect(container.querySelector('FormFooter')).toBeInTheDocument();
  });

  it('should render FlexForm, SyncedEditorField and FormFooter if is a Kamelet', () => {
    const { container } = render(
      <EventSourceForm {...eventSourceFormProps} kameletSource={kameletSourceTelegram} />,
    );
    expect(container.querySelector('FlexForm')).toBeInTheDocument();
    expect(container.querySelector('SyncedEditorField')).toBeInTheDocument();
    expect(container.querySelector('FormFooter')).toBeInTheDocument();
  });
});
