import * as React from 'react';
import { FormGroup } from '@patternfly/react-core';
import { configure, render, waitFor } from '@testing-library/react';
import { Formik, FormikConfig } from 'formik';
import * as _ from 'lodash';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { DropdownField } from '@console/shared/src';
import userEvent from '../../__tests__/user-event';
import { BuildStrategyType } from '../../types';
import ImagesSection, { ImagesSectionFormData } from '../ImagesSection';

const mockImageStream = (props) => (
  <FormGroup fieldId="image-stream-dropdowns" label={props.label} data-test={props.dataTest}>
    <DropdownField
      label="Project"
      name={`${props.formContextField}.imageStream.namespace`}
      title="Select Project"
      items={{ 'project-a': 'project-a', 'project-b': 'project-b' }}
    />
    <DropdownField
      label="Image Stream"
      name={`${props.formContextField}.imageStream.image`}
      title="Select Image Stream"
      items={{ 'imagestream-a': 'imagestream-a', 'imagestream-b': 'imagestream-b' }}
    />
    <DropdownField
      label="Tag"
      name={`${props.formContextField}.imageStream.tag`}
      title="Select tag"
      items={{ latest: 'latest', v1: 'v1', v2: 'v2' }}
    />
  </FormGroup>
);

jest.mock('../../../import/image-search/ImageStream', () => ({
  default: (props) => mockImageStream(props),
}));

configure({ testIdAttribute: 'data-test' });

const Wrapper: React.FC<FormikConfig<ImagesSectionFormData>> = ({ children, ...formikConfig }) => (
  <Provider store={store}>
    <Formik {...formikConfig}>
      {(formikProps) => (
        <form onSubmit={formikProps.handleSubmit}>
          {children}
          <input type="submit" value="Submit" />
        </form>
      )}
    </Formik>
  </Provider>
);

const emptyInitialValues: ImagesSectionFormData = {
  formData: {
    images: {
      buildFrom: {
        type: 'none',
        imageStreamTag: {
          fromImageStreamTag: false,
          isSearchingForImage: false,
          imageStream: {
            namespace: '',
            image: '',
            tag: '',
          },
          project: {
            name: '',
          },
          isi: {
            name: '',
            image: {},
            tag: '',
            status: { metadata: {}, status: '' },
            ports: [],
          },
          image: {
            name: '',
            image: {},
            tag: '',
            status: { metadata: {}, status: '' },
            ports: [],
          },
        },
        imageStreamImage: '',
        dockerImage: '',
      },
      pushTo: {
        type: 'none',
        imageStreamTag: {
          fromImageStreamTag: false,
          isSearchingForImage: false,
          imageStream: {
            namespace: '',
            image: '',
            tag: '',
          },
          project: {
            name: '',
          },
          isi: {
            name: '',
            image: {},
            tag: '',
            status: { metadata: {}, status: '' },
            ports: [],
          },
          image: {
            name: '',
            image: {},
            tag: '',
            status: { metadata: {}, status: '' },
            ports: [],
          },
        },
        imageStreamImage: '',
        dockerImage: '',
      },
    },
  },
};

