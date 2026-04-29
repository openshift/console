import type { FC } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { Resources } from '../../import/import-types';
import MockForm from '../__mocks__/MockForm';
import ContainerField from '../ContainerField';
import ImagesSection from '../images/ImagesSection';

jest.mock('../ContainerField', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
}));

const MockContainerField: FC = () => <div>Container: foo</div>;
const mockedContainerField = jest.mocked(ContainerField);

const handleSubmit = jest.fn();

beforeAll(() => {
  mockedContainerField.mockImplementation(MockContainerField);
});

const renderImagesSection = (resourceType = Resources.OpenShift) =>
  render(
    <MockForm handleSubmit={handleSubmit}>
      {() => (
        <Provider store={store}>
          <ImagesSection resourceType={resourceType} />
        </Provider>
      )}
    </MockForm>,
  );

describe('ImagesSection', () => {
  it('should have image-stream-tag dropdowns or image-name text field based on fromImageStreamTagCheckbox value', async () => {
    renderImagesSection();
    const user = userEvent.setup();
    const fromImageStreamTagCheckbox = screen.getByRole('checkbox', {
      name: /deploy image from an image stream tag/i,
    });

    expect(screen.getByTestId('image-stream-tag')).toBeVisible();
    expect(screen.queryByTestId('image-name')).not.toBeInTheDocument();

    await user.click(fromImageStreamTagCheckbox);

    await waitFor(() => {
      expect(screen.getByTestId('image-name')).toBeVisible();
      expect(screen.queryByTestId('image-stream-tag')).not.toBeInTheDocument();
    });
  });

  it('should have the required trigger checkbox fields based on fromImageStreamTagCheckbox value', async () => {
    renderImagesSection();
    const user = userEvent.setup();
    const fromImageStreamTagCheckbox = screen.getByRole('checkbox', {
      name: /deploy image from an image stream tag/i,
    });

    expect(
      screen.getByRole('checkbox', {
        name: /auto deploy when new Image is available/i,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('checkbox', {
        name: /auto deploy when deployment configuration changes/i,
      }),
    ).toBeVisible();

    await user.click(fromImageStreamTagCheckbox);

    await waitFor(() => {
      expect(
        screen.queryByRole('checkbox', {
          name: /auto deploy when new Image is available/i,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('checkbox', {
          name: /auto deploy when deployment configuration changes/i,
        }),
      ).toBeVisible();
    });
  });

  it('should have the required trigger checkbox fields based on resourceType', async () => {
    const view = renderImagesSection();
    const user = userEvent.setup();
    view.rerender(
      <MockForm handleSubmit={handleSubmit}>
        {() => (
          <Provider store={store}>
            <ImagesSection resourceType={Resources.Kubernetes} />
          </Provider>
        )}
      </MockForm>,
    );

    const fromImageStreamTagCheckbox = screen.getByRole('checkbox', {
      name: /deploy image from an image stream tag/i,
    });

    expect(
      screen.getByRole('checkbox', {
        name: /auto deploy when new Image is available/i,
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('checkbox', {
        name: /auto deploy when deployment configuration changes/i,
      }),
    ).not.toBeInTheDocument();

    await user.click(fromImageStreamTagCheckbox);

    await waitFor(() => {
      expect(
        screen.queryByRole('checkbox', {
          name: /auto deploy when new Image is available/i,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('checkbox', {
          name: /auto deploy when deployment configuration changes/i,
        }),
      ).not.toBeInTheDocument();
    });
  });

  it('should have the advanced options expand/collapse button', async () => {
    renderImagesSection();
    const user = userEvent.setup();
    const showAdvancedOptions = screen.getByRole('button', {
      name: /show advanced image options/i,
    });

    expect(
      screen.getByRole('button', {
        name: /show advanced image options/i,
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', {
        name: /hide advanced image options/i,
      }),
    ).not.toBeInTheDocument();

    await user.click(showAdvancedOptions);

    await waitFor(() => {
      expect(
        screen.queryByRole('button', {
          name: /show advanced image options/i,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', {
          name: /hide advanced image options/i,
        }),
      ).toBeVisible();
    });
  });
});
