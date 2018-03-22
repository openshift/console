import * as _ from 'lodash-es';

// React's "isRequired" means that not only must key exist, but the *value* must be truthy too! This doesn't fly with NSs
export const namespaceProptype = function (props: {namespace: string}, propName: string, componentName: string) {
  if (!props.hasOwnProperty('namespace')) {
    throw new Error(`${componentName}: "namespace" is a required prop`);
  }
  if (propName !== 'namespace') {
    return;
  }
  if (props.namespace !== undefined && !_.isString(props.namespace)) {
    throw new Error(`${componentName}: "namespace" must be a string`);
  }
};
