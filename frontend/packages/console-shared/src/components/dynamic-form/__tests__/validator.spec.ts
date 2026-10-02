import { deserialize, serialize } from 'v8';
import { createElement } from 'react';
import Form from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import { renderToString } from 'react-dom/server';
import { dynamicFormValidator } from '../validator';

const chartSchema: RJSFSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {
    mode: { type: 'string', enum: ['simple', 'scaled'] },
    replicas: { type: 'integer', minimum: 1 },
  },
  if: { properties: { mode: { const: 'scaled' } } },
  then: { required: ['replicas'] },
};

describe('dynamic form validator', () => {
  it('renders and validates a runtime Draft 7 schema without generating code', () => {
    const originalFunction = global.Function;
    const originalStructuredClone = global.structuredClone;
    let markup: string;
    let validErrors: ReturnType<typeof dynamicFormValidator.validateFormData>['errors'];
    let invalidErrors: ReturnType<typeof dynamicFormValidator.validateFormData>['errors'];

    try {
      // Jest's jsdom environment lacks the browser's structuredClone implementation.
      global.structuredClone = (value) => deserialize(serialize(value));
      global.Function = new Proxy(originalFunction, {
        apply: () => {
          throw new Error('Runtime code generation is blocked by CSP');
        },
        construct: () => {
          throw new Error('Runtime code generation is blocked by CSP');
        },
      });
      markup = renderToString(
        createElement(Form, {
          schema: chartSchema,
          formData: { mode: 'scaled' },
          liveValidate: true,
          validator: dynamicFormValidator,
        }),
      );
      validErrors = dynamicFormValidator.validateFormData(
        { mode: 'scaled', replicas: 2 },
        chartSchema,
      ).errors;
      invalidErrors = dynamicFormValidator.validateFormData({ mode: 'scaled' }, chartSchema).errors;
    } finally {
      global.Function = originalFunction;
      global.structuredClone = originalStructuredClone;
    }

    expect(markup).toContain('replicas');
    expect(validErrors).toHaveLength(0);
    expect(invalidErrors.length).toBeGreaterThan(0);
  });
});
