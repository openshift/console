/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import { ImageTag } from '@console/dev-console/src/utils/imagestream-utils';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import UploadJarForm from '../UploadJarForm';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@patternfly/react-core', () => ({
  Alert: function MockAlert(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'alert',
        'data-variant': props.variant,
        'data-title': props.title,
        'data-inline': props.isInline,
      },
      props.children,
    );
  },
}));

jest.mock('@console/shared/src/components/form-utils', () => ({
  FlexForm: function MockFlexForm(props) {
    const React = require('react');
    return React.createElement(
      'form',
      {
        'data-test': 'flex-form',
        'data-test-id': props['data-test-id'],
        onSubmit: props.onSubmit,
      },
      props.children,
    );
  },
  FormBody: function MockFormBody(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'form-body',
      },
      props.children,
    );
  },
  FormFooter: function MockFormFooter(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'form-footer',
        'data-submit-label': props.submitLabel,
        'data-reset-label': props.resetLabel,
        'data-is-submitting': props.isSubmitting,
        'data-disable-submit': props.disableSubmit,
      },
      'Form Footer',
    );
  },
}));

jest.mock('../section/JarSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockJarSection() {
      return React.createElement('div', { 'data-test': 'jar-section' }, 'Jar Section');
    },
  };
});

jest.mock('../../section/IconSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockIconSection() {
      return React.createElement('div', { 'data-test': 'icon-section' }, 'Icon Section');
    },
  };
});

jest.mock('../../builder/BuilderImageTagSelector', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockBuilderImageTagSelector(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'builder-image-tag-selector',
          'data-selected-builder-image': JSON.stringify(props.selectedBuilderImage),
          'data-selected-image-tag': JSON.stringify(props.selectedImageTag),
          'data-show-image-info': props.showImageInfo,
        },
        'Builder Image Tag Selector',
      );
    },
  };
});

jest.mock('../../app/AppSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockAppSection(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'app-section',
          'data-project': JSON.stringify(props.project),
          'data-no-projects-available': props.noProjectsAvailable,
        },
        'App Section',
      );
    },
  };
});

jest.mock('../../advanced/AdvancedSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockAdvancedSection(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'advanced-section',
          'data-values': JSON.stringify(props.values),
        },
        'Advanced Section',
      );
    },
  };
});

jest.mock('../../NamespaceSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockNamespaceSection() {
      return React.createElement('div', { 'data-test': 'namespace-section' }, 'Namespace Section');
    },
  };
});

jest.mock('../../section/FormSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockFormSection(props) {
      return React.createElement('div', { 'data-test': 'form-section' }, props.children);
    },
  };
});

jest.mock('../../section/ResourceSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockResourceSection() {
      return React.createElement('div', { 'data-test': 'resource-section' }, 'Resource Section');
    },
  };
});

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@console/internal/components/utils', () => ({
  usePreventDataLossLock: jest.fn(),
}));

describe('UploadJarForm', () => {
  const tagData: ImageTag = {
    name: 'openjdk-11-el7',
    generation: 2,
    annotations: {},
  };

  const defaultProps = {
    ...formikFormProps,
    values: {
      image: { tag: tagData },
      project: { name: 'test-project' },
    },
    namespace: 'my-app',
    projects: {
      loaded: true,
      data: [],
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

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render form components', () => {
    render(<UploadJarForm {...defaultProps} />);

    expect(screen.getByTestId('jar-section')).toBeInTheDocument();
    expect(screen.getByTestId('icon-section')).toBeInTheDocument();
    expect(screen.getByTestId('builder-image-tag-selector')).toBeInTheDocument();
    expect(screen.getByTestId('app-section')).toBeInTheDocument();
    expect(screen.getByTestId('advanced-section')).toBeInTheDocument();
    expect(screen.getByTestId('namespace-section')).toBeInTheDocument();
    expect(screen.getByTestId('resource-section')).toBeInTheDocument();
    expect(screen.getByTestId('form-footer')).toBeInTheDocument();
    const builderImageSelector = screen.getByTestId('builder-image-tag-selector');
    expect(builderImageSelector.getAttribute('data-show-image-info')).toBe('false');
  });

  it('should not render BuilderImageTagSelector if builderImage is not present and show alert', () => {
    const updatedProps = {
      ...formikFormProps,
      values: {
        image: { tag: tagData },
        project: { name: 'test-project' },
      },
      namespace: 'my-app',
      projects: {
        loaded: true,
        data: [],
        loadError: null,
      },
    };

    render(<UploadJarForm {...updatedProps} />);
    expect(screen.getByTestId('jar-section')).toBeInTheDocument();
    expect(screen.getByTestId('icon-section')).toBeInTheDocument();
    expect(screen.getByTestId('app-section')).toBeInTheDocument();
    expect(screen.getByTestId('advanced-section')).toBeInTheDocument();
    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.queryByTestId('builder-image-tag-selector')).not.toBeInTheDocument();
    const alert = screen.getByTestId('alert');
    expect(alert.getAttribute('data-variant')).toBe('warning');
    expect(alert.getAttribute('data-title')).toBe('devconsole~Unable to detect the Builder Image.');
    expect(alert.getAttribute('data-inline')).toBe('true');
  });
});
