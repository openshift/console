/* eslint-disable no-undef */
import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import { ButtonBar, Dropdown, history, resourcePathFromModel, ResourceName } from '../utils';
import { k8sCreate, k8sList, K8sResourceKind } from '../../module/k8s';
import { formatNamespacedRouteForResource, getActiveNamespace } from '../../ui/ui-actions';
import { ServiceModel, RouteModel } from '../../models';
import { AsyncComponent } from '../utils/async';

const getPortOptions = (service: K8sResourceKind) => {
  if (!service) {
    return {};
  }

  const ports = _.get(service, 'spec.ports', []);
  const portOptions = ports.reduce((acc, { name, port, targetPort, protocol }) => {
    acc[name] = <React.Fragment>{port} &rarr; {targetPort} ({protocol})</React.Fragment>;
    return acc;
  }, {});

  return portOptions;
};

const DroppableFileInput = (props) => <AsyncComponent loader={() => import('../utils/file-input').then(c => c.DroppableFileInput)} {...props} />;

export class CreateRoute extends React.Component<null, CreateRouteState> {
  state = {
    name: '',
    hostname: '',
    path: '',
    service: '',
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
  };

  componentDidMount() {
    k8sList(ServiceModel, {ns: this.state.namespace})
      .then(services => this.setState({
        services,
        loaded: true,
      }))
      .catch(err => this.setState({
        error: err.message
      }));
  }

  handleChange: React.ReactEventHandler<HTMLInputElement> = event => {
    const { name, value } = event.currentTarget;
    this.setState({
      [name]: value
    } as any);
  }

  changeService = (serviceName: string) => {
    const selectedService = _.find(this.state.services, { metadata: { name: serviceName } });
    const portOptions = getPortOptions(selectedService);
    const labels = selectedService.metadata.labels;
    this.setState({
      service: serviceName,
      portOptions,
      labels,
    });
  }

  changeTargetPort = (portName: string) => this.setState({
    targetPort: portName
  });

