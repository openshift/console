import type { FC } from 'react';
import type { RenderResult } from '@testing-library/react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

let renderResults: RenderResult = null;

beforeAll(() => {
  mockedContainerField.mockImplementation(MockContainerField);
});

beforeEach(() => {
  renderResults = render(
    <MockForm handleSubmit={handleSubmit}>
      {() => (
        <Provider store={store}>
          <ImagesSection resourceType={Resources.OpenShift} />
        </Provider>
      )}
    </MockForm>,
  );
});

afterEach(() => cleanup());

describe('ImagesSection', () => {
  it('should have image-stream-tag dropdowns or image-name text field based on fromImageStreamTagCheckbox value', async () => {
    const user = userEvent.setup();
    const fromImageStreamTagCheckbox = screen.getByRole('checkbox', {
      name: /deploy image from an image stream tag/i,
    });

    expect(screen.queryByTestId('image-stream-tag')).toBeInTheDocument();
    expect(screen.queryByTestId('image-name')).not.toBeInTheDocument();

    await user.click(fromImageStreamTagCheckbox);

    await waitFor(() => {
      expect(screen.queryByTestId('image-name')).toBeInTheDocument();
      expect(screen.queryByTestId('image-stream-tag')).not.toBeInTheDocument();
    });
  });

  it('should have the required trigger checkbox fields based on fromImageStreamTagCheckbox value', async () => {
    const user = userEvent.setup();
    const fromImageStreamTagCheckbox = screen.getByRole('checkbox', {
      name: /deploy image from an image stream tag/i,
    });

    expect(
      screen.queryByRole('checkbox', {
        name: /auto deploy when new Image is available/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', {
        name: /auto deploy when deployment configuration changes/i,
      }),
    ).toBeInTheDocument();

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
      ).toBeInTheDocument();
    });
  });

  it('should have the required trigger checkbox fields based on resourceType', async () => {
    const user = userEvent.setup();
    renderResults.rerender(
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
      screen.queryByRole('checkbox', {
        name: /auto deploy when new Image is available/i,
      }),
    ).toBeInTheDocument();
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
    const user = userEvent.setup();
    const showAdvancedOptions = screen.getByRole('button', {
      name: /show advanced image options/i,
    });

    expect(
      screen.queryByRole('button', {
        name: /show advanced image options/i,
      }),
    ).toBeInTheDocument();
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
        screen.queryByRole('button', {
          name: /hide advanced image options/i,
        }),
      ).toBeInTheDocument();
    });
  });
});
