import type { FC, ReactNode } from 'react';
import { FormGroup } from '@patternfly/react-core';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormikConfig } from 'formik';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import DropdownField from '@console/shared/src/components/formik-fields/DropdownField';
import { BuildStrategyType } from '../../types';
import type { ImagesSectionFormData } from '../ImagesSection';
import ImagesSection from '../ImagesSection';

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

interface WrapperProps extends FormikConfig<ImagesSectionFormData> {
  children?: ReactNode;
}

const Wrapper: FC<WrapperProps> = ({ children, ...formikConfig }) => (
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

    render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    expect(screen.getByTestId('section images')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeVisible();
    expect(screen.getByText('Build from')).toBeVisible();
    expect(screen.getByText('Push to')).toBeVisible();

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should provide three options for build from image (no none option until strategy is Docker)', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    // Dropdown titles
    expect(screen.getByText('Please select')).toBeVisible();
    expect(screen.getByText('None')).toBeVisible();

    // Open first dropdown
    await user.click(screen.getByText('Please select'));

    // Assert options
    const menuList = screen.getByTestId('console-select-menu-list');
    const options = within(menuList).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Image Stream Tag',
      'Image Stream Image',
      'External container image',
    ]);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should provide four options for build from image (when build strategy is Docker)', async () => {
    const user = userEvent.setup();
    const initialValues = _.cloneDeep(emptyInitialValues);
    initialValues.formData.images.strategyType = BuildStrategyType.Docker;
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    // Dropdown titles
    expect(screen.queryAllByText('None')).toHaveLength(2);

    // Open first dropdown
    await user.click(screen.getAllByText('None')[0]);

    // Assert options
    const menuList = screen.getByTestId('console-select-menu-list');
    const options = within(menuList).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'None',
      'Image Stream Tag',
      'Image Stream Image',
      'External container image',
    ]);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should provide three options (incl. none) for push to image', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    // Dropdown titles
    expect(screen.getByText('Please select')).toBeVisible();
    expect(screen.getByText('None')).toBeVisible();

    // Open second dropdown
    await user.click(screen.getByText('None'));

    // Assert options
    const menuList = screen.getByTestId('console-select-menu-list');
    const options = within(menuList).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'None',
      'Image Stream Tag',
      'External container image',
    ]);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should show a subform when user selects image stream tag', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    await user.click(screen.getByText('Please select'));
    await user.click(screen.getByText('Image Stream Tag'));

    expect(screen.getByText('Project')).toBeVisible();
    expect(screen.getByText('Image Stream')).toBeVisible();
    expect(screen.getByText('Tag')).toBeVisible();

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should show a subform when user selects image stream image', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    await user.click(screen.getByText('Please select'));
    await user.click(screen.getByText('Image Stream Image'));

    expect(screen.getAllByRole('textbox')).toHaveLength(1);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should show a subform when user selects dockerfile', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    await user.click(screen.getByText('Please select'));
    await user.click(screen.getByText('External container image'));

    expect(screen.getAllByRole('textbox')).toHaveLength(1);

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should submit right form data when user fills out an image stream tag', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    await user.click(screen.getByText('Please select'));
    await user.click(screen.getByText('Image Stream Tag'));

    // Fill form
    await user.click(screen.getByText('Select Project'));
    await user.click(screen.getByText('project-a'));
    await user.click(screen.getByText('Select Image Stream'));
    await user.click(screen.getByText('imagestream-a'));
    await user.click(screen.getByText('Select tag'));
    await user.click(screen.getByText('latest'));

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
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
  }, 30000); // userEvent.type is slow

  it('should submit right form data when user fills out an image stream image', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    // Fill form
    await user.click(screen.getByText('Please select'));
    await user.click(screen.getByText('Image Stream Image'));
    await user.type(screen.getByRole('textbox'), 'my-namespace/an-image');

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
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
  }, 30000); // userEvent.type is slow

  it('should submit right form data when user fills out an dockerfile', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={emptyInitialValues} onSubmit={onSubmit}>
        <ImagesSection />
      </Wrapper>,
    );

    // Fill form
    await user.click(screen.getByText('Please select'));
    await user.click(screen.getByText('External container image'));
    await user.type(screen.getByRole('textbox'), 'centos');

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
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
  }, 30000); // userEvent.type is slow
});
