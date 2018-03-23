import * as _ from 'lodash-es';

export const TEMPLATES = {};

export const registerTemplate = (kindString, template, templateName = 'default') => {
  if (!_.has(TEMPLATES, kindString)) {
    TEMPLATES[kindString] = {};
  }
  TEMPLATES[kindString][templateName] = template;
};

registerTemplate('DEFAULT', `apiVersion: ''
kind: ''
metadata:
  name: example
`);
