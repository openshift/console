import { render } from '@testing-library/react';
import { useFormikContext } from 'formik';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { mockKameletSink } from '../../__mocks__/Kamelet-data';
import { formikMockDataKafkaSink } from '../__mocks__/event-kafka-sink-data';
import EventSinkSection from '../EventSinkSection';
import '@testing-library/jest-dom';

jest.mock('../KafkaSinkSection', () => ({
  __esModule: true,
  default: 'KafkaSinkSection',
}));

jest.mock('../SourceSection', () => ({
  __esModule: true,
  default: 'SourceSection',
}));

jest.mock('@console/dev-console/src/components/import/app/AppSection', () => ({
  __esModule: true,
  default: 'AppSection',
}));

jest.mock('@console/shared', () => ({
  DynamicFormField: 'DynamicFormField',
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
    const { container } = render(
      <EventSinkSection namespace={namespace} kameletSink={mockKameletSink} />,
    );
    expect(container.querySelector('SourceSection')).toBeInTheDocument();
    expect(container.querySelector('AppSection')).toBeInTheDocument();
    expect(container.querySelector('DynamicFormField')).toBeInTheDocument();
  });

  it('should render AppSection and KafkaSinkSection for Kafka sink', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([[], true]);
    mockFormikContext.mockReturnValue(formikMockDataKafkaSink);
    const { container } = render(<EventSinkSection namespace={namespace} />);
    expect(container.querySelector('KafkaSinkSection')).toBeInTheDocument();
    expect(container.querySelector('AppSection')).toBeInTheDocument();
  });

  it('should not render SourceSection and DynamicFormField for Kafka sink', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValue([[], true]);
    mockFormikContext.mockReturnValue(formikMockDataKafkaSink);
    const { container } = render(<EventSinkSection namespace={namespace} />);
    expect(container.querySelector('SourceSection')).not.toBeInTheDocument();
    expect(container.querySelector('DynamicFormField')).not.toBeInTheDocument();
  });
});
