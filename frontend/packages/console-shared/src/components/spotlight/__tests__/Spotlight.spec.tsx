import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import InteractiveSpotlight from '../InteractiveSpotlight';
import Spotlight from '../Spotlight';
import StaticSpotlight from '../StaticSpotlight';

// Mock StaticSpotlight
jest.mock('../StaticSpotlight', () => ({
  default: jest.fn(() => null),
}));

// Mock InteractiveSpotlight
jest.mock('../InteractiveSpotlight', () => ({
  default: jest.fn(() => null),
}));

const mockStaticSpotlight = StaticSpotlight as jest.Mock;
const mockInteractiveSpotlight = InteractiveSpotlight as jest.Mock;

describe('Spotlight', () => {
  const mockProps = {
    selector: 'test-selector',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render null when element is not found', () => {
    jest.spyOn(document, 'querySelector').mockReturnValue(null);
    const { container } = renderWithProviders(<Spotlight {...mockProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render StaticSpotlight when interactive is false', () => {
    const mockElement = document.createElement('div');
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

    renderWithProviders(<Spotlight {...mockProps} interactive={false} />);

    expect(mockStaticSpotlight).toHaveBeenCalledTimes(1);
    expect(mockStaticSpotlight.mock.calls[0][0]).toMatchObject({ element: mockElement });
    expect(mockInteractiveSpotlight).not.toHaveBeenCalled();
  });

  it('should render InteractiveSpotlight when interactive is true', () => {
    const mockElement = document.createElement('div');
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

    renderWithProviders(<Spotlight {...mockProps} interactive />);

    expect(mockInteractiveSpotlight).toHaveBeenCalledTimes(1);
    expect(mockInteractiveSpotlight.mock.calls[0][0]).toMatchObject({ element: mockElement });
    expect(mockStaticSpotlight).not.toHaveBeenCalled();
  });

  it('should render StaticSpotlight by default', () => {
    const mockElement = document.createElement('div');
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

    renderWithProviders(<Spotlight {...mockProps} />);

    expect(mockStaticSpotlight).toHaveBeenCalledTimes(1);
    expect(mockStaticSpotlight.mock.calls[0][0]).toMatchObject({ element: mockElement });
    expect(mockInteractiveSpotlight).not.toHaveBeenCalled();
  });

  it('should render StaticSpotlight but not InteractiveSpotlight when element is hidden', () => {
    const mockElement = document.createElement('div');
    mockElement.setAttribute('aria-hidden', 'true');
    jest.spyOn(document, 'querySelector').mockReturnValue(mockElement);

    // StaticSpotlight should render
    renderWithProviders(<Spotlight {...mockProps} />);
    expect(mockStaticSpotlight).toHaveBeenCalled();

    jest.clearAllMocks();

    // InteractiveSpotlight should NOT render
    renderWithProviders(<Spotlight {...mockProps} interactive />);
    expect(mockInteractiveSpotlight).not.toHaveBeenCalled();
  });

  it('should not render InteractiveSpotlight when ancestor is hidden', () => {
    const childEl = document.createElement('a');
    const parentEl = document.createElement('a');
    const ancestorEl = document.createElement('a');
    ancestorEl.setAttribute('aria-hidden', 'true');
    parentEl.appendChild(childEl);
    ancestorEl.appendChild(parentEl);
    jest.spyOn(document, 'querySelector').mockReturnValue(childEl);

    renderWithProviders(<Spotlight {...mockProps} interactive />);
    expect(mockInteractiveSpotlight).not.toHaveBeenCalled();
  });
});
