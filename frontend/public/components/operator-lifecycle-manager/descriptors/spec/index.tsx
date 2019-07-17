import * as React from 'react';
import * as _ from 'lodash-es';
import { Map as ImmutableMap } from 'immutable';

import { SpecCapability, DescriptorProps, CapabilityProps } from '../types';
import { ResourceRequirementsModalLink } from './resource-requirements';
import { EndpointList } from './endpoint';
import { configureSizeModal } from './configure-size';
import { Selector, ResourceLink, LoadingInline, AsyncComponent } from '../../../utils';
import { Tooltip } from '../../../utils/tooltip';
import { k8sPatch } from '../../../../module/k8s';
import { YellowExclamationTriangleIcon } from '@console/shared';

const Default: React.SFC<SpecCapabilityProps> = ({value}) => {
  if (_.isEmpty(value) && !_.isNumber(value)) {
    return <span className="text-muted">None</span>;
  } else if (_.isObject(value)) {
    return <span className="text-muted">Unsupported</span>;
  }
  return <span>{_.toString(value)}</span>;
};

const PodCount: React.SFC<SpecCapabilityProps> = ({model, obj, descriptor, value}) =>
  <button type="button" className="btn btn-link co-modal-btn-link" onClick={() => configureSizeModal({kindObj: model, resource: obj, specDescriptor: descriptor, specValue: value})}>{value} pods</button>;

const Endpoints: React.SFC<SpecCapabilityProps> = ({value}) => <EndpointList endpoints={value} />;

const Label: React.SFC<SpecCapabilityProps> = ({value}) => <span>{value || '--'}</span>;

const NamespaceSelector: React.SFC<SpecCapabilityProps> = ({value}) => _.get(value, 'matchNames[0]')
  ? <ResourceLink kind="Namespace" name={value.matchNames[0]} title={value.matchNames[0]} />
  : <span className="text-muted">None</span>;

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

const BooleanSwitch: React.FC<SpecCapabilityProps> = (props) => {
  const [value, setValue] = React.useState(props.value);
  const [confirmed, setConfirmed] = React.useState(false);

  const patchFor = (val: boolean) => [{op: 'replace', path: `/spec/${props.descriptor.path.replace('.', '/')}`, val}];
  const update = () => {
    setConfirmed(true);
    return k8sPatch(props.model, props.obj, patchFor(value));
  };

  return <div className="co-spec-descriptor--switch">
    <AsyncComponent
      loader={() => import('patternfly-react').then(m => m.Switch)}
      value={value}
      onChange={(el, val) => {
        setValue(val);
        setConfirmed(false);
      }}
      onText="True"
      offText="False"
      bsSize="mini" />
    &nbsp;&nbsp;
    {value !== props.value && confirmed && <LoadingInline />}
    {value !== props.value && !confirmed && <React.Fragment>
      &nbsp;&nbsp;<YellowExclamationTriangleIcon />
      <button className="btn btn-link" onClick={update}>Confirm change</button>
    </React.Fragment>}
  </div>;
};

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

type SpecCapabilityProps = CapabilityProps<SpecCapability>;
