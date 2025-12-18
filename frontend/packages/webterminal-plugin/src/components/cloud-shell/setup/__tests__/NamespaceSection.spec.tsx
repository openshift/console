import { render, screen } from '@testing-library/react';
import { useFormikContext, useField } from 'formik';
import { FLAGS } from '@console/shared';
import { CREATE_NAMESPACE_KEY } from '../cloud-shell-setup-utils';
import { InternalNamespaceSection } from '../NamespaceSection';

jest.mock('formik', () => {
  const context = {
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
  };
  return {
    useField: jest.fn(() => [{ value: '' }, {}]),
    useFormikContext: jest.fn(() => context),
    getFieldId: jest.fn(),
  };
});

const mockCallbacks = {
  onChange: null as ((val: string) => void) | null,
  onLoad: null as ((data: any) => void) | null,
  actionItems: null as { actionKey: string }[] | undefined | null,
};

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  InputField: ({ name }: { name: string }) => `InputField ${name}`,
  ResourceDropdownField: ({
    onChange,
    onLoad,
    actionItems,
    name,
  }: {
    onChange: (val: string) => void;
    onLoad: (data: any) => void;
    actionItems?: { actionKey: string }[];
    name: string;
  }) => {
    mockCallbacks.onChange = onChange;
    mockCallbacks.onLoad = onLoad;
    mockCallbacks.actionItems = actionItems;
    return `ResourceDropdownField ${name}`;
  },
  useFormikValidationFix: jest.fn(),
}));

const canCreateFlags = { [FLAGS.CAN_CREATE_PROJECT]: true };
const noFlags = {};

describe('NamespaceSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCallbacks.onChange = null;
    mockCallbacks.onLoad = null;
    mockCallbacks.actionItems = null;
  });

  it('should display InputField when creating namespace', () => {
    (useField as jest.Mock).mockImplementationOnce(() => [{ value: CREATE_NAMESPACE_KEY }, {}]);
    render(<InternalNamespaceSection flags={canCreateFlags} />);

    expect(screen.getByText('InputField newNamespace')).toBeVisible();
  });

  it('should switch to create namespace mode when there are no projects', () => {
    render(<InternalNamespaceSection flags={canCreateFlags} />);

    // Trigger onLoad with empty project list
    mockCallbacks.onLoad?.({});

    expect(useFormikContext().setFieldValue).toHaveBeenCalledWith(
      'namespace',
      CREATE_NAMESPACE_KEY,
    );
  });

  it('should switch from active namespace to no namespace when no projects and user cannot create a project', () => {
    (useField as jest.Mock).mockReturnValueOnce([{ value: 'test-namespace' }, {}]);

    render(<InternalNamespaceSection flags={noFlags} />);

    // Trigger onLoad with empty project list
    mockCallbacks.onLoad?.({});

    expect(useFormikContext().setFieldValue).toHaveBeenCalledWith('namespace', undefined);
  });

  it('should update namespace value when dropdown changes', () => {
    render(<InternalNamespaceSection flags={canCreateFlags} />);

    // Trigger onChange
    mockCallbacks.onChange?.('test');

    expect(useFormikContext().setFieldValue).toHaveBeenCalledWith('namespace', 'test');
  });

  it('should include create project action when user can create a project', () => {
    render(<InternalNamespaceSection flags={canCreateFlags} />);

    expect(mockCallbacks.actionItems).toBeDefined();
    expect(mockCallbacks.actionItems?.[0]?.actionKey).toBe(CREATE_NAMESPACE_KEY);
  });

  it('should omit create project action when user cannot create a project', () => {
    render(<InternalNamespaceSection flags={noFlags} />);

    expect(mockCallbacks.actionItems).toBeUndefined();
  });
});
