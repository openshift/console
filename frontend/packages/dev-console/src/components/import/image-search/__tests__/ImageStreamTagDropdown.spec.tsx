import type { ComponentType } from 'react';
import { ValidatedOptions } from '@patternfly/react-core';
import { render, screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import * as k8s from '@console/internal/module/k8s';
import { ImageStreamContext } from '../ImageStreamContext';
import ImageStreamTagDropdown from '../ImageStreamTagDropdown';

// Mock the k8s module functions
jest.mock('@console/internal/module/k8s', () => ({
  k8sGet: jest.fn(),
  referenceForModel: jest.fn(() => 'ImageStream'),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  withTranslation: () => (Component: ComponentType) => Component,
}));

jest.mock('@console/shared/src/components/formik-fields/DropdownField', () => ({
  DropdownField: ({ title, onChange }: any) => (
    <button type="button" onClick={() => onChange && onChange('latest')}>
      {title}
    </button>
  ),
}));

// Mock internal components that cause deep import issues
jest.mock('@console/internal/components/image-stream', () => ({
  isBuilder: jest.fn(() => false),
  getMostRecentBuilderTag: jest.fn(() => ({})),
  getBuilderTagsSortedByVersion: jest.fn(() => []),
}));

jest.mock('@console/internal/components/catalog/catalog-item-icon', () => ({
  getImageStreamIcon: jest.fn(() => ''),
  getImageForIconClass: jest.fn(() => ''),
}));

const mockImageStreamTag = {
  metadata: {
    name: 'test-image:latest',
    namespace: 'test-namespace',
    labels: {
      'app.kubernetes.io/name': 'test-app',
    },
  },
  image: {
    dockerImageMetadata: {
      Config: {
        ExposedPorts: {
          '8080/tcp': {},
        },
      },
    },
  },
  tag: 'latest',
  status: {
    conditions: [],
  },
};

const mockImageStreamTagWithError = {
  metadata: {
    name: 'test-image:latest',
    namespace: 'test-namespace',
    labels: {},
  },
  image: {
    dockerImageMetadata: {},
  },
  tag: 'latest',
  status: {
    conditions: [
      {
        type: 'ImportSuccess',
        status: 'False',
        reason: 'Unauthorized',
        message: 'you may not have access to the container image "test-image:latest"',
        lastTransitionTime: '2026-01-01T00:00:00Z',
        generation: 1,
      },
    ],
  },
};

const mockImageStreamContext = {
  state: {
    selectedImageStream: {
      metadata: { name: 'test-image', namespace: 'test-namespace' },
      status: {
        tags: [{ tag: 'latest' }],
      },
    },
    accessLoading: false,
    loading: false,
  },
  dispatch: jest.fn(),
  hasImageStreams: true,
  setHasImageStreams: jest.fn(),
  setValidated: jest.fn(),
};

describe('ImageStreamTagDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful image tag fetch without errors', async () => {
    const k8sGetMock = k8s.k8sGet as jest.Mock;
    k8sGetMock.mockResolvedValue(mockImageStreamTag);

    const initialValues = {
      imageStream: {
        namespace: 'test-namespace',
        image: 'test-image',
        tag: '',
      },
      isi: {},
      name: '',
      application: { selectedKey: '' },
    };

    render(
      <ImageStreamContext.Provider value={mockImageStreamContext}>
        <Formik initialValues={initialValues} onSubmit={jest.fn()}>
          {() => <ImageStreamTagDropdown />}
        </Formik>
      </ImageStreamContext.Provider>,
    );

    expect(screen.getByRole('button')).toBeTruthy();

    await waitFor(() => {
      expect(mockImageStreamContext.setValidated).not.toHaveBeenCalledWith(ValidatedOptions.error);
    });
  });

  it('should detect and handle ImportSuccess failure conditions', async () => {
    const k8sGetMock = k8s.k8sGet as jest.Mock;
    k8sGetMock.mockResolvedValue(mockImageStreamTagWithError);

    const initialValues = {
      imageStream: {
        namespace: 'test-namespace',
        image: 'test-image',
        tag: 'latest',
      },
      isi: {},
      name: '',
      application: { selectedKey: '' },
    };

    render(
      <ImageStreamContext.Provider value={mockImageStreamContext}>
        <Formik initialValues={initialValues} onSubmit={jest.fn()}>
          {() => <ImageStreamTagDropdown />}
        </Formik>
      </ImageStreamContext.Provider>,
    );

    await waitFor(
      () => {
        expect(k8sGetMock).toHaveBeenCalledWith(
          expect.anything(),
          'test-image:latest',
          'test-namespace',
        );
      },
      { timeout: 3000 },
    );

    await waitFor(
      () => {
        expect(mockImageStreamContext.setValidated).toHaveBeenCalledWith(ValidatedOptions.error);
      },
      { timeout: 3000 },
    );
  });

  it('should normalize status to Success when no failure conditions exist', async () => {
    const k8sGetMock = k8s.k8sGet as jest.Mock;
    k8sGetMock.mockResolvedValue(mockImageStreamTag);

    const initialValues = {
      imageStream: {
        namespace: 'test-namespace',
        image: 'test-image',
        tag: 'latest',
      },
      isi: {},
      name: '',
      application: { selectedKey: '' },
    };

    render(
      <ImageStreamContext.Provider value={mockImageStreamContext}>
        <Formik initialValues={initialValues} onSubmit={jest.fn()}>
          {() => <ImageStreamTagDropdown />}
        </Formik>
      </ImageStreamContext.Provider>,
    );

    await waitFor(
      () => {
        expect(mockImageStreamContext.setValidated).toHaveBeenCalledWith(ValidatedOptions.success);
      },
      { timeout: 3000 },
    );
  });

  it('should handle network errors during image tag fetch', async () => {
    const k8sGetMock = k8s.k8sGet as jest.Mock;
    k8sGetMock.mockRejectedValue(new Error('Network error'));

    const initialValues = {
      imageStream: {
        namespace: 'test-namespace',
        image: 'test-image',
        tag: 'latest',
      },
      isi: {},
      name: '',
      application: { selectedKey: '' },
    };

    render(
      <ImageStreamContext.Provider value={mockImageStreamContext}>
        <Formik initialValues={initialValues} onSubmit={jest.fn()}>
          {() => <ImageStreamTagDropdown />}
        </Formik>
      </ImageStreamContext.Provider>,
    );

    await waitFor(() => {
      expect(mockImageStreamContext.setValidated).toHaveBeenCalledWith(ValidatedOptions.error);
    });
  });
});
