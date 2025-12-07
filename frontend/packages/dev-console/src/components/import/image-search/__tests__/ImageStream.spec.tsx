import * as React from 'react';
import { ValidatedOptions } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import * as formik from 'formik';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import * as imgUtils from '../../../../utils/imagestream-utils';
import { BuilderImagesNamespace } from '../../../../utils/imagestream-utils';
import {
  appResources,
  internalImageValues,
} from '../../../edit-application/__tests__/edit-application-data';
import ImageStream from '../ImageStream';

jest.mock('../ImageStreamNsDropdown', () => ({
  __esModule: true,
  default: () => 'Namespace Dropdown',
}));

jest.mock('../ImageStreamDropdown', () => ({
  __esModule: true,
  default: () => 'ImageStream Dropdown',
}));

jest.mock('../ImageStreamTagDropdown', () => ({
  __esModule: true,
  default: () => 'ImageStream Tag Dropdown',
}));

jest.mock('formik', () => ({
  ...jest.requireActual('formik'),
  useFormikContext: jest.fn(),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useReducer: jest.fn(),
}));

jest.mock('../../../../utils/imagestream-utils', () => ({
  ...jest.requireActual('../../../../utils/imagestream-utils'),
  getImageStreamTags: jest.fn(),
}));

const spyUseFormikContext = formik.useFormikContext as jest.Mock;
const spyUseReducer = React.useReducer as jest.Mock;
const spyGetImageStreamTags = imgUtils.getImageStreamTags as jest.Mock;

const mockReducerState = {
  loading: false,
  accessLoading: false,
  selectedImageStream: appResources.imageStream.data[0],
};

describe('ImageStream', () => {
  beforeEach(() => {
    spyGetImageStreamTags.mockReturnValue({ 3.6: 3.6 });
    spyUseReducer.mockImplementation(() => [mockReducerState, jest.fn()]);
    spyUseFormikContext.mockReturnValue({
      ...formikFormProps,
      values: internalImageValues,
      initialValues: internalImageValues,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render namespace, imagestream and imagestream tag dropdowns', () => {
    render(<ImageStream />);

    expect(screen.getByText('Namespace Dropdown')).toBeVisible();
    expect(screen.getByText('ImageStream Dropdown')).toBeVisible();
    expect(screen.getByText('ImageStream Tag Dropdown')).toBeVisible();
  });

  it('should not render any alerts when current project and imagestream project are the same', () => {
    render(<ImageStream />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should not render any alerts when imagestream namespace is openshift', () => {
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

    render(<ImageStream />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render oc command alert when current namespace and imagestream namespace are not equal', () => {
    const spyUseState = jest.spyOn(React, 'useState');
    spyUseState.mockReturnValueOnce([ValidatedOptions.default, jest.fn()]); // validated state
    spyUseState.mockReturnValueOnce([true, jest.fn()]); // hasImageStreams state

    spyUseFormikContext.mockReturnValue({
      ...formikFormProps,
      values: {
        ...internalImageValues,
        project: { name: 'project-a' },
        imageStream: { image: 'python', tag: '3.6', namespace: 'div' },
      },
      initialValues: internalImageValues,
    });

    render(<ImageStream />);

    expect(
      screen.getByText(
        'Service account default will need pull authority to deploy Images from div',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/You can grant authority with the command/)).toBeInTheDocument();

    spyUseState.mockRestore();
  });

  it('should render imagestream not found alert when there are no imagestreams', () => {
    spyUseReducer.mockImplementation(() => [{ ...mockReducerState, loading: false }, jest.fn()]);
    spyUseFormikContext.mockReturnValue({
      ...formikFormProps,
      values: { ...internalImageValues, imageStream: { image: '', namespace: 'div' } },
    });

    render(<ImageStream />);

    expect(screen.getByText('No Image streams found')).toBeInTheDocument();
    expect(screen.getByText('No Image streams are available in Project div')).toBeInTheDocument();
  });

  it('should render imagestream tag not found alert when there are no imagestream tags', () => {
    spyGetImageStreamTags.mockReturnValue({});
    spyUseFormikContext.mockReturnValue({
      ...formikFormProps,
      values: {
        ...internalImageValues,
        imageStream: { image: 'python', tag: '', namespace: 'div' },
      },
      initialValues: internalImageValues,
    });

    render(<ImageStream />);

    expect(screen.getByText('No Image streams tags found')).toBeInTheDocument();
    expect(screen.getByText('No tags are available in Image Stream python')).toBeInTheDocument();
  });
});
