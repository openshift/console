import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Alert, ActionGroup, Button } from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';

import { ButtonBar, Dropdown, history, resourcePathFromModel, ResourceName } from '../utils';
import { k8sCreate, k8sList, K8sResourceKind } from '../../module/k8s';
import { getActiveNamespace } from '../../actions/ui';
import { ServiceModel, RouteModel } from '../../models';
import { AsyncComponent } from '../utils/async';

const UNNAMED_PORT_KEY = '#unnamed';
const MAX_ALT_SERVICE_TARGET = 3;

const getPortOptions = (service: K8sResourceKind) => {
  if (!service) {
    return {};
  }

  const ports = _.get(service, 'spec.ports', []);
  const portOptions = ports.reduce(
    (acc, { name = UNNAMED_PORT_KEY, port, targetPort, protocol }) => {
      acc[name] = (
        <>
          {port} &rarr; {targetPort} ({protocol})
        </>
      );
      return acc;
    },
    {},
  );

  return portOptions;
};

const DroppableFileInput = (props) => (
  <AsyncComponent
    loader={() => import('../utils/file-input').then((c) => c.DroppableFileInput)}
    {...props}
  />
);

export class CreateRoute extends React.Component<{}, CreateRouteState> {
  state = {
    name: '',
    hostname: '',
    path: '',
    service: null,
    weight: 100,
    targetPort: '',
    termination: '',
    insecureEdgeTerminationPolicy: '',
    certificate: '',
    key: '',
    caCertificate: '',
    destinationCACertificate: '',
    secure: false,
    loaded: false,
    inProgress: false,
    error: '',
    namespace: getActiveNamespace(),
    services: [],
    labels: {},
    portOptions: {},
    alternateServices: [],
  };

  componentDidMount() {
    k8sList(ServiceModel, { ns: this.state.namespace })
      .then((services) =>
        this.setState({
          services,
          loaded: true,
        }),
      )
      .catch((err) =>
        this.setState({
          error: err.message,
        }),
      );
  }

  handleChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const { name, value } = event.currentTarget;
    this.setState({
      [name]: value,
    } as any);
  };

  handleWeightChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const { value } = event.currentTarget;
    this.setState({
      weight: _.toInteger(value),
    });
  };

  changeService = (serviceName: string) => {
    const service = _.find(this.state.services, { metadata: { name: serviceName } });
    const portOptions = getPortOptions(service);
    this.setState({
      service,
      portOptions,
      // unset targetPort if previously set
      targetPort: '',
    });
  };

  changeTargetPort = (targetPort: string) =>
    this.setState({
      targetPort,
    });

  toggleSection: React.ReactEventHandler<HTMLInputElement> = (event) => {
    const { name, checked } = event.currentTarget;
    this.setState({
      [name]: checked,
    } as any);
  };

  changeTermination = (termination: string) => {
    const newState: any = {
      termination,
      // unset insecureEdgeTerminationPolicy if it was set
      insecureEdgeTerminationPolicy: '',
    };
    switch (termination) {
      case 'edge':
        // unset tls data if it was set
        newState.destinationCACertificate = '';
        break;
      case 'passthrough':
        Object.assign(newState, {
          // unset tls data if it was set
          certificate: '',
          key: '',
          caCertificate: '',
          destinationCACertificate: '',
        });
        break;
      default:
    }
    this.setState(newState);
  };

  changeInsecureTraffic = (insecureEdgeTerminationPolicy: string) =>
    this.setState({ insecureEdgeTerminationPolicy });

  onCertificateChange = (certificate: string) => this.setState({ certificate });

  onPrivateKeyChange = (key: string) => this.setState({ key });

  onCaCertificateChange = (caCertificate: string) => this.setState({ caCertificate });

  onDestinationCACertificateChange = (destinationCACertificate: string) =>
    this.setState({ destinationCACertificate });

  save = (event) => {
    event.preventDefault();

    const {
      name,
      hostname,
      path,
      service,
      weight,
      targetPort: selectedPort,
      termination,
      insecureEdgeTerminationPolicy,
      certificate,
      key,
      caCertificate,
      destinationCACertificate,
      secure,
      namespace,
      alternateServices,
    } = this.state;

    const tls = secure
      ? {
          termination,
          insecureEdgeTerminationPolicy,
          certificate,
          key,
          caCertificate,
          destinationCACertificate,
        }
      : null;

    const serviceName = _.get(service, 'metadata.name');
    const labels = _.get(service, 'metadata.labels');

    // If the port is unnamed, there is only one port. Use the port number.
    const targetPort =
      selectedPort === UNNAMED_PORT_KEY
        ? _.get(service, 'spec.ports[0].targetPort') || _.get(service, 'spec.ports[0].port')
        : selectedPort;

    const alternateBackends = _.filter(alternateServices, 'name').map(
      (serviceData: AlternateServiceEntryType) => {
        return {
          weight: serviceData.weight,
          kind: 'Service',
          name: serviceData.name,
        };
      },
    );

    const route: K8sResourceKind = {
      kind: 'Route',
      apiVersion: 'route.openshift.io/v1',
      metadata: {
        name,
        namespace,
        labels,
      },
      spec: {
        to: {
          kind: 'Service',
          name: serviceName,
          weight,
        },
        tls,
        host: hostname,
        path,
        port: {
          targetPort,
        },
      },
    };

    if (!_.isEmpty(alternateBackends)) {
      route.spec.alternateBackends = alternateBackends;
    }

    this.setState({ inProgress: true });
    k8sCreate(RouteModel, route).then(
      () => {
        this.setState({ inProgress: false });
        history.push(resourcePathFromModel(RouteModel, name, namespace));
      },
      (err) =>
        this.setState({
          error: err.message,
          inProgress: false,
        }),
    );
  };

  addAltServiceEntry = () => {
    this.setState(({ alternateServices }) => {
      return {
        alternateServices: [
          ...alternateServices,
          { name: null, weight: 100, key: _.uniqueId('alternate-backend-') },
        ],
      };
    });
  };

  removeAltServiceEntry(alternateServiceIndex: number) {
    this.setState(({ alternateServices }) => {
      const updatedServiceEntriesArray: AlternateServiceEntryType[] = [...alternateServices];
      updatedServiceEntriesArray.splice(alternateServiceIndex, 1);
      return {
        alternateServices: updatedServiceEntriesArray,
      };
    });
  }

  onDataChanged = (updatedEntry: AlternateServiceEntryGroupData, index: number) => {
    this.setState(({ alternateServices }) => {
      const updatedServiceEntriesArray: AlternateServiceEntryType[] = [...alternateServices];
      const updatedEntryData: AlternateServiceEntryType = {
        key: updatedServiceEntriesArray[index].key,
        weight: updatedEntry.weight,
        name: updatedEntry.name,
      };
      updatedServiceEntriesArray[index] = updatedEntryData;
      return {
        alternateServices: updatedServiceEntriesArray,
      };
    });
  };

  render() {
    const title = 'Create Route';
    const {
      loaded,
      services,
      service,
      portOptions,
      targetPort,
      termination,
      alternateServices,
    } = this.state;
    const serviceOptions = {};
    _.each(
      _.sortBy(services, 'metadata.name'),
      ({ metadata: { name } }) =>
        (serviceOptions[name] = <ResourceName kind="Service" name={name} />),
    );
    const configuredServices = new Set<string>();
    if (service) {
      configuredServices.add(service.metadata.name);
    }
    _.each(alternateServices, ({ name }) => configuredServices.add(name));
    const availableServiceOptions = _.pickBy(
      serviceOptions,
      (item, key) => !configuredServices.has(key),
    );
    const terminationTypes = {
      edge: 'Edge',
      passthrough: 'Passthrough',
      reencrypt: 'Re-encrypt',
    };
    const insecureTrafficTypes = {
      None: 'None',
      Allow: 'Allow',
      Redirect: 'Redirect',
    };
    const passthroughInsecureTrafficTypes = {
      None: 'None',
      Redirect: 'Redirect',
    };
    const alternateServicesList = _.map(alternateServices, (entryData, index) => {
      return (
        <div className="co-add-remove-form__entry" key={entryData.key}>
          {!_.isEmpty(alternateServices) && (
            <div className="co-add-remove-form__link--remove-entry">
              <Button
                type="button"
                onClick={() => this.removeAltServiceEntry(index)}
                variant="link"
                isInline
              >
                <MinusCircleIcon className="co-icon-space-r" />
                Remove Alternate Service
              </Button>
            </div>
          )}
          <AlternateServicesGroup
            index={index}
            name={entryData.name}
            weight={entryData.weight}
            onChange={this.onDataChanged}
            serviceOptions={serviceOptions}
            availableServiceOptions={availableServiceOptions}
          />
        </div>
      );
    });

    return (
      <>
        <div className="co-m-pane__body co-m-pane__form">
          <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
            <div className="co-m-pane__name">{title}</div>
            <div className="co-m-pane__heading-link">
              <Link
                to={`/k8s/ns/${this.state.namespace}/routes/~new`}
                id="yaml-link"
                data-test="yaml-link"
                replace
              >
                Edit YAML
              </Link>
            </div>
          </h1>
          <p className="co-m-pane__explanation">
            Routing is a way to make your application publicly visible.
          </p>
          <form onSubmit={this.save} className="co-create-route">
            <div className="form-group co-create-route__name">
              <label className="co-required" htmlFor="name">
                Name
              </label>
              <input
                className="pf-c-form-control"
                type="text"
                onChange={this.handleChange}
                value={this.state.name}
                placeholder="my-route"
                id="name"
                name="name"
                aria-describedby="name-help"
                required
              />
              <div className="help-block" id="name-help">
                <p>A unique name for the route within the project.</p>
              </div>
            </div>
            <div className="form-group co-create-route__hostname">
              <label htmlFor="hostname">Hostname</label>
              <input
                className="pf-c-form-control"
                type="text"
                onChange={this.handleChange}
                value={this.state.hostname}
                placeholder="www.example.com"
                id="hostname"
                name="hostname"
                aria-describedby="hostname-help"
              />
              <div className="help-block" id="hostname-help">
                <p>Public hostname for the route. If not specified, a hostname is generated.</p>
              </div>
            </div>
            <div className="form-group co-create-route__path">
              <label htmlFor="path">Path</label>
              <input
                className="pf-c-form-control"
                type="text"
                onChange={this.handleChange}
                value={this.state.path}
                placeholder="/"
                id="path"
                name="path"
                aria-describedby="path-help"
              />
              <div className="help-block" id="path-help">
                <p>Path that the router watches to route traffic to the service.</p>
              </div>
            </div>
            <div className="form-group co-create-route__service">
              <label className="co-required" htmlFor="service">
                Service
              </label>
              {loaded && _.isEmpty(serviceOptions) && (
                <Alert
                  isInline
                  className="co-alert co-create-route__alert"
                  variant="info"
                  title="No services"
                >
                  There are no services in your project to expose with a route.
                </Alert>
              )}
              {loaded && !_.isEmpty(serviceOptions) && (
                <Dropdown
                  items={availableServiceOptions}
                  title={service ? serviceOptions[service.metadata.name] : 'Select a service'}
                  dropDownClassName="dropdown--full-width"
                  id="service"
                  onChange={this.changeService}
                  describedBy="service-help"
                />
              )}
              <div className="help-block" id="service-help">
                <p>Service to route to.</p>
              </div>
            </div>
            {alternateServicesList.length > 0 && (
              <>
                <div className="form-group co-create-route__weight">
                  <label htmlFor="weight">Weight</label>
                  <input
                    className="pf-c-form-control co-create-route__weight-label"
                    type="number"
                    onChange={this.handleWeightChange}
                    value={this.state.weight}
                    id="weight"
                    aria-describedby="weight-help"
                  />
                  <div className="help-block" id="weight-help">
                    <p>
                      A number between 0 and 255 that depicts relative weight compared with other
                      targets.
                    </p>
                  </div>
                </div>
                {alternateServicesList}
              </>
            )}
            {alternateServicesList.length < MAX_ALT_SERVICE_TARGET &&
              alternateServicesList.length + 1 < _.keys(serviceOptions).length &&
              service && (
                <Button
                  className="pf-m-link--align-left co-create-route__add-service-btn"
                  onClick={this.addAltServiceEntry}
                  type="button"
                  variant="link"
                  isInline
                >
                  <PlusCircleIcon className="co-icon-space-r" />
                  Add Alternate Service
                </Button>
              )}
            <div className="form-group co-create-route__target-port">
              <label className="co-required" htmlFor="target-port">
                Target Port
              </label>
              {_.isEmpty(portOptions) && <p>Select a service above</p>}
              {!_.isEmpty(portOptions) && (
                <Dropdown
                  items={portOptions}
                  title={portOptions[targetPort] || 'Select target port'}
                  dropDownClassName="dropdown--full-width"
                  id="target-port"
                  onChange={this.changeTargetPort}
                  describedBy="target-port-help"
                />
              )}
              <div className="help-block" id="target-port-help">
                <p>Target port for traffic.</p>
              </div>
            </div>
            <div className="form-group co-create-route__security">
              <label className="control-label">Security</label>
              <div className="checkbox">
                <label>
                  <input
                    type="checkbox"
                    onChange={this.toggleSection}
                    checked={this.state.secure}
                    id="secure"
                    name="secure"
                    aria-describedby="secure-help"
                  />
                  Secure route
                </label>
                <div className="help-block" id="secure-help">
                  <p>
                    Routes can be secured using several TLS termination types for serving
                    certificates.
                  </p>
                </div>
              </div>
              {this.state.secure && (
                <div className="co-create-route__security">
                  <div className="form-group co-create-route__tls-termination">
                    <label className="co-required" htmlFor="tls-termination">
                      TLS Termination
                    </label>
                    <Dropdown
                      items={terminationTypes}
                      title="Select termination type"
                      dropDownClassName="dropdown--full-width"
                      id="tls-termination"
                      onChange={this.changeTermination}
                    />
                  </div>
                  <div className="form-group co-create-route__insecure-traffic">
                    <label htmlFor="insecure-traffic">Insecure Traffic</label>
                    <Dropdown
                      items={
                        termination === 'passthrough'
                          ? passthroughInsecureTrafficTypes
                          : insecureTrafficTypes
                      }
                      title="Select insecure traffic type"
                      dropDownClassName="dropdown--full-width"
                      id="insecure-traffic"
                      onChange={this.changeInsecureTraffic}
                      describedBy="insecure-traffic-help"
                    />
                    <div className="help-block" id="insecure-traffic-help">
                      <p>Policy for traffic on insecure schemes like HTTP.</p>
                    </div>
                  </div>
                  {termination && termination !== 'passthrough' && (
                    <>
                      <h2 className="h3">Certificates</h2>
                      <div className="help-block">
                        <p>
                          TLS certificates for edge and re-encrypt termination. If not specified,
                          the router&apos;s default certificate is used.
                        </p>
                      </div>
                      <div className="form-group co-create-route__certificate">
                        <DroppableFileInput
                          onChange={this.onCertificateChange}
                          inputFileData={this.state.certificate}
                          id="certificate"
                          label="Certificate"
                          inputFieldHelpText="The PEM format certificate. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard."
                        />
                      </div>
                      <div className="form-group co-create-route__private-key">
                        <DroppableFileInput
                          onChange={this.onPrivateKeyChange}
                          inputFileData={this.state.key}
                          id="private-key"
                          label="Private Key"
                          inputFieldHelpText="The PEM format key. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard."
                        />
                      </div>
                      <div className="form-group co-create-route__caCertificate">
                        <DroppableFileInput
                          onChange={this.onCaCertificateChange}
                          inputFileData={this.state.caCertificate}
                          id="ca-certificate"
                          label="CA Certificate"
                          inputFieldHelpText="The PEM format CA certificate chain. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard."
                        />
                      </div>
                      {termination === 'reencrypt' && (
                        <div className="form-group co-create-route__destinationCaCertificate">
                          <DroppableFileInput
                            onChange={this.onDestinationCACertificateChange}
                            inputFileData={this.state.destinationCACertificate}
                            id="destination-ca-certificate"
                            label="Destination CA Certificate"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
                <ActionGroup className="pf-c-form">
                  <Button
                    type="submit"
                    isDisabled={
                      !this.state.name ||
                      !this.state.service ||
                      !this.state.targetPort ||
                      (this.state.secure && !this.state.termination)
                    }
                    id="save-changes"
                    variant="primary"
                  >
                    Create
                  </Button>
                  <Button onClick={history.goBack} id="cancel" variant="secondary">
                    Cancel
                  </Button>
                </ActionGroup>
              </ButtonBar>
            </div>
          </form>
        </div>
      </>
    );
  }
}

export const AlternateServicesGroup: React.FC<AlternateServiceEntryGroupProps> = (props) => {
  const [weight, setWeight] = React.useState(props.weight);
  const [name, setName] = React.useState(props.name);

  const onWeightChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setWeight(_.toInteger(event.currentTarget.value));
  };

  const onServiceChange = (serviceName: string) => {
    setName(serviceName);
  };

  const { serviceOptions, availableServiceOptions, index, onChange } = props;

  React.useEffect(() => {
    onChange({ name, weight }, index);
  }, [name, weight, index, onChange]);

  return (
    <>
      <div className="form-group">
        <label htmlFor={`${index}-alt-service`}>Alternate Service Target</label>
        <Dropdown
          items={availableServiceOptions}
          title={name ? serviceOptions[name] : 'Select a service'}
          dropDownClassName="dropdown--full-width"
          id={`${index}-alt-service`}
          onChange={onServiceChange}
          describedby={`${index}-alt-service-help`}
        />
        <div className="help-block" id={`${index}-alt-service-help`}>
          <p>Alternate service to route to.</p>
        </div>
      </div>
      <div className="form-group">
        <label htmlFor={`${index}-weight`}>Alternate Service Weight</label>
        <input
          className="pf-c-form-control co-create-route__weight-label"
          id={`${index}-weight`}
          type="number"
          onChange={onWeightChange}
          value={weight}
          aria-describedby={`${index}-alt-weight-help`}
        />
        <div className="help-block" id={`${index}-alt-weight-help`}>
          <p>
            A number between 0 and 255 that depicts relative weight compared with other targets.
          </p>
        </div>
      </div>
    </>
  );
};

type AlternateServiceEntryType = {
  name: string;
  weight: number;
  key: string;
};

type AlternateServiceEntryGroupData = {
  weight: number;
  name: string;
};

type AlternateServiceEntryGroupProps = {
  name: string;
  weight: number;
  index: number;
  onChange: Function;
  serviceOptions: any;
  availableServiceOptions: any;
};

export type CreateRouteState = {
  name: string;
  hostname: string;
  path: string;
  service: K8sResourceKind;
  weight: number;
  targetPort: string;
  termination: string;
  insecureEdgeTerminationPolicy: string;
  certificate: string;
  key: string;
  caCertificate: string;
  destinationCACertificate: string;
  secure: boolean;
  loaded: boolean;
  inProgress: boolean;
  error: string;
  namespace: string;
  services: K8sResourceKind[];
  labels: object;
  portOptions: any;
  alternateServices: AlternateServiceEntryType[];
};
