import { render, screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { mockKameletSink } from '../../__mocks__/Kamelet-data';
import { formikMockDataKafkaSink } from '../__mocks__/event-kafka-sink-data';
import EventSinkSection from '../EventSinkSection';

jest.mock('../KafkaSinkSection', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-KafkaSinkSection'),
}));

jest.mock('../SourceSection', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-SourceSection'),
}));

jest.mock('@console/dev-console/src/components/import/app/AppSection', () => ({
  __esModule: true,
  default: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-AppSection'),
}));

jest.mock('@console/shared/src/components/formik-fields/DynamicFormField', () => ({
  DynamicFormField: jest
    .requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
    .createKnativeTextStub('mock-DynamicFormField'),
}));

jest.mock('@console/shared/src/hooks/useFormikValidationFix', () => ({
  useFormikValidationFix: jest.fn(),
}));

jest.mock('@console/operator-lifecycle-manager/src/components/operand/utils', () => ({
  descriptorsToUISchema: jest.fn(() => ({})),
  getSchemaAtPath: jest.fn(() => ({})),
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    values: {
      editorType: 'form',
      formData: {
        project: {
          name: 'my-app',
          displayName: '',
          description: '',
        },
        application: {
          initial: '',
          name: '',
          selectedKey: '',
        },
        name: 'sinkName',
        apiVersion: 'camel.apache.org/v1alpha1',
        sourceType: 'resource',
        source: {
          apiVersion: '',
          kind: '',
          name: '',
          key: '',
          uri: '',
        },
        type: 'KameletBinding',
        data: {
          KameletBinding: {
            sink: {
              ref: {
                apiVersion: 'camel.apache.org/v1alpha1',
                kind: 'Kamelet',
                name: 'kamelet-name',
              },
              properties: {},
            },
          },
        },
      },
      yamlData: '',
    },
  })),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockFormikContext = useFormikContext as jest.Mock;

describe('EventSinkSection', () => {
  const namespace = 'myapp';

  it('should render SourceSection, AppSection, DynamicFormField for Kamelet sink', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([[], true]);
    render(<EventSinkSection namespace={namespace} kameletSink={mockKameletSink} />);
    expect(screen.getByText('mock-SourceSection')).toBeVisible();
    expect(screen.getByText('mock-AppSection')).toBeVisible();
    expect(screen.getByText('mock-DynamicFormField')).toBeVisible();
  });

  it('should render AppSection and KafkaSinkSection for Kafka sink', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([[], true]);
    mockFormikContext.mockReturnValue(formikMockDataKafkaSink);
    render(<EventSinkSection namespace={namespace} />);
    expect(screen.getByText('mock-KafkaSinkSection')).toBeVisible();
    expect(screen.getByText('mock-AppSection')).toBeVisible();
  });

  it('should not render SourceSection and DynamicFormField for Kafka sink', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([[], true]);
    mockFormikContext.mockReturnValue(formikMockDataKafkaSink);
    render(<EventSinkSection namespace={namespace} />);
    expect(screen.queryByText('mock-SourceSection')).not.toBeInTheDocument();
    expect(screen.queryByText('mock-DynamicFormField')).not.toBeInTheDocument();
  });
});
