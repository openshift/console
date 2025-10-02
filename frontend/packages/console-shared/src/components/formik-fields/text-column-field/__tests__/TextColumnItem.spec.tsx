import { renderWithProviders } from '../../../../test-utils/unit-test-utils';
import TextColumnItem from '../TextColumnItem';
import TextColumnItemWithDnd from '../TextColumnItemWithDnd';

Element.prototype.scrollIntoView = jest.fn();

jest.mock('react-dnd', () => ({
  useDrag: jest.fn(() => [{}, jest.fn(), jest.fn()]),
  useDrop: jest.fn(() => [{ opacity: 1 }, jest.fn()]),
}));

jest.mock('@console/internal/components/utils/drag-drop-context', () => ({
  default: (component) => component,
}));

let mockTextColumnItemContentProps: any;

jest.mock('../TextColumnItemContent', () => ({
  default: jest.fn((props) => {
    mockTextColumnItemContentProps = props;
    return null;
  }),
}));

const mockArrayHelper = {
  push: jest.fn(),
  handlePush: jest.fn(),
  swap: jest.fn(),
  handleSwap: jest.fn(),
  move: jest.fn(),
  handleMove: jest.fn(),
  insert: jest.fn(),
  handleInsert: jest.fn(),
  unshift: jest.fn(),
  handleUnshift: jest.fn(),
  remove: jest.fn(),
  handleRemove: jest.fn(),
  pop: jest.fn(),
  handlePop: jest.fn(),
  replace: jest.fn(),
  handleReplace: jest.fn(),
};

const mockProps = {
  name: 'test',
  label: 'Test Label',
  idx: 0,
  rowValues: ['value1', 'value2'],
  arrayHelpers: mockArrayHelper,
};

describe('TextColumnItem', () => {
  beforeEach(() => {
    mockTextColumnItemContentProps = undefined;
  });

  it('should render TextColumnItemContent', () => {
    renderWithProviders(<TextColumnItem {...mockProps} />);
    expect(mockTextColumnItemContentProps).toBeDefined();
  });

  it('should pass correct props to TextColumnItemContent', () => {
    renderWithProviders(<TextColumnItem {...mockProps} />);
    expect(mockTextColumnItemContentProps.name).toBe('test');
    expect(mockTextColumnItemContentProps.idx).toBe(0);
    expect(mockTextColumnItemContentProps.rowValues).toEqual(['value1', 'value2']);
  });
});

describe('TextColumnItemWithDnd', () => {
  beforeEach(() => {
    mockTextColumnItemContentProps = undefined;
  });

  it('should render TextColumnItemContent with drag and drop', () => {
    renderWithProviders(<TextColumnItemWithDnd {...mockProps} />);
    expect(mockTextColumnItemContentProps).toBeDefined();
  });

  it('should pass correct props to TextColumnItemContent with drag functionality', () => {
    renderWithProviders(<TextColumnItemWithDnd {...mockProps} />);
    expect(mockTextColumnItemContentProps.name).toBe('test');
    expect(mockTextColumnItemContentProps.idx).toBe(0);
    expect(mockTextColumnItemContentProps.rowValues).toEqual(['value1', 'value2']);
  });
});
