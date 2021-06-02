import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import * as formik from 'formik';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import * as imgUtils from '../../../../utils/imagestream-utils';
import { BuilderImagesNamespace } from '../../../../utils/imagestream-utils';
import {
  appResources,
  internalImageValues,
} from '../../../edit-application/__tests__/edit-application-data';
import ImageStream from '../ImageStream';
import ImageStreamDropdown from '../ImageStreamDropdown';
import ImageStreamNsDropdown from '../ImageStreamNsDropdown';
import ImageStreamTagDropdown from '../ImageStreamTagDropdown';

const spyUseFormikContext = jest.spyOn(formik, 'useFormikContext');
const spyUseReducer = jest.spyOn(React, 'useReducer');
const spyUseField = jest.spyOn(formik, 'useField');
const spyGetImageStreamTags = jest.spyOn(imgUtils, 'getImageStreamTags');
const spyUseState = jest.spyOn(React, 'useState');

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

const mockReducerState = {
  loading: false,
  accessLoading: false,
  selectedImageStream: appResources.imageStream.data[0],
};
type ImagestreamProps = React.ComponentProps<typeof ImageStream>;

describe('Imagestream', () => {
  let wrapper: ShallowWrapper<ImagestreamProps>;
  beforeEach(() => {
    spyGetImageStreamTags.mockReturnValue({ 3.6: 3.6 });
    spyUseReducer.mockImplementation(() => [mockReducerState, jest.fn()]);
    spyUseField.mockImplementation(() => [{ value: '' }, {}]);
    spyUseState.mockReturnValue([true, jest.fn()]);
    spyUseFormikContext.mockReturnValue({
      ...formikFormProps,
      values: internalImageValues,
      initialValues: internalImageValues,
    });
    wrapper = shallow(<ImageStream />);
  });

  it('should render namespace, imagestream and imagestream-tag dropdowns ', () => {
    expect(wrapper.find(ImageStreamNsDropdown)).toHaveLength(1);
    expect(wrapper.find(ImageStreamDropdown)).toHaveLength(1);
    expect(wrapper.find(ImageStreamTagDropdown)).toHaveLength(1);
  });

  it('should not render any alerts if current project and imagestream project is the same', () => {
    expect(wrapper.find(Alert)).toHaveLength(0);
  });

  it('should not render any alerts if the imagestream namespace is openshift', () => {
    spyUseFormikContext.mockReturnValue({
      ...formikFormProps,
      values: {
        ...internalImageValues,
        project: { name: 'project-a' },
        imageStream: {
          ...internalImageValues.imageStream,
          namespace: BuilderImagesNamespace.Openshift,
        },
      },
      initialValues: internalImageValues,
    });
    wrapper = shallow(<ImageStream />);
    expect(wrapper.find(Alert)).toHaveLength(0);
  });

  it('should render oc command alert if current namespace and imagestream namespace are not equal', () => {
    spyUseFormikContext.mockReturnValue({
      ...formikFormProps,
      values: { ...internalImageValues, project: { name: 'project-a' } },
      initialValues: internalImageValues,
    });
    wrapper = shallow(<ImageStream />);
    const alert = wrapper.find(Alert);
    expect(alert).toHaveLength(1);
    expect(alert.props().title).toEqual(
      `devconsole~Service account default will need pull authority to deploy Images from {{namespace}}`,
    );
  });

  it('should render imagestream not found alert if there are no imagestreams', () => {
    spyUseFormikContext.mockReturnValue({
      ...formikFormProps,
      values: { ...internalImageValues, imageStream: { image: '' } },
    });
    wrapper = shallow(<ImageStream />);
    expect(wrapper.find(Alert)).toHaveLength(1);
  });

  it('should render imagestream tag not found alert if there are no imagestreams tags', () => {
    spyGetImageStreamTags.mockReturnValue({});
    spyUseFormikContext.mockReturnValue({
      ...formikFormProps,
      values: {
        ...internalImageValues,
        imageStream: { image: 'python', tag: '', namespace: 'div' },
      },
      initialValues: internalImageValues,
    });
    wrapper = shallow(<ImageStream />);
    expect(wrapper.find(Alert)).toHaveLength(1);
  });
});
