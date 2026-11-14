import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, verifyInputField } from '../../../test-utils/unit-test-utils';
import { DynamicForm } from '../DynamicForm';

const renderForm = (props: ComponentProps<typeof DynamicForm>) => {
  const ControlledForm = () => {
    const [formData, setFormData] = useState<unknown>(props.formData ?? {});
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
  afterEach(() => {
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
        tags: { type: 'array', title: 'Tags', items: { type: 'string' } },
      },
    };
    renderForm({ schema, formData: { tags: ['first'] } });

    await user.click(screen.getByRole('button', { name: 'Tags' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Add Tags' }));
    expect(screen.getAllByRole('textbox')).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'Remove Tags' })[0]);
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

  it('renders a custom resource widget alongside the metadata name field', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        metadata: {
          type: 'object',
          properties: { name: { type: 'string', title: 'Name' } },
        },
        resource: { type: 'string', title: 'Resource' },
      },
    };
    renderForm({
      schema,
      formContext: { namespace: 'test-project' },
      uiSchema: {
        resource: {
          'ui:widget': 'K8sResourceWidget',
          'ui:options': { groupVersionKind: 'v1~ConfigMap', selector: 'app=example' },
        },
      },
    });

    expect(screen.getByLabelText('Name')).toHaveAttribute('id', 'root_metadata_name');
    expect(screen.getByText('Cluster does not have resource v1~ConfigMap')).toBeVisible();
    expect(
      screen.queryByText(
        'There is an issue in this form view. Select "YAML view" for full control.',
      ),
    ).not.toBeInTheDocument();
  });
});
