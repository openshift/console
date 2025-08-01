/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import { ImageTag } from '@console/dev-console/src/utils/imagestream-utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import UploadJar from '../UploadJar';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

jest.mock('formik', () => ({
  Formik: function MockFormik(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'formik',
        'data-initial-values': JSON.stringify(props.initialValues),
      },
      'Formik Container',
    );
  },
  FormikHelpers: {},
}));

jest.mock('../UploadJarForm', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockUploadJarForm() {
      return React.createElement(
        'div',
        {
          'data-test': 'upload-jar-form',
        },
        'Upload Jar Form',
      );
    },
  };
});

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  useActivePerspective: jest.fn(() => ['dev']),
  WatchK8sResultsObject: {},
}));

jest.mock('@console/shared/src/hooks/post-form-submit-action', () => ({
  usePostFormSubmitAction: jest.fn(() => jest.fn()),
}));

jest.mock('@console/shared/src', () => ({
  ALL_APPLICATIONS_KEY: '',
  usePerspectives: jest.fn(() => []),
  usePostFormSubmitAction: jest.fn(() => jest.fn()),
}));

jest.mock('../useUploadJarFormToast', () => ({
  useUploadJarFormToast: jest.fn(() => jest.fn()),
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@console/internal/components/utils', () => ({
  history: {
    goBack: jest.fn(),
  },
}));

jest.mock('@console/topology/src/utils', () => ({
  sanitizeApplicationValue: jest.fn((value) => value),
}));

jest.mock('@console/git-service/src', () => ({
  GitProvider: {},
}));

jest.mock('../../form-initial-values', () => ({
  getBaseInitialValues: jest.fn(() => ({
    project: { name: 'test-project' },
    application: { name: '', isInContext: false },
    name: '',
    namespace: 'my-app',
    image: {},
  })),
}));

jest.mock('../../import-submit-utils', () => ({
  filterDeployedResources: jest.fn(() => []),
  handleRedirect: jest.fn(),
}));

jest.mock('../../upload-jar-submit-utils', () => ({
  createOrUpdateJarFile: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../upload-jar-validation-utils', () => ({
  validationSchema: jest.fn(() => ({})),
}));

describe('UploadJar', () => {
  const tagData: ImageTag = {
    name: 'openjdk-11-el7',
    generation: 2,
    annotations: {},
  };

  const defaultProps = {
    namespace: 'my-app',
    projects: {
      data: [],
      loaded: true,
      loadError: null,
    },
    builderImage: {
      description: 'Build and run Java applications using Maven and OpenJDK 11.',
      displayName: 'Red Hat OpenJDK',
      iconUrl: 'static/assets/openjdk.svg',
      imageStreamNamespace: 'openshift',
      name: 'java',
      obj: {},
      title: 'Java',
      recentTag: tagData,
      tags: [tagData],
    },
  };

  beforeEach(() => {
    useK8sWatchResourceMock.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Should render formik', () => {
    useK8sWatchResourceMock.mockReturnValue([]);

    render(<UploadJar {...defaultProps} />);
    expect(screen.getByTestId('formik')).toBeInTheDocument();
    const formikElement = screen.getByTestId('formik');
    const initialValues = JSON.parse(formikElement.getAttribute('data-initial-values'));
    expect(initialValues.namespace).toBe('my-app');
    expect(initialValues.image.selected).toBe('java');
    expect(initialValues.image.tag).toBe('openjdk-11-el7');
    expect(initialValues.runtimeIcon).toBe('java');
  });
});