  toggleSection: React.ReactEventHandler<HTMLInputElement> = event => {
    const { name, checked } = event.currentTarget;
    this.setState({
      [name]: checked
    } as any);
  }

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
  }

  changeInsecureTraffic = (insecureEdgeTerminationPolicy: string) => this.setState({insecureEdgeTerminationPolicy});

  onCertificateChange = (certificate: string) => this.setState({certificate});

  onPrivateKeyChange = (key: string) => this.setState({key});

  onCaCertificateChange = (caCertificate: string) => this.setState({caCertificate});

  onDestinationCACertificateChange = (destinationCACertificate: string) => this.setState({destinationCACertificate});

  save = event => {
    event.preventDefault();

    const {
      name,
      hostname,
      path,
      service,
      targetPort,
      termination,
      insecureEdgeTerminationPolicy,
      certificate,
      key,
      caCertificate,
      destinationCACertificate,
      secure,
      namespace,
      labels,
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
    const route = {
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
          name: service
        },
        tls,
        host: hostname,
        path,
        port: {
          targetPort,
        }
      }
    };

    this.setState({ inProgress: true });
    k8sCreate(RouteModel, route)
      .then(() => {
        this.setState({inProgress: false});
        history.push(resourcePathFromModel(RouteModel, name, namespace));
      }, err => this.setState({
        error: err.message,
        inProgress: false
      }));
  }

  render() {
    const title = 'Create Route';
    const { loaded, services, service, portOptions, termination } = this.state;
    const serviceOptions = {};
    _.each(_.sortBy(services, 'metadata.name'), ({ metadata: { name } }) => serviceOptions[name] = <ResourceName kind="Service" name={name} />);
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

    return <React.Fragment>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <div className="co-m-nav-title">
        <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
          <div className="co-m-pane__name">
            {title}
          </div>
          <div className="co-m-pane__heading-link">
            <Link to={`/k8s/ns/${this.state.namespace}/routes/new`}>From YAML</Link>
          </div>
        </h1>
      </div>
      <div className="co-m-pane__body">
        <p className="co-m-pane__explanation">
          Routing is a way to make your application publicly visible.
        </p>
        <form onSubmit={this.save} className="co-create-route">
          <div className="form-group co-create-route__name">
            <label className="co-required" htmlFor="name">Name</label>
            <input className="form-control"
              type="text"
              onChange={this.handleChange}
              value={this.state.name}
              placeholder="my-route"
              id="name"
              name="name"
              required />
            <div className="help-block">
              A unique name for the route within the project.
            </div>
          </div>
          <div className="form-group co-create-route__hostname">
            <label htmlFor="hostname">Hostname</label>
            <input className="form-control"
              type="text"
              onChange={this.handleChange}
              value={this.state.hostname}
              placeholder="www.example.com"
              id="hostname"
              name="hostname" />
            <div className="help-block">
              <p>Public hostname for the route.  If not specified, a hostname is generated.</p>
              <p>The hostname cannot be changed after the route is created.</p>
              {/* TODO:  add additional wildcard help text from https://github.com/openshift/origin-web-console/blob/master/app/views/directives/osc-routing.html#L65-L67 */}
            </div>
          </div>
          <div className="form-group co-create-route__path">
            <label htmlFor="path">Path</label>
            <input className="form-control"
              type="text"
              onChange={this.handleChange}
              value={this.state.path}
              placeholder="/"
              id="path"
              name="path" />
            <div className="help-block">
              Path that the router watches to route traffic to the service.
            </div>
          </div>
          <div className="form-group co-create-route__service">
            <label className="co-required" htmlFor="service">Service</label>
            {(loaded && _.isEmpty(serviceOptions)) && <p className="alert alert-info co-create-route__alert"><span className="pficon pficon-info" aria-hidden="true"></span> There are no services in your project to expose with a route.</p> }
            {(loaded && !_.isEmpty(serviceOptions)) && <Dropdown items={serviceOptions} title={service ? serviceOptions[service] : 'Select a service'} dropDownClassName="dropdown--full-width" id="service" onChange={this.changeService} /> }
            <div className="help-block">
              Service to route to.
            </div>
          </div>
          <div className="form-group co-create-route__target-port">
            <label className="co-required" htmlFor="target-port">Target Port</label>
            {_.isEmpty(portOptions) && <p>Select a service above</p>}
            {!_.isEmpty(portOptions) && <Dropdown items={portOptions} title="Select target port" dropDownClassName="dropdown--full-width" id="target-port" onChange={this.changeTargetPort} /> }
            <div className="help-block">
              Target port for traffic.
            </div>
          </div>
          <h2 className="h3">Security</h2>
          <div className="checkbox">
            <label>
              <input type="checkbox"
                onChange={this.toggleSection}
                checked={this.state.secure}
                id="secure"
                name="secure" />
              Secure route
            </label>
            <div className="help-block">
              <p>Routes can be secured using several TLS termination types for serving certificates.</p>
            </div>
          </div>
          { this.state.secure && <div className="co-create-route__security">
            <div className="form-group co-create-route__tls-termination">
              <label className="co-required" htmlFor="tls-termination">TLS Termination</label>
              <Dropdown items={terminationTypes} title="Select termination type" dropDownClassName="dropdown--full-width" id="tls-termination" onChange={this.changeTermination} />
            </div>
            <div className="form-group co-create-route__insecure-traffic">
              <label className="co-required" htmlFor="insecure-traffic">Insecure Traffic</label>
              <Dropdown items={termination === 'passthrough' ? passthroughInsecureTrafficTypes : insecureTrafficTypes} title="Select insecure traffic type" dropDownClassName="dropdown--full-width" id="insecure-traffic" onChange={this.changeInsecureTraffic} />
              <div className="help-block">
                Policy for traffic on insecure schemes like HTTP.
              </div>
            </div>
            {(termination && termination !== 'passthrough') && <React.Fragment>
              <h2 className="h3">Certificates</h2>
              <div className="help-block">
                <p>TLS certificates for edge and re-encrypt termination. If not specified, the router&apos;s default certificate is used.</p>
              </div>
              <div className="form-group co-create-route__certificate">
                <DroppableFileInput
                  onChange={this.onCertificateChange}
                  inputFileData={this.state.certificate}
                  id="certificate"
                  label="Certificate"
                  inputFieldHelpText="The PEM format certificate. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard." />
              </div>
              <div className="form-group co-create-route__private-key">
                <DroppableFileInput
                  onChange={this.onPrivateKeyChange}
                  inputFileData={this.state.key}
                  id="private-key"
                  label="Private Key"
                  inputFieldHelpText="The PEM format key. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard." />
              </div>
              <div className="form-group co-create-route__caCertificate">
                <DroppableFileInput
                  onChange={this.onCaCertificateChange}
                  inputFileData={this.state.caCertificate}
                  id="ca-certificate"
                  label="CA Certificate"
                  inputFieldHelpText="The PEM format CA certificate chain. Upload file by dragging &amp; dropping, selecting it, or pasting from the clipboard." />
              </div>
              {termination === 'reencrypt' && <div className="form-group co-create-route__destinationCaCertificate">
                <DroppableFileInput
                  onChange={this.onDestinationCACertificateChange}
                  inputFileData={this.state.destinationCACertificate}
                  id="destination-ca-certificate"
                  label="Destination CA Certificate" />
              </div>}
            </React.Fragment>}
          </div> }
          <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
            <button type="submit"
              disabled={(!this.state.name || !this.state.service || !this.state.targetPort || this.state.secure && (!this.state.termination || !this.state.insecureEdgeTerminationPolicy))}
              className="btn btn-primary"
              id="save-changes">Create</button>
            <Link to={formatNamespacedRouteForResource('routes')} className="btn btn-default" id="cancel">Cancel</Link>
          </ButtonBar>
        </form>
      </div>
    </React.Fragment>;
  }
}

export type CreateRouteState = {
  name: string,
  hostname: string,
  path: string,
  service: string,
  targetPort: string,
  termination: string,
  insecureEdgeTerminationPolicy: string,
  certificate: string,
  key: string,
  caCertificate: string,
  destinationCACertificate: string,
  secure: boolean,
  loaded: boolean,
  inProgress: boolean,
  error: string,
  namespace: string,
  services: K8sResourceKind[],
  labels: object,
  portOptions: any,
};
