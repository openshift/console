import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Alert } from '@patternfly/react-core';

import { FieldLevelHelp } from 'patternfly-react';
import { getPorts } from './source-to-image';
import { EnvironmentPage } from './environment';
import { formatNamespacedRouteForResource } from '../actions/ui';
import { k8sCreate } from '../module/k8s';
import { ButtonBar } from './utils/button-bar';
import {
  history,
  Loading,
  NsDropdown,
  PageHeading,
  SelectorInput,
  Timestamp,
  units,
} from './utils';
import {
  DeploymentConfigModel,
  ImageStreamModel,
  ImageStreamImportsModel,
  ServiceModel,
} from '../models';

const getSuggestedName = name => {
  if (!name) {
    return;
  }

  const imageName: string = _.last(name.split('/'));

  return _.first(imageName.split(/[^a-z0-9-]/));
};

const runsAsRoot = image => {
  const user = _.get(image, 'dockerImageMetadata.Config.User');
  return !user ||
          user === '0' ||
          user === 'root';
};

const ImagePorts = ({ports, name}) => <React.Fragment>
  {_.size(ports) > 1 ? 'Ports ' : 'Port '}
  {_.map(ports, port => `${port.containerPort}/${port.protocol.toUpperCase()}`).join(', ')} will be load balanced by Service <strong>{name || '<name>'}</strong>.
  <div>Other containers can access this service through the hostname <strong>{name || '<name>'}</strong>.</div>
</React.Fragment>;

export class DeployImage extends React.Component<DeployImageProps, DeployImageState> {
  constructor(props) {
    super(props);

    const params = new URLSearchParams(props.location.search);
    const namespace = params.get('preselected-ns');

    this.state = {
      namespace,
      imageName: '',
      loading: false,
      inProgress: false,
      name: '',
      labels: [],
    };
  }

  // The EnvironmentPage callback will set env with updates from the editor. env is then referenced in the deployment config onSave.
  env = [];

  onNamespaceChange = (namespace: string) => {
    this.setState({namespace});
  };

  onImageNameChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({imageName: event.currentTarget.value});
  };

  onKeyPress = event => {
    if (this.state.imageName && event.key === 'Enter') {
      this.search(event);
    }
  };

  onEnvironmentChange = (env) => {
    this.env = env;
  };

  onNameChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({name: event.currentTarget.value});
  };

  onLabelsChange = (labels: string[]) => {
    this.setState({labels});
  };

  search = event => {
    event.preventDefault();

    const { namespace, imageName } = this.state;
    const importImage = {
      kind: 'ImageStreamImport',
      apiVersion: 'image.openshift.io/v1',
      metadata: {
        name: 'newapp',
        namespace,
      },
      spec: {
        import: false,
        images: [{
          from: {
            kind: 'DockerImage',
            name: _.trim(imageName),
          },
        }],
      },
      status: {},
    };

    this.setState({
      loading: true,
      isi: null,
      name: '',
      error: null,
      searchError: null,
    });

    k8sCreate(ImageStreamImportsModel, importImage)
      .then((imageStreamImport) => {
        const status = _.get(imageStreamImport, 'status.images[0].status');
        if (status.status === 'Success') {
          const name = _.get(imageStreamImport, 'spec.images[0].from.name'),
              image = _.get(imageStreamImport, 'status.images[0].image'),
              tag = _.get(imageStreamImport, 'status.images[0].tag');
          this.setState({
            loading: false,
            isi: {
              name,
              image,
              tag,
              status,
            },
            name: getSuggestedName(name),
          });
        } else {
          this.setState({
            loading: false,
            searchError: status.message,
          });
        }
      }, err => this.setState({
        error: err.message,
        loading: false,
      }));
  };

  save = event => {
    event.preventDefault();

    this.setState({
      inProgress: true,
      error: null,
    });

    const { name, namespace, isi } = this.state;

    const annotations = {
      'openshift.io/generated-by': 'OpenShiftWebConsole',
    };

    const volumes = [], volumeMounts = [];
    let volumeNumber = 0;
    _.each(isi.image.dockerImageMetadata.Config.Volumes, (value, path) => {
      volumeNumber++;
      const volumeName = `${name}-${volumeNumber}`;
      volumes.push({
        name: volumeName,
        emptyDir: {},
      });
      volumeMounts.push({
        name: volumeName,
        mountPath: path,
      });
    });

    const ports = getPorts(isi);

    const labels = _.isEmpty(this.state.labels) ? {app: name} : SelectorInput.objectify(this.state.labels);

    const errorState = err => this.setState({error: this.state.error ? `${this.state.error}; ${err.message}` : err.message});

    const promises = [];

    const createResource = (model, obj) => {
      const promise = k8sCreate(model, obj)
        .catch(errorState);
      promises.push(promise);
    };

    const deploymentConfig = {
      kind: 'DeploymentConfig',
      apiVersion: 'apps.openshift.io/v1',
      metadata: {
        name,
        namespace,
        labels,
        annotations,
      },
      spec: {
        triggers: [{
          type: 'ConfigChange',
        }, {
          type: 'ImageChange',
          imageChangeParams: {
            automatic: true,
            containerNames: [
              name,
            ],
            from: {
              kind: 'ImageStreamTag',
              name: `${name}:${isi.tag}`,
              namespace,
            },
          },
        }],
        replicas: 1,
        selector: labels,
        template: {
          metadata: {
            labels,
            annotations,
          },
          spec: {
            volumes,
            containers: [{
              name,
              image: isi.image.dockerImageMetadata.Config.Image,
              ports,
              volumeMounts,
              env: this.env,
            }],
          },
        },
      },
    };

    createResource(DeploymentConfigModel, deploymentConfig);

    if (!_.isEmpty(ports)) {
      const service = {
        kind: 'Service',
        apiVersion: 'v1',
        metadata: {
          name,
          namespace,
          labels,
          annotations,
        },
        spec: {
          selector: {
            deploymentconfig: name,
          },
          ports: _.map(ports, port => ({
            port: port.containerPort,
            targetPort: port.containerPort,
            protocol: port.protocol,
            // Use the same naming convention as CLI new-app.
            name: `${port.containerPort}-${port.protocol}`.toLowerCase(),
          })),
        },
      };

      createResource(ServiceModel, service);
    }

    const imageStream = {
      kind: 'ImageStream',
      apiVersion: 'image.openshift.io/v1',
      metadata: {
        name,
        namespace,
        labels,
      },
      spec: {
        tags: [{
          name: isi.tag,
          annotations: {
            ...annotations,
            'openshift.io/imported-from': isi.name,
          },
          from: {
            kind: 'DockerImage',
            name: isi.name,
          },
          importPolicy: {},
        }],
      },
    };

    createResource(ImageStreamModel, imageStream);

    Promise.all(promises)
      .then(() => {
        this.setState({inProgress: false});
        if (!this.state.error) {
          history.push(`/k8s/cluster/projects/${this.state.namespace}/workloads`);
        }
      });
  };

  render() {
    const title = 'Deploy Image';
    const { loading, isi, name, labels, searchError } = this.state;
    const ports = getPorts(isi);

    return <React.Fragment>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} />
      <div className="co-m-pane__body">
        <form onSubmit={this.save} className="co-deploy-image co-m-pane__form">
          <div className="form-group co-deploy-image__namespace">
            <label className="control-label co-required" htmlFor="dropdown-selectbox">Namespace</label>
            <NsDropdown selectedKey={this.state.namespace} onChange={this.onNamespaceChange} id="dropdown-selectbox" />
          </div>
          <p>Deploy an existing image from an {/*image stream tag or */} image registry.</p>
          <div className="form-group co-deploy-image__image-name">
            <label className="control-label co-required" htmlFor="image-name">Image Name</label>
            <div className="input-group">
              <input className="form-control"
                type="search"
                onChange={this.onImageNameChange}
                onKeyDown={this.onKeyPress}
                value={this.state.imageName}
                id="image-name"
                name="imageName"
                aria-describedby="image-name-help" />
              <span className="input-group-btn">
                <button type="button" className="btn btn-default" onClick={this.search} disabled={!this.state.imageName}>
                  <i className="fa fa-search" aria-hidden="true"></i>
                  <span className="sr-only">Find</span>
                </button>
              </span>
            </div>
            <div className="help-block" id="image-name-help">
              To deploy an image from a private repository, you must <Link to={`/k8s/ns/${this.state.namespace || 'default'}/secrets/~new/image`}>create an image pull secret</Link> with your image registry credentials.
            </div>
          </div>
          <div className="co-image-name-results">
            {!isi && <div className="co-image-name-results__loading">
              {loading && <Loading className="co-m-loader--inline" />}
              {(!loading && !searchError) && <h2 className="h3 co-image-name-results__loading-heading">{/* Select an image stream tag or e*/}Enter an image name.</h2>}
              {(!loading && searchError) && <React.Fragment>
                <h2 className="h3 co-image-name-results__loading-heading">
                  <i className="pficon pficon-error-circle-o" aria-hidden="true"></i> Could not load image metadata.
                </h2>
                <p className="co-image-name-results__loading-error">{searchError}</p>
              </React.Fragment>}
            </div>}
            {isi && <React.Fragment>
              <div className="co-image-name-results__details">
                <div className="row">
                  <div className="col-sm-3 col-md-2 hidden-xs text-right h2">
                    <span className="fa fa-cube text-muted" style={{fontSize: '100px'}} aria-hidden="true"></span>
                  </div>
                  <div className="col-sm-9 col-md-10">
                    {runsAsRoot(isi.image) && <Alert isInline className="co-alert" variant="warning" title="Image runs as the root user">
                      Image <strong>{isi.name}</strong> runs as the <strong>root</strong> user which might not be permitted by your cluster administrator.
                    </Alert>}
                    <h2 className="co-image-name-results__heading co-break-word">
                      {isi.name}
                      <small>
                        {_.get(isi, 'result.ref.registry') && <span>from {isi.result.ref.registry}, </span>}
                        <React.Fragment><Timestamp timestamp={isi.image.dockerImageMetadata.Created} />, </React.Fragment>
                        {_.get(isi, 'image.dockerImageMetadata.Size') && <span>{units.humanize(isi.image.dockerImageMetadata.Size, 'binaryBytes', true).string}, </span>}
                        {_.size(isi.image.dockerImageLayers)} layers
                      </small>
                    </h2>
                    <ul>
                      {!isi.namespace && <li>Image Stream <strong>{name || '<name>'}:{isi.tag || 'latest'}</strong> will track this image.</li>}
                      <li>This image will be deployed in Deployment Config <strong>{name || '<name>'}</strong>.</li>
                      {ports && <li><ImagePorts ports={ports} name={name} /></li>}
                    </ul>
                    {!_.isEmpty(isi.image.dockerImageMetadata.Config.Volumes) && <p className="help-block">
                      This image declares volumes and will default to use non-persistent, host-local storage.
                      You can add persistent storage later to the deployment config.
                    </p>}
                  </div>
                </div>
                <div className="form-group co-deploy-image__name">
                  <label htmlFor="name" className="control-label co-required">Name</label>
                  <input className="form-control"
                    type="text"
                    onChange={this.onNameChange}
                    value={name}
                    id="name"
                    name="name"
                    required />
                  <div className="help-block">Identifies the resources created for this image.</div>
                </div>
              </div>
              <div className="form-group co-deploy-image__labels">
                <label htmlFor="tags-input" className="control-label">Labels</label>
                <SelectorInput labelClassName="co-text-deploymentconfig" onChange={this.onLabelsChange} tags={labels} />
                <div className="help-block" id="labels-help">
                  If no labels are specified, app={name || '<name>'} will be added.
                </div>
              </div>
              <div>
                <label>Environment Variables</label>
                <FieldLevelHelp content={
                  <div>Define environment variables as key-value pairs to store configuration settings. Drag and drop environment variables to change the order in which they are run. A variable can reference any other variables that come before it in the list, for example <code>FULLDOMAIN = $(SUBDOMAIN).example.com</code>.</div>} />
                <div>
                  <EnvironmentPage
                    envPath={['spec','template','spec','containers']}
                    readOnly={false}
                    onChange={this.onEnvironmentChange}
                    addConfigMapSecret={false}
                    useLoadingInline={true} />
                </div>
              </div>
            </React.Fragment>}
          </div>
          <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
            <button type="submit" className="btn btn-primary" disabled={!this.state.namespace || !this.state.imageName || !this.state.name}>Deploy</button>
            <Link to={formatNamespacedRouteForResource('deploymentconfigs')} className="btn btn-default">Cancel</Link>
          </ButtonBar>
        </form>
      </div>
    </React.Fragment>;
  }
}

export type DeployImageProps = {
  location: any;
};

export type DeployImageState = {
  namespace: string;
  imageName: string;
  inProgress: boolean;
  loading: boolean;
  isi?: any;
  name: string;
  labels: string[];
  error?: any;
  searchError?: string;
};
