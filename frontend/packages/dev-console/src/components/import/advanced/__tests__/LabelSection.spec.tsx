/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import LabelSection from '../LabelSection';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: function MockTrans(props) {
    const React = require('react');
    return React.createElement('span', { 'data-testid': 'trans' }, props.children);
  },
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('../../section/FormSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockFormSection(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'form-section',
          'data-title': props.title,
          'data-subtitle': props.subTitle,
        },
        [
          props.title && React.createElement('h3', { key: 'title' }, props.title),
          props.subTitle && React.createElement('p', { key: 'subtitle' }, props.subTitle),
          props.children,
        ],
      );
    },
  };
});

jest.mock('@console/shared/src/components/formik-fields/SelectorInputField', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockSelectorInputField(props) {
      return React.createElement('input', {
        'data-test': props.dataTest || 'selector-input-field',
        name: props.name,
        placeholder: props.placeholder,
        type: 'text',
      });
    },
  };
});

describe('LabelSection', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render a form section', () => {
    renderWithProviders(<LabelSection />);

    const formSection = screen.getByTestId('form-section');
    expect(formSection).toBeInTheDocument();
    expect(formSection.getAttribute('data-title')).toBe('devconsole~Labels');
    expect(formSection.getAttribute('data-subtitle')).toBe(
      'devconsole~Each label is applied to each created resource.',
    );
  });

  it('should render an input field', () => {
    renderWithProviders(<LabelSection />);

    const formSection = screen.getByTestId('form-section');
    expect(formSection).toBeInTheDocument();

    const inputField = screen.getByTestId('labels');
    expect(inputField).toBeInTheDocument();
    expect(inputField.getAttribute('name')).toBe('labels');
    expect(inputField.getAttribute('placeholder')).toBe('app.io/type=frontend');
  });
});
