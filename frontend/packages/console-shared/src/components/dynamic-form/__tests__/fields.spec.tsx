import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import type { JSONSchema7 } from 'json-schema';

// Mock heavy dependencies not needed for unit tests
jest.mock('@console/internal/components/modals/configure-update-strategy-modal', () => ({
  ConfigureUpdateStrategy: () => null,
}));
jest.mock(
  '@console/operator-lifecycle-manager/src/components/descriptors/spec/affinity',
  () => ({ NodeAffinity: () => null, PodAffinity: () => null }),
);
jest.mock(
  '@console/operator-lifecycle-manager/src/components/descriptors/spec/match-expressions',
  () => ({ MatchExpressions: () => null }),
);
jest.mock(
  '@console/operator-lifecycle-manager/src/components/descriptors/spec/resource-requirements',
  () => ({ ResourceRequirements: () => null }),
);
jest.mock('@console/internal/components/utils/selector-input', () => ({
  SelectorInput: () => null,
}));
jest.mock('@console/internal/components/utils/link', () => ({
  LinkifyExternal: ({ children }) => children,
}));

// Minimal ConsoleSelect mock that calls onChange when a new item is selected
jest.mock('@console/internal/components/utils/console-select', () => ({
  ConsoleSelect: ({ onChange, selectedKey, items, title, id }) => (
    <select
      data-testid={id}
      aria-label={title}
      value={selectedKey}
      onChange={(e) => onChange(e.target.value)}
    >
      {Object.keys(items).map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  ),
}));

// Minimal @rjsf/core SchemaField mock — renders each immediate property of an object schema
// as a simple labelled input so we can verify which sub-form is shown/hidden.
jest.mock('@rjsf/core/dist/cjs/components/fields/SchemaField', () => {
  const MockSchemaField = ({ schema, formData, onChange, name }) => {
    if (schema?.type === 'object' && schema?.properties) {
      return (
        <div data-testid={`schema-field-${name}`}>
          {Object.keys(schema.properties).map((propName) => (
            <input
              key={propName}
              data-testid={`input-${name}-${propName}`}
              aria-label={`${name}.${propName}`}
              defaultValue={formData?.[propName] ?? ''}
              onChange={(e) =>
                onChange({ ...(formData ?? {}), [propName]: e.target.value })
              }
            />
          ))}
        </div>
      );
    }
    return (
      <input
        data-testid={`schema-field-${name}`}
        aria-label={name}
        defaultValue={formData ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
  return MockSchemaField;
});

jest.mock('@rjsf/core/dist/cjs/utils', () => ({
  retrieveSchema: (schema) => schema,
  getUiOptions: () => ({}),
  getSchemaType: (schema) => schema?.type,
}));

// Import the default export (fields map) AFTER mocks are set up
// eslint-disable-next-line import/first
import fields from '../fields';

const { SchemaField: CustomSchemaField } = fields;

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

const MULTI_PROVIDER_SCHEMA: JSONSchema7 = {
  type: 'object',
  maxProperties: 1,
  properties: {
    azurekv: {
      type: 'object',
      properties: {
        vaultUrl: { type: 'string' },
        tenantId: { type: 'string' },
      },
    },
    vault: {
      type: 'object',
      properties: {
        server: { type: 'string' },
        path: { type: 'string' },
      },
    },
    gcpsm: {
      type: 'object',
      properties: {
        projectID: { type: 'string' },
      },
    },
  },
};

const makeProps = (schema: JSONSchema7, formData: any = {}, onChange = jest.fn()) => ({
  schema,
  formData,
  onChange,
  idSchema: { $id: 'root_spec_provider' },
  uiSchema: {},
  name: 'provider',
  required: false,
  registry: {
    rootSchema: schema,
    definitions: {},
    fields: {},
    widgets: {},
    formContext: {},
  },
  errorSchema: {},
  rawErrors: [],
  disabled: false,
  readonly: false,
  autofocus: false,
});

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------

describe('SinglePropertyObjectField (via CustomSchemaField)', () => {
  it('renders a provider dropdown with all property names as options', () => {
    render(<CustomSchemaField {...makeProps(MULTI_PROVIDER_SCHEMA)} />);

    const select = screen.getByTestId('root_spec_provider_key') as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    expect(optionValues).toEqual(expect.arrayContaining(['azurekv', 'vault', 'gcpsm']));
  });

  it('defaults to the first key when formData is empty', () => {
    render(<CustomSchemaField {...makeProps(MULTI_PROVIDER_SCHEMA, {})} />);

    const select = screen.getByTestId('root_spec_provider_key') as HTMLSelectElement;
    expect(select.value).toBe('azurekv');
  });

  it('initialises with the key already present in formData', () => {
    render(
      <CustomSchemaField
        {...makeProps(MULTI_PROVIDER_SCHEMA, { vault: { server: 'https://vault.example.com' } })}
      />,
    );

    const select = screen.getByTestId('root_spec_provider_key') as HTMLSelectElement;
    expect(select.value).toBe('vault');
  });

  it('shows sub-form fields only for the selected provider', () => {
    render(<CustomSchemaField {...makeProps(MULTI_PROVIDER_SCHEMA, {})} />);

    // azurekv sub-form fields should be visible
    expect(screen.getByTestId('schema-field-azurekv')).toBeInTheDocument();
    // vault and gcpsm sub-forms should NOT be rendered
    expect(screen.queryByTestId('schema-field-vault')).toBeNull();
    expect(screen.queryByTestId('schema-field-gcpsm')).toBeNull();
  });

  it('calls onChange with only the new key when the provider selection changes', () => {
    const onChange = jest.fn();
    render(<CustomSchemaField {...makeProps(MULTI_PROVIDER_SCHEMA, {}, onChange)} />);

    const select = screen.getByTestId('root_spec_provider_key');
    fireEvent.change(select, { target: { value: 'vault' } });

    // onChange must have been called with only the vault key
    expect(onChange).toHaveBeenCalledWith({ vault: {} });
    // It must NOT include azurekv or gcpsm
    const [calledWith] = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(Object.keys(calledWith)).toEqual(['vault']);
  });

  it('switches the visible sub-form when a different provider is selected', () => {
    render(<CustomSchemaField {...makeProps(MULTI_PROVIDER_SCHEMA, {})} />);

    const select = screen.getByTestId('root_spec_provider_key');
    fireEvent.change(select, { target: { value: 'gcpsm' } });

    expect(screen.getByTestId('schema-field-gcpsm')).toBeInTheDocument();
    expect(screen.queryByTestId('schema-field-azurekv')).toBeNull();
    expect(screen.queryByTestId('schema-field-vault')).toBeNull();
  });

  it('calls onChange with only the selected key when a sub-form field changes', () => {
    const onChange = jest.fn();
    render(
      <CustomSchemaField
        {...makeProps(MULTI_PROVIDER_SCHEMA, { azurekv: { vaultUrl: 'https://my-vault.vault.azure.net' } }, onChange)}
      />,
    );

    const vaultUrlInput = screen.getByTestId('input-azurekv-vaultUrl');
    fireEvent.change(vaultUrlInput, { target: { value: 'https://updated.vault.azure.net' } });

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(Object.keys(lastCall)).toEqual(['azurekv']);
    expect(lastCall.azurekv.vaultUrl).toBe('https://updated.vault.azure.net');
  });

  it('does not render SinglePropertyObjectField for a normal object schema without maxProperties: 1', () => {
    const normalSchema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'string' },
      },
    };
    render(<CustomSchemaField {...makeProps(normalSchema, {})} />);

    // The provider dropdown must NOT be rendered for ordinary objects
    expect(screen.queryByTestId('root_spec_provider_key')).toBeNull();
  });

  it('calls onChange on mount to strip stale provider keys when formData has multiple providers', () => {
    const onChange = jest.fn();
    render(
      <CustomSchemaField
        {...makeProps(
          MULTI_PROVIDER_SCHEMA,
          {
            azurekv: { vaultUrl: 'https://my-vault.vault.azure.net', tenantId: 'tenant-1' },
            vault: { server: 'https://vault.example.com', path: 'secret' },
            gcpsm: { projectID: 'my-project' },
          },
          onChange,
        )}
      />,
    );

    // On mount, onChange must be called to normalize to a single key (the first one found)
    expect(onChange).toHaveBeenCalled();
    const normalizedPayload = onChange.mock.calls[0][0];
    expect(Object.keys(normalizedPayload)).toHaveLength(1);
    // The key kept should be azurekv (first key present in formData)
    expect(Object.keys(normalizedPayload)[0]).toBe('azurekv');
  });
});
