import { render, screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import type { NormalizedBuilderImages } from '../../../../utils/imagestream-utils';
import BuilderImageSelector from '../BuilderImageSelector';

jest.mock('@console/shared', () => ({
  ItemSelectorField: (props) =>
    `ItemSelectorField name=${props.name} loadingItems=${props.loadingItems} recommended=${props.recommended}`,
  getFieldId: jest.fn(() => 'image-name-selector'),
}));

jest.mock('@patternfly/react-core', () => ({
  FormGroup: (props) => props.children,
  Alert: () => 'Alert',
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingInline: () => 'Loading...',
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../../../const', () => ({
  PIPELINE_RUNTIME_LABEL: 'pipeline-runtime-label',
}));

jest.mock('../../../../types/pipeline', () => ({
  PipelineKind: {},
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
  getFieldId: jest.fn(),
}));

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
    (useFormikContext as jest.Mock).mockReturnValue({
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

    expect(screen.getByText(/ItemSelectorField/)).toBeInTheDocument();
  });

  it('should not render FormGroup when there are no more than one builderImage', () => {
    const singleBuilderImage = _.omit(_.cloneDeep(builderImages), 'golang');

    render(<BuilderImageSelector {...defaultProps} builderImages={singleBuilderImage} />);

    expect(
      screen.getByText(/ItemSelectorField name=image\.selected loadingItems=false/),
    ).toBeInTheDocument();
  });
});
