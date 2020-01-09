import { Map } from 'immutable';

enum commonTemplatesValidationRules {
  integer = 'integer',
  string = 'string',
  regex = 'regex',
  enum = 'enum',
}

export type CommonTemplatesValidation = {
  name: string; // Identifier of the rule. Must be unique among all the rules attached to a template
  rule: commonTemplatesValidationRules; // Validation rule name
  path: string; // jsonpath of the field whose value is going to be evaluated.
  message: string; // User-friendly string message describing the failure, should the rule not be satisfied
  min?: number; // For 'integer' rule
  max?: number; // For 'integer' rule
  minLength?: number; // For 'string' rule
  maxLength?: number; // For 'string' rule
  regex?: string; // For 'regex' rule
  values?: string[]; // For 'enum' rule
  justWarning?: boolean;
};

export type ILabels = Map<string, string>;
export type ITemplate = Map<string, any>;
