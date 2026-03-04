import type { FC, ReactNode } from 'react';
import { render, waitFor } from '@testing-library/react';
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

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    renderResult.getByTestId('section hooks');
    renderResult.getByText('Run build hooks after image is built');

    const [checkbox] = renderResult.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkbox.checked).toBeFalsy();

    // Exeept that the other input elements are not shown.
    expect(renderResult.queryByTestId('type')).toBeFalsy();
    expect(renderResult.queryByTestId('Add command')).toBeFalsy();
    expect(renderResult.queryByTestId('Add argument')).toBeFalsy();

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

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    renderResult.getByTestId('section hooks');
    renderResult.getByText('Run build hooks after image is built');

    const [checkbox] = renderResult.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkbox.checked).toBeFalsy();

    await user.click(checkbox);

    await waitFor(() => {
      expect(checkbox.checked).toBeTruthy();
      expect(renderResult.getByTestId('type').textContent).toEqual('Command');
      expect(renderResult.queryAllByPlaceholderText('Command')).toHaveLength(1);
      renderResult.getByText('Add command');
      expect(renderResult.queryAllByPlaceholderText('Argument')).toHaveLength(0);
      renderResult.getByText('Add argument');
    });

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

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    renderResult.getByTestId('section hooks');
    renderResult.getByText('Run build hooks after image is built');

    const [checkbox] = renderResult.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkbox.checked).toBeTruthy();

    await waitFor(() => {
      expect(checkbox.checked).toBeTruthy();
      expect(renderResult.getByTestId('type').textContent).toEqual('Command');
      expect(renderResult.queryAllByPlaceholderText('Command')).toHaveLength(2);
      renderResult.getByDisplayValue('command 1');
      renderResult.getByDisplayValue('command 2');
      renderResult.getByText('Add command');
      renderResult.getByDisplayValue('command 1');
      expect(renderResult.queryAllByPlaceholderText('Argument')).toHaveLength(2);
      renderResult.getByDisplayValue('argument 1');
      renderResult.getByDisplayValue('argument 2');
      renderResult.getByText('Add argument');
    });
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

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    expect(renderResult.getByTestId('type').textContent).toEqual('Command');
    expect(renderResult.queryAllByPlaceholderText('Command')).toHaveLength(2);
    expect(renderResult.queryAllByPlaceholderText('Argument')).toHaveLength(2);

    await user.click(renderResult.getByTestId('type'));
    await user.click(renderResult.getByText('Shell script'));

    await waitFor(() => {
      expect(renderResult.baseElement.querySelector('textarea')).toBeTruthy();
      expect(renderResult.queryAllByPlaceholderText('Command')).toHaveLength(0);
      expect(renderResult.queryAllByPlaceholderText('Argument')).toHaveLength(2);
    });
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

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    expect(renderResult.getByTestId('type').textContent).toEqual('Command');
    expect(renderResult.queryAllByPlaceholderText('Command')).toHaveLength(2);
    expect(renderResult.queryAllByPlaceholderText('Argument')).toHaveLength(2);

    await user.click(renderResult.getByTestId('type'));
    await user.click(renderResult.getByText('Arguments to default image entry point'));

    await waitFor(() => {
      expect(renderResult.baseElement.querySelector('textarea')).toBeFalsy();
      expect(renderResult.queryAllByPlaceholderText('Command')).toHaveLength(0);
      expect(renderResult.queryAllByPlaceholderText('Argument')).toHaveLength(2);
    });
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

    const renderResult = render(
      <Wrapper initialValues={initialValues} onSubmit={onSubmit}>
        <HooksSection />
      </Wrapper>,
    );

    const [checkbox] = renderResult.getAllByRole('checkbox') as HTMLInputElement[];
    await user.click(checkbox);

    // Wait for subform
    await waitFor(() => {
      expect(checkbox.checked).toBeTruthy();
      expect(renderResult.getByTestId('type').textContent).toEqual('Command');
      expect(renderResult.queryAllByPlaceholderText('Command')).toHaveLength(1);
      renderResult.getByText('Add command');
      expect(renderResult.queryAllByPlaceholderText('Argument')).toHaveLength(0);
      renderResult.getByText('Add argument');
    });

    // Fill out subform
    const [command1] = renderResult.getAllByPlaceholderText('Command');
    await user.type(command1, 'echo');
    await user.click(renderResult.getByText('Add argument'));
    await user.click(renderResult.getByText('Add argument'));
    const [argument1, argument2] = renderResult.getAllByPlaceholderText('Argument');
    await user.type(argument1, 'hello');
    await user.type(argument2, 'world');

    // Submit
    const submitButton = renderResult.getByRole('button', { name: 'Submit' });
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
