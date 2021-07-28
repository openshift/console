import * as React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  RenderResult,
  waitFor,
  configure,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { Resources } from '../../import/import-types';
import MockForm from '../__mocks__/MockForm';
import ContainerField from '../ContainerField';
import ImagesSection from '../images/ImagesSection';

configure({ testIdAttribute: 'data-test' });

jest.mock('../ContainerField', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
}));

const MockContainerField: React.FC = () => <div>Container: foo</div>;
const mockedContainerField = ContainerField as jest.Mock<React.FC>;

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
    const fromImageStreamTagCheckbox = screen.getByRole('checkbox', {
      name: /deploy image from an image stream tag/i,
    });

    expect(screen.queryByTestId('image-stream-tag')).not.toBeNull();
    expect(screen.queryByTestId('image-name')).toBeNull();

    fireEvent.click(fromImageStreamTagCheckbox);

    await waitFor(() => {
      expect(screen.queryByTestId('image-name')).not.toBeNull();
      expect(screen.queryByTestId('image-stream-tag')).toBeNull();
    });
  });

  it('should have the required trigger checkbox fields based on fromImageStreamTagCheckbox value', async () => {
    const fromImageStreamTagCheckbox = screen.getByRole('checkbox', {
      name: /deploy image from an image stream tag/i,
    });

    expect(
      screen.queryByRole('checkbox', {
        name: /auto deploy when new Image is available/i,
      }),
    ).not.toBeNull();
    expect(
      screen.queryByRole('checkbox', {
        name: /auto deploy when deployment configuration changes/i,
      }),
    ).not.toBeNull();

    fireEvent.click(fromImageStreamTagCheckbox);

    await waitFor(() => {
      expect(
        screen.queryByRole('checkbox', {
          name: /auto deploy when new Image is available/i,
        }),
      ).toBeNull();
      expect(
        screen.queryByRole('checkbox', {
          name: /auto deploy when deployment configuration changes/i,
        }),
      ).not.toBeNull();
    });
  });

  it('should have the required trigger checkbox fields based on resourceType', async () => {
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
    ).not.toBeNull();
    expect(
      screen.queryByRole('checkbox', {
        name: /auto deploy when deployment configuration changes/i,
      }),
    ).toBeNull();

    fireEvent.click(fromImageStreamTagCheckbox);

    await waitFor(() => {
      expect(
        screen.queryByRole('checkbox', {
          name: /auto deploy when new Image is available/i,
        }),
      ).toBeNull();
      expect(
        screen.queryByRole('checkbox', {
          name: /auto deploy when deployment configuration changes/i,
        }),
      ).toBeNull();
    });
  });

  it('should have the advanced options expand/collapse button', async () => {
    const showAdvancedOptions = screen.getByRole('button', {
      name: /show advanced image options/i,
    });

    expect(
      screen.queryByRole('button', {
        name: /show advanced image options/i,
      }),
    ).not.toBeNull();
    expect(
      screen.queryByRole('button', {
        name: /hide advanced image options/i,
      }),
    ).toBeNull();

    fireEvent.click(showAdvancedOptions);

    await waitFor(() => {
      expect(
        screen.queryByRole('button', {
          name: /show advanced image options/i,
        }),
      ).toBeNull();
      expect(
        screen.queryByRole('button', {
          name: /hide advanced image options/i,
        }),
      ).not.toBeNull();
    });
  });
});
