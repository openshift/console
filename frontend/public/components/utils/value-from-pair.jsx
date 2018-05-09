import * as React from 'react';
import * as PropTypes from 'prop-types';

// https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.10/#envvarsource-v1-core
//   valueFrom:
//     fieldRef:
//       fieldPath: spec.nodeName

//   valueFrom:
//     secretKeyRef:
//       name: mysecret
//       key: username

//   valueFrom:
//     configMapKeyRef:
//       name: tectonic-config
//       key: consoleBaseAddress

//   valueFrom:
//     resourceFieldRef:
//       containerName: test-container
//       resource: requests.cpu
//       divisor: 1 // 1 is default

const FieldRef = ({data: {fieldPath}}) => <span>

  <input type="text" className="form-control value-from-pair" value="FieldRef" disabled />
  <input type="text" className="form-control value-from-pair" value={fieldPath} disabled />
</span>;

const SecretKeyRef = ({data: {name, key}}) => <span>
  <input type="text" className="form-control value-from-pair" value={`${name} - Secret`} disabled />
  <input type="text" className="form-control value-from-pair" value={key} disabled />
</span>;

const ConfigMapKeyRef = ({data: {name, key}}) => <span>
  <input type="text" className="form-control value-from-pair" value={`${name} - ConfigMap`} disabled />
  <input type="text" className="form-control value-from-pair" value={key} disabled />
</span>;

const ResourceFieldRef = ({data: {containerName, resource}}) => <span>
  <input type="text" className="form-control value-from-pair" value={`${containerName} - Resource Field`} disabled />
  <input type="text" className="form-control value-from-pair" value={resource} disabled />
</span>;

const keyStringToComponent = {
  fieldRef: FieldRef,
  secretKeyRef: SecretKeyRef,
  configMapKeyRef: ConfigMapKeyRef,
  resourceFieldRef: ResourceFieldRef,
};

export class ValueFromPair extends React.PureComponent {
  constructor (props) {
    super(props);

    this.valueFromKey = Object.keys(this.props.pair)[0];
    this.Component = keyStringToComponent[this.valueFromKey];
  }

  render () {
    const data = this.props.pair[this.valueFromKey];

    return <this.Component data={data} />;
  }
}
ValueFromPair.propTypes = {
  pair: PropTypes.object.isRequired
};
