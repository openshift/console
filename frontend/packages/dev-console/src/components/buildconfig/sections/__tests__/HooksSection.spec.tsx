import type { FC, ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormikConfig } from 'formik';
import { Formik } from 'formik';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import type { HooksSectionFormData } from '../HooksSection';
import HooksSection from '../HooksSection';

jest.mock('../EditorField', () =>
  jest.requireActual('@console/shared/src/components/formik-fields/TextAreaField'),
);

interface WrapperProps extends FormikConfig<HooksSectionFormData> {
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

describe('HooksSection', () => {
  it('should render form with minimal form data', () => {
    const initialValues: HooksSectionFormData = {
      formData: {
        hooks: {
          enabled: false,
          type: 'command',
          commands: [''],
          shell: '',
          arguments: [],
        },
      },
    };
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    expect(screen.getByTestId('section hooks')).toBeInTheDocument();
    expect(screen.getByText('Run build hooks after image is built')).toBeVisible();

    const [checkbox] = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkbox.checked).toBeFalsy();

    // Exeept that the other input elements are not shown.
    expect(screen.queryByTestId('type')).toBeFalsy();
    expect(screen.queryByTestId('Add command')).toBeFalsy();
    expect(screen.queryByTestId('Add argument')).toBeFalsy();

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render more fields when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const initialValues: HooksSectionFormData = {
      formData: {
        hooks: {
          enabled: false,
          type: 'command',
          commands: [''],
          shell: '',
          arguments: [],
        },
      },
    };
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    expect(screen.getByTestId('section hooks')).toBeInTheDocument();
    expect(screen.getByText('Run build hooks after image is built')).toBeVisible();

    const [checkbox] = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkbox.checked).toBeFalsy();

    await user.click(checkbox);

    expect(checkbox.checked).toBeTruthy();
    expect(screen.getByTestId('type').textContent).toEqual('Command');
    expect(screen.queryAllByPlaceholderText('Command')).toHaveLength(1);
    expect(screen.getByText('Add command')).toBeVisible();
    expect(screen.queryAllByPlaceholderText('Argument')).toHaveLength(0);
    expect(screen.getByText('Add argument')).toBeVisible();

    expect(onSubmit).toHaveBeenCalledTimes(0);
  });

  it('should render commands and arguments when hooks are enabled', async () => {
    const initialValues: HooksSectionFormData = {
      formData: {
        hooks: {
          enabled: true,
          type: 'command',
          commands: ['command 1', 'command 2'],
          shell: 'shell script',
          arguments: ['argument 1', 'argument 2'],
        },
      },
    };
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    expect(screen.getByTestId('section hooks')).toBeInTheDocument();
    expect(screen.getByText('Run build hooks after image is built')).toBeVisible();

    const [checkbox] = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkbox.checked).toBeTruthy();

    await waitFor(() => {
      expect(checkbox.checked).toBeTruthy();
    });
    expect(screen.getByTestId('type').textContent).toEqual('Command');
    expect(screen.queryAllByPlaceholderText('Command')).toHaveLength(2);
    expect(screen.getByDisplayValue('command 1')).toBeVisible();
    expect(screen.getByDisplayValue('command 2')).toBeVisible();
    expect(screen.getByText('Add command')).toBeVisible();
    expect(screen.getByDisplayValue('command 1')).toBeVisible();
    expect(screen.queryAllByPlaceholderText('Argument')).toHaveLength(2);
    expect(screen.getByDisplayValue('argument 1')).toBeVisible();
    expect(screen.getByDisplayValue('argument 2')).toBeVisible();
    expect(screen.getByText('Add argument')).toBeVisible();
  });

  it('should not render commands when hook type is changed to script', async () => {
    const user = userEvent.setup();
    const initialValues: HooksSectionFormData = {
      formData: {
        hooks: {
          enabled: true,
          type: 'command',
          commands: ['command 1', 'command 2'],
          shell: 'shell script',
          arguments: ['argument 1', 'argument 2'],
        },
      },
    };
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    expect(screen.getByTestId('type').textContent).toEqual('Command');
    expect(screen.queryAllByPlaceholderText('Command')).toHaveLength(2);
    expect(screen.queryAllByPlaceholderText('Argument')).toHaveLength(2);

    await user.click(screen.getByTestId('type'));
    await user.click(screen.getByText('Shell script'));

    await waitFor(() => {
      expect(screen.getByLabelText('Script')).toBeInTheDocument();
    });
    expect(screen.queryAllByPlaceholderText('Command')).toHaveLength(0);
    expect(screen.queryAllByPlaceholderText('Argument')).toHaveLength(2);
  });

  it('should not render commands when hook type is changed to argsOnly', async () => {
    const user = userEvent.setup();
    const initialValues: HooksSectionFormData = {
      formData: {
        hooks: {
          enabled: true,
          type: 'command',
          commands: ['command 1', 'command 2'],
          shell: 'shell script',
          arguments: ['argument 1', 'argument 2'],
        },
      },
    };
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    expect(screen.getByTestId('type').textContent).toEqual('Command');
    expect(screen.queryAllByPlaceholderText('Command')).toHaveLength(2);
    expect(screen.queryAllByPlaceholderText('Argument')).toHaveLength(2);

    await user.click(screen.getByTestId('type'));
    await user.click(screen.getByText('Arguments to default image entry point'));

    await waitFor(() => {
      expect(screen.queryByLabelText('Script')).not.toBeInTheDocument();
    });
    expect(screen.queryAllByPlaceholderText('Command')).toHaveLength(0);
    expect(screen.queryAllByPlaceholderText('Argument')).toHaveLength(2);
  });

  it('should update formik data', async () => {
    const user = userEvent.setup();
    const initialValues: HooksSectionFormData = {
      formData: {
        hooks: {
          enabled: false,
          type: 'command',
          commands: [''],
          shell: 'shell script',
          arguments: [],
        },
      },
    };
    const onSubmit = jest.fn();

    render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    const [checkbox] = screen.getAllByRole('checkbox') as HTMLInputElement[];
    await user.click(checkbox);

    // Wait for subform
    await waitFor(() => {
      expect(checkbox.checked).toBeTruthy();
    });
    expect(screen.getByTestId('type').textContent).toEqual('Command');
    expect(screen.queryAllByPlaceholderText('Command')).toHaveLength(1);
    expect(screen.getByText('Add command')).toBeVisible();
    expect(screen.queryAllByPlaceholderText('Argument')).toHaveLength(0);
    expect(screen.getByText('Add argument')).toBeVisible();

    // Fill out subform
    const [command1] = screen.getAllByPlaceholderText('Command');
    await user.type(command1, 'echo');
    await user.click(screen.getByText('Add argument'));
    await user.click(screen.getByText('Add argument'));
    const [argument1, argument2] = screen.getAllByPlaceholderText('Argument');
    await user.type(argument1, 'hello');
    await user.type(argument2, 'world');

    // Submit
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await user.click(submitButton);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const expectedFormData: HooksSectionFormData = {
      formData: {
        hooks: {
          enabled: true,
          type: 'command',
          commands: ['echo'],
          shell: 'shell script',
          arguments: ['hello', 'world'],
        },
      },
    };
    expect(onSubmit).toHaveBeenLastCalledWith(expectedFormData, expect.anything());
  }, 30000); // userEvent.type is slow
});
