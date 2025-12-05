import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { mockFormikRenderer } from '../../../test-utils/unit-test-utils';
import DropdownField from '../DropdownField';

jest.mock('@console/internal/components/utils/console-select', () => ({
  ConsoleSelect: jest.fn(() => null),
}));

jest.mock('../../../hooks', () => ({
  useFormikValidationFix: jest.fn(),
}));

describe('DropdownField', () => {
  it('should pass the autocompleteFilter function to the ConsoleSelect component', () => {
    const mockFilterFn = jest.fn();

    mockFormikRenderer(<DropdownField name="test" items={{}} autocompleteFilter={mockFilterFn} />, {
      test: '',
    });

    expect(ConsoleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        autocompleteFilter: mockFilterFn,
      }),
      {},
    );
  });
});
