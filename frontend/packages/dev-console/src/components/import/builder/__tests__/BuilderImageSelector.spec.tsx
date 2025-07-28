/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import * as _ from 'lodash';
import { NormalizedBuilderImages } from '../../../../utils/imagestream-utils';
// eslint-disable-next-line import/order
import BuilderImageSelector from '../BuilderImageSelector';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('@console/shared', () => {
  const React = require('react');
  return {
    ItemSelectorField: function MockItemSelectorField(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'item-selector-field',
          'data-name': props.name,
          'data-loading-items': props.loadingItems,
          'data-recommended': props.recommended,
        },
        'Item Selector Field',
      );
    },
    getFieldId: jest.fn(() => 'image-name-selector'),
  };
});

jest.mock('@patternfly/react-core', () => ({
  FormGroup: function MockFormGroup(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'form-group',
        'data-field-id': props.fieldId,
        'data-label': props.label,
      },
      props.children,
    );
  },
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

jest.mock('@console/internal/components/utils', () => ({
  LoadingInline: function MockLoadingInline() {
    const React = require('react');
    return React.createElement('span', { 'data-test': 'loading-inline' }, 'Loading...');
  },
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@console/pipelines-plugin/src/const', () => ({
  PIPELINE_RUNTIME_LABEL: 'pipeline-runtime-label',
}));

jest.mock('@console/pipelines-plugin/src/types', () => ({
  PipelineKind: {},
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
  getFieldId: jest.fn(),
}));

const mockUseFormikContext = require('formik').useFormikContext;

describe('BuilderImageSelector', () => {
  const builderImages: NormalizedBuilderImages = {
    nodejs: {
      obj: {},
      name: 'nodejs',
      displayName: 'Node.js',
      description: 'Node Description',
      title: 'Node.js',
      iconUrl: '',
      tags: [],
      recentTag: {
        name: '',
        annotations: {},
        generation: 2,
      },
      imageStreamNamespace: 'openshift',
    },
    golang: {
      obj: {},
      name: 'golang',
      displayName: 'Go',
      description: 'Go Description',
      title: 'Go',
      iconUrl: '',
      tags: [],
      recentTag: {
        name: '',
        annotations: {},
        generation: 2,
      },
      imageStreamNamespace: 'openshift',
    },
  };

  const defaultProps = {
    builderImages,
    loadingImageStream: false,
  };

  beforeEach(() => {
    mockUseFormikContext.mockReturnValue({
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
      validateForm: jest.fn(),
      values: {
        image: {
          selected: '',
          recommended: '',
          tag: '',
          tagObj: {},
          ports: [],
          isRecommending: false,
          couldNotRecommend: false,
        },
        pipeline: {
          template: '',
        },
      },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render FormGroup when there are more than one builderImages', () => {
    render(<BuilderImageSelector {...defaultProps} />);

    expect(screen.getByTestId('form-group')).toBeInTheDocument();
    expect(screen.getByTestId('item-selector-field')).toBeInTheDocument();

    const formGroup = screen.getByTestId('form-group');
    expect(formGroup.getAttribute('data-label')).toBe('devconsole~Builder Image');
    expect(formGroup.getAttribute('data-field-id')).toBe('image-name-selector');
  });

  it('should not render FormGroup when there are no more than one builderImage', () => {
    const singleBuilderImage = _.omit(_.cloneDeep(builderImages), 'golang');

    render(<BuilderImageSelector {...defaultProps} builderImages={singleBuilderImage} />);

    expect(screen.queryByTestId('form-group')).not.toBeInTheDocument();
    expect(screen.getByTestId('item-selector-field')).toBeInTheDocument();

    const itemSelector = screen.getByTestId('item-selector-field');
    expect(itemSelector.getAttribute('data-name')).toBe('image.selected');
    expect(itemSelector.getAttribute('data-loading-items')).toBe('false');
  });
});
