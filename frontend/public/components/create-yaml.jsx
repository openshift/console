import React from 'react';

import { register } from './react-wrapper';
import { SafetyFirst } from './safety-first';
import { EditYAML } from './edit-yaml';
import { connect } from './utils';

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

const toEmptyObj = (model, obj={}) => {
  _.each(model.properties, (prop, name) => {
    if (prop.readOnly) {
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
    const obj = objsToFollow.pop();
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

const stateToProps = ({k8s}) => ({
  models: k8s.get('MODELS'),
});

class CreateYAML_ extends SafetyFirst {
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps() {
    // const newVersion = _.get(nextProps, 'metadata.resourceVersion');
    // this.setState({stale: this.displayedVersion !== newVersion});
    // this.loadYaml();
  }

  render () {
    const {models, kind, apiVersion, isExtension} = this.props;
    if (!models) {
      return <div />;
    }
    const kindStr = `${apiVersion}.${kind}`;
    const model = modelFromSwagger(models, kindStr);
    const obj = toEmptyObj(model);
    if (!obj) {
      return <div />;
    }
    obj.kind = kind;
    obj.apiVersion = `${isExtension && 'extensions/'}${apiVersion}`;
    obj.metadata.namespace = this.props.namespace || 'default';
    return <div>
      <EditYAML {...obj} />
    </div>;
  }
}

export const CreateYAML = connect(stateToProps)(CreateYAML_);

register('CreateYAML', CreateYAML);
