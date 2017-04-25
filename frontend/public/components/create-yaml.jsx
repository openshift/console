import React from 'react';
import {connect} from 'react-redux';

import { safeLoad } from 'js-yaml';
import { k8s } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { EditYAML } from './edit-yaml';
import { TEMPLATES } from '../yaml-templates';

const getDefaultType = (type, format) => {
  switch (type) {
    case 'string':
      if (format === 'datetime') {
        return new Date().toISOString();
      }
      return '';
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    case 'object':
      return {};
    case 'array':
      return [];
    default:
      throw new Error(`unknown type: ${type}`);
  }
};

const blacklist = [
  'clusterName',
  'finalizers',
  'generateName',
  'ownerReferences',
  'status',
];

const toEmptyObj = (model, obj={}) => {
  if (!model.properties) {
    return getDefaultType(model.type, model.format);
  }
  _.each(model.properties, (prop, name) => {
    if (prop.readOnly) {
      return;
    }
    if (_.includes(blacklist, name)) {
      return;
    }
    if (model.required && !model.required.includes(name)) {
      return;
    }
    if (prop.type) {
      obj[name] = getDefaultType(prop.type, prop.format);
      if (prop.items) {
        obj[name].push(toEmptyObj(prop.items));
      }
      return;
    }
    obj[name] = toEmptyObj(prop);
  });
  return obj;
};

const modelFromSwagger = (models, model) => {
  const objsToFollow = [models[model]];
  while (objsToFollow.length) {
    let obj = objsToFollow.pop();
    _.each(obj.properties, (prop, name) => {
      _.each(prop, (v, k) => {
        if (k === '$ref') {
          const ref = v;
          obj.properties[name] = _.extend(_.clone(models[ref]), {
            description: prop.description,
            readOnly: _.includes(prop.description, 'Read-only'),
          });
          objsToFollow.push(obj.properties[name]);
        } else if (k === 'items' && v['$ref']) {
          const ref = v['$ref'];
          prop[k] = _.extend(_.clone(models[ref]), {
            description: prop.description,
            readOnly: _.includes(v.description, 'Read-only'),
          });
          objsToFollow.push(prop[k]);
        }
      });
      if (_.isUndefined(prop.readOnly)) {
        prop.readOnly = _.includes(prop.description, 'Read-only');
      }
    });
  }
  return models[model];
};

const prune = obj => {
  _.each(obj, (v, k) => {
    if (!_.isObjectLike(v)) {
      // Arrays & objects are object-like. Strings, numbers, & bools aren't
      return;
    }
    obj[k] = prune(v);
    if (!_.isEmpty(obj[k])) {
      return;
    }
    if (_.isArray(obj)) {
      obj.splice(k, 1);
    } else {
      delete obj[k];
    }
  });
  return obj;
};

const stateToProps = ({k8s}) => ({
  models: k8s.get('MODELS'),
});

class CreateYAML_ extends SafetyFirst {
  constructor(props) {
    super(props);
  }

  render () {
    const {models, params} = this.props;

    const kind = k8s[params.kind] && k8s[params.kind].kind;
    if (!kind) {
      // <base href=...> makes this OK
      window.location = '404';
    }

    const apiVersion = kind.apiVersion || 'v1';
    const namespace = params.ns || 'default';
    const kindStr = `${apiVersion}.${kind.kind}`;
    const template = TEMPLATES[kindStr];
    let obj;
    if (template) {
      obj = safeLoad(template);
    } else {
      const model = modelFromSwagger(models, kindStr);
      obj = prune(toEmptyObj(model));
      if (!obj) {
        return null;
      }
    }

    obj.kind = kind.kind;
    // The code below strips the basePath (etcd.coreos.com, etc.) from the apiVersion that is being set in the template
    // and causes creation to fail for some resource kinds, hence adding a check here to skip for those kinds.
    if (!['Cluster', 'Role', 'RoleBinding'].includes(obj.kind)) {
      obj.apiVersion = `${kind.isExtension ? 'extensions/' : ''}${apiVersion}`;
    }
    obj.metadata = obj.metadata || {};
    obj.metadata.namespace = namespace;

    return <EditYAML obj={obj} create={true} />;
  }
}

export const CreateYAML = connect(stateToProps)(CreateYAML_);
