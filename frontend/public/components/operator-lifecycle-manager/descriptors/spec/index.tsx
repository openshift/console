import * as React from 'react';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';

import { SpecCapability, DescriptorProps, CapabilityProps } from '../types';
import { ResourceRequirementsModalLink } from './resource-requirements';
import { EndpointList } from './endpoint';
import { configureSizeModal } from './configure-size';
import { Selector, ResourceLink, LoadingInline, AsyncComponent } from '../../../utils';
import { Tooltip } from '../../../utils/tooltip';
import { k8sPatch } from '../../../../module/k8s';

const Default: React.SFC<SpecCapabilityProps> = ({value}) => {
  if (_.isEmpty(value) && !_.isNumber(value)) {
    return <span className="text-muted">None</span>;
  } else if (_.isObject(value)) {
    return <div>{_.map(value, (v, k) => <span key={k} className="row">{k}: {v}</span>)}</div>;
  }
  return <span>{_.toString(value)}</span>;
};

const PodCount: React.SFC<SpecCapabilityProps> = ({model, obj, descriptor, value}) =>
  <button type="button" className="btn btn-link co-modal-btn-link" onClick={() => configureSizeModal({kindObj: model, resource: obj, specDescriptor: descriptor, specValue: value})}>{value} pods</button>;

const Endpoints: React.SFC<SpecCapabilityProps> = ({value}) => <EndpointList endpoints={value} />;

const Label: React.SFC<SpecCapabilityProps> = ({value}) => <span>{value || '--'}</span>;

const NamespaceSelector: React.SFC<SpecCapabilityProps> = ({value}) => <ResourceLink kind="Namespace" name={value.matchNames[0]} title={value.matchNames[0]} />;

const ResourceRequirements: React.SFC<SpecCapabilityProps> = ({obj, descriptor}) => <dl className="co-spec-descriptor--resource-requirements">
  <dt>Resource Limits</dt>
  <dd><ResourceRequirementsModalLink type="limits" obj={obj} path={descriptor.path} /></dd>
  <dt>Resource Requests</dt>
  <dd><ResourceRequirementsModalLink type="requests" obj={obj} path={descriptor.path} /></dd>
</dl>;

const K8sResourceLink: React.SFC<SpecCapabilityProps> = (props) => _.isEmpty(props.value)
  ? <span className="text-muted">None</span>
  : <ResourceLink kind={props.capability.split(SpecCapability.k8sResourcePrefix)[1]} name={props.value} namespace={props.namespace} />;

const BasicSelector: React.SFC<SpecCapabilityProps> = ({value, capability}) => <Selector selector={value} kind={capability.split(SpecCapability.selector)[1]} />;

class BooleanSwitch extends React.Component<SpecCapabilityProps, BooleanSwitchState> {
  public state = {value: this.props.value, confirmed: false};

  render() {
    const {props, state} = this;
    const patchFor = (value: boolean) => [{op: 'replace', path: `/spec/${props.descriptor.path.replace('.', '/')}`, value}];

    const update = () => {
      this.setState({confirmed: true});
      return k8sPatch(props.model, props.obj, patchFor(state.value));
    };

    return <div className="co-spec-descriptor--switch">
      <AsyncComponent
        loader={() => import('patternfly-react').then(m => m.Switch)}
        value={state.value}
        onChange={(el, value) => this.setState({value, confirmed: false})}
        onText="True"
        offText="False"
        bsSize="mini" />
      &nbsp;&nbsp;
      {state.value !== props.value && state.confirmed && <LoadingInline />}
      {state.value !== props.value && !state.confirmed && <React.Fragment>
        &nbsp;&nbsp;<i className="fa fa-exclamation-triangle text-warning" aria-hidden="true" />
        <button className="btn btn-link" onClick={update}>Confirm change</button>
      </React.Fragment>}
    </div>;
  }
}

const capabilityComponents = ImmutableMap<SpecCapability, React.ComponentType<SpecCapabilityProps>>()
  .set(SpecCapability.podCount, PodCount)
  .set(SpecCapability.endpointList, Endpoints)
  .set(SpecCapability.label, Label)
  .set(SpecCapability.namespaceSelector, NamespaceSelector)
  .set(SpecCapability.resourceRequirements, ResourceRequirements)
  .set(SpecCapability.k8sResourcePrefix, K8sResourceLink)
  .set(SpecCapability.selector, BasicSelector)
  .set(SpecCapability.booleanSwitch, BooleanSwitch);

const capabilityFor = (specCapability: SpecCapability) => {
  if (_.isEmpty(specCapability)) {
    return Default;
  } else if (specCapability.startsWith(SpecCapability.k8sResourcePrefix)) {
    return capabilityComponents.get(SpecCapability.k8sResourcePrefix);
  } else if (specCapability.startsWith(SpecCapability.selector)) {
    return capabilityComponents.get(SpecCapability.selector);
  }
  return capabilityComponents.get(specCapability, Default);
};

/**
 * Main entrypoint component for rendering custom UI for a given spec descriptor. This should be used instead of importing
 * individual components from this module.
 */
export const SpecDescriptor: React.SFC<DescriptorProps> = (props) => {
  const {model, obj, descriptor, value, namespace} = props;
  // Only using first capability instead of dealing with combimations/permutations
  const capability = _.get(descriptor, ['x-descriptors', 0], null) as SpecCapability;
  const Capability = capabilityFor(capability);

  return <dl className="olm-descriptor">
    <div style={{width: 'max-content'}}>
      <Tooltip content={descriptor.description}>
        <dt className="olm-descriptor__title">{descriptor.displayName}</dt>
      </Tooltip>
    </div>
    <dd className="olm-descriptor__value"><Capability descriptor={descriptor} capability={capability} value={value} namespace={namespace} model={model} obj={obj} /></dd>
  </dl>;
};

type BooleanSwitchState = {
  value: boolean;
  confirmed: boolean;
};

type SpecCapabilityProps = CapabilityProps<SpecCapability>;
