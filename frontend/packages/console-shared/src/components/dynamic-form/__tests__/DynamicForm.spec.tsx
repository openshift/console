import { deserialize, serialize } from 'v8';
import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, verifyInputField } from '../../../test-utils/unit-test-utils';
import { DynamicForm } from '../DynamicForm';

jest.mock('@console/dynamic-plugin-sdk/src/runtime/plugin-init', () => ({
  initConsolePlugins: jest.fn(),
}));

const renderForm = (props: ComponentProps<typeof DynamicForm>) => {
  const ControlledForm = () => {
    const [formData, setFormData] = useState(props.formData ?? {});
    return (
      <DynamicForm
        {...props}
        formData={formData}
        onChange={(next) => {
          setFormData(next);
          props.onChange?.(next);
        }}
        showAlert={false}
      />
    );
  };

  renderWithProviders(<ControlledForm />);
};

const nameSchema: RJSFSchema = {
  type: 'object',
  properties: { name: { type: 'string', title: 'Name' } },
  required: ['name'],
};

describe('DynamicForm', () => {
  const originalStructuredClone = global.structuredClone;

  beforeEach(() => {
    // Jest's jsdom environment lacks the browser's structuredClone implementation.
    global.structuredClone = (value) => deserialize(serialize(value));
  });

  afterEach(() => {
    global.structuredClone = originalStructuredClone;
    jest.restoreAllMocks();
  });

  it('submits edited form data', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    renderForm({ schema: nameSchema, onSubmit });

    await verifyInputField({ inputLabel: 'Name', testValue: 'example' });
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).toHaveBeenCalledWith({ formData: { name: 'example' } });
  });

  it('reports validation errors and does not submit invalid data', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const onError = jest.fn();
    renderForm({ schema: nameSchema, onSubmit, onError });

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(expect.arrayContaining([expect.stringContaining('Name')]));
  });

  it('adds and removes array items', async () => {
    const user = userEvent.setup();
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        tags: { type: 'array', title: 'Tags', items: { type: 'string', title: 'Tag' } },
      },
    };
    renderForm({ schema, formData: { tags: ['first'] } });

    await user.click(screen.getByRole('button', { name: 'Tags' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Add Tags' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'Remove Tag' })[0]);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('submits a selection from a custom dropdown field', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    const schema: RJSFSchema = {
      type: 'object',
      properties: { mode: { type: 'string', title: 'Mode' } },
    };
    renderForm({
      schema,
      onSubmit,
      uiSchema: {
        mode: {
          'ui:field': 'DropdownField',
          'ui:options': { items: { fast: 'Fast', safe: 'Safe' } },
        },
      },
    });

    await user.click(screen.getByRole('button', { name: 'Mode' }));
    await user.click(screen.getByRole('option', { name: 'Safe' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onSubmit).toHaveBeenCalledWith({ formData: { mode: 'safe' } });
  });

  it('shows a dependent field when its controlling value changes', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        spec: {
          type: 'object',
          properties: {
            mode: { type: 'string', title: 'Mode' },
            replicas: { type: 'string', title: 'Replicas' },
          },
        },
      },
    };
    renderForm({
      schema,
      formData: { spec: { mode: 'simple' } },
      uiSchema: {
        spec: {
          replicas: {
            'ui:options': {
              dependency: { controlFieldPath: ['mode'], controlFieldValue: 'scaled' },
            },
          },
        },
      },
    });

    expect(screen.queryByRole('textbox', { name: 'Replicas' })).not.toBeInTheDocument();

    await verifyInputField({ inputLabel: 'Mode', initialValue: 'simple', testValue: 'scaled' });

    expect(await screen.findByRole('textbox', { name: 'Replicas' })).toBeVisible();

    await verifyInputField({ inputLabel: 'Mode', initialValue: 'scaled', testValue: 'simple' });

    expect(screen.queryByRole('textbox', { name: 'Replicas' })).not.toBeInTheDocument();
  });
});
