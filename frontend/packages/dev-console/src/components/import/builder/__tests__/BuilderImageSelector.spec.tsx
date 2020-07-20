import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { ItemSelectorField } from '@console/shared';
import { FormGroup } from '@patternfly/react-core';
import BuilderImageSelector from '../BuilderImageSelector';
import { NormalizedBuilderImages } from '../../../../utils/imagestream-utils';

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    initialValues: {},
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
    },
    touched: {},
  })),
  getFieldId: jest.fn(),
}));

type BuilderImageSelectorProps = React.ComponentProps<typeof BuilderImageSelector>;
let props: BuilderImageSelectorProps;

describe('BuilderImageSelector', () => {
  const builderImages: NormalizedBuilderImages = {
    nodejs: {
      obj: {},
      name: 'nodejs',
      displayName: 'Node.js',
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

  beforeEach(() => {
    props = {
      builderImages,
      loadingImageStream: false,
    };
  });

  it('should render FormGroup when there are more than one builderImages', () => {
    const builderImageSelector = shallow(<BuilderImageSelector {...props} />);
    expect(builderImageSelector.find(FormGroup)).toHaveLength(1);
    expect(builderImageSelector.find(ItemSelectorField)).toHaveLength(1);
  });

  it('should not render FormGroup when there are no more than one builderImage', () => {
    const singleBuilderImage = _.omit(_.cloneDeep(builderImages), 'golang');
    const builderImageSelector = shallow(
      <BuilderImageSelector {...props} builderImages={singleBuilderImage} />,
    );
    expect(builderImageSelector.find(FormGroup)).toHaveLength(0);
    expect(builderImageSelector.find(ItemSelectorField)).toHaveLength(1);
  });
});