describe('ImagesSection', () => {
  it('should render form without subforms', () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    renderResult.getByTestId('section images');
    renderResult.getByText('Images');
    renderResult.getByText('Build from');
    renderResult.getByText('Push to');

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should provide three options for build from image (no none option until strategy is Docker)', async () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    // Dropdown titles
    renderResult.getByText('Please select');
    renderResult.getByText('None');

    // Open first dropdown
    userEvent.click(renderResult.getByText('Please select'));

    // Assert options
    const options = renderResult.container
      .querySelector('[data-test="build-from type"]')
      .parentElement.querySelectorAll('li button');
    expect(Object.values(options).map((option) => option.textContent)).toEqual([
      'Image Stream Tag',
      'Image Stream Image',
      'Docker image',
    ]);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should provide four options for build from image (when build strategy is Docker)', () => {
    const initialValues = _.cloneDeep(emptyInitialValues);
    initialValues.formData.images.strategyType = BuildStrategyType.Docker;
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    // Dropdown titles
    expect(renderResult.queryAllByText('None')).toHaveLength(2);

    // Open first dropdown
    userEvent.click(renderResult.getAllByText('None')[0]);

    // Assert options
    const options = renderResult.container
      .querySelector('[data-test="build-from type"]')
      .parentElement.querySelectorAll('li button');
    expect(Object.values(options).map((option) => option.textContent)).toEqual([
      'None',
      'Image Stream Tag',
      'Image Stream Image',
      'Docker image',
    ]);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should provide three options (incl. none) for push to image', () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    // Dropdown titles
    renderResult.getByText('Please select');
    renderResult.getByText('None');

    // Open second dropdown
    userEvent.click(renderResult.getByText('None'));

    // Assert options
    const options = renderResult.container
      .querySelector('[data-test="push-to type"]')
      .parentElement.querySelectorAll('li button');
    expect(Object.values(options).map((option) => option.textContent)).toEqual([
      'None',
      'Image Stream Tag',
      'Docker image',
    ]);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should show a subform when user selects image stream tag', () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    userEvent.click(renderResult.getByText('Please select'));
    userEvent.click(renderResult.getByText('Image Stream Tag'));

    renderResult.getByText('Project');
    renderResult.getByText('Image Stream');
    renderResult.getByText('Tag');

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should show a subform when user selects image stream image', () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    userEvent.click(renderResult.getByText('Please select'));
    userEvent.click(renderResult.getByText('Image Stream Image'));

    expect(renderResult.getAllByRole('textbox')).toHaveLength(1);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should show a subform when user selects dockerfile', () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    userEvent.click(renderResult.getByText('Please select'));
    userEvent.click(renderResult.getByText('Docker image'));

    expect(renderResult.getAllByRole('textbox')).toHaveLength(1);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should submit right form data when user fills out an image stream tag', async () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    userEvent.click(renderResult.getByText('Please select'));
    userEvent.click(renderResult.getByText('Image Stream Tag'));

    // Fill form
    userEvent.click(renderResult.getByText('Select Project'));
    userEvent.click(renderResult.getByText('project-a'));
    userEvent.click(renderResult.getByText('Select Image Stream'));
    userEvent.click(renderResult.getByText('imagestream-a'));
    userEvent.click(renderResult.getByText('Select tag'));
    userEvent.click(renderResult.getByText('latest'));

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: ImagesSectionFormData = {
      formData: {
        images: {
          buildFrom: {
            type: 'imageStreamTag',
            imageStreamTag: {
              fromImageStreamTag: false,
              isSearchingForImage: false,
              imageStream: {
                namespace: 'project-a',
                image: 'imagestream-a',
                tag: 'latest',
              },
              project: {
                name: '',
              },
              isi: {
                name: '',
                image: {},
                tag: '',
                status: { metadata: {}, status: '' },
                ports: [],
              },
              image: {
                name: '',
                image: {},
                tag: '',
                status: { metadata: {}, status: '' },
                ports: [],
              },
            },
            imageStreamImage: '',
            dockerImage: '',
          },
          pushTo: {
            type: 'none',
            imageStreamTag: expect.anything(),
            imageStreamImage: '',
            dockerImage: '',
          },
        },
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  });

  it('should submit right form data when user fills out an image stream image', async () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    // Fill form
    userEvent.click(renderResult.getByText('Please select'));
    userEvent.click(renderResult.getByText('Image Stream Image'));
    userEvent.type(renderResult.getByRole('textbox'), 'my-namespace/an-image');

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: ImagesSectionFormData = {
      formData: {
        images: {
          buildFrom: {
            type: 'imageStreamImage',
            imageStreamTag: expect.anything(),
            imageStreamImage: 'my-namespace/an-image',
            dockerImage: '',
          },
          pushTo: {
            type: 'none',
            imageStreamTag: expect.anything(),
            imageStreamImage: '',
            dockerImage: '',
          },
        },
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  });

  it('should submit right form data when user fills out an dockerfile', async () => {
    const onSubmit = jest.fn();

    const renderResult = render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    // Fill form
    userEvent.click(renderResult.getByText('Please select'));
    userEvent.click(renderResult.getByText('Docker image'));
    userEvent.type(renderResult.getByRole('textbox'), 'centos');

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
    userEvent.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: ImagesSectionFormData = {
      formData: {
        images: {
          buildFrom: {
            type: 'dockerImage',
            imageStreamTag: expect.anything(),
            imageStreamImage: '',
            dockerImage: 'centos',
          },
          pushTo: {
            type: 'none',
            imageStreamTag: expect.anything(),
            imageStreamImage: '',
            dockerImage: '',
          },
        },
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  });
});
