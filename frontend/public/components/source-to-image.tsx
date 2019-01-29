/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import { LoadingBox, LoadError } from './utils/status-box';
import { Dropdown, Firehose, history, MsgBox, NsDropdown, ResourceName, ExternalLink } from './utils';
import { BuildConfigModel, DeploymentConfigModel, ImageStreamModel, ImageStreamTagModel, RouteModel, ServiceModel } from '../models';
import { ContainerPort, k8sCreate, k8sGet, K8sResourceKind } from '../module/k8s';
import { ImageStreamIcon } from './catalog/catalog-item-icon';
import { getAnnotationTags, getBuilderTagsSortedByVersion } from './image-stream';
import { ButtonBar } from './utils/button-bar';

const getSampleRepo = tag => _.get(tag, 'annotations.sampleRepo');
const getSampleRef = tag => _.get(tag, 'annotations.sampleRef');
const getSampleContextDir = tag => _.get(tag, 'annotations.sampleContextDir');

export const SourceToImageResourceDetails = () => <React.Fragment>
  <hr />
  <p>
    The following resources will be created:
  </p>
  <ul>
    <li>A <span className="co-catalog-item-details__kind-label">build config</span> to build source from a Git repository.</li>
    <li>An <span className="co-catalog-item-details__kind-label">image stream</span> to track built images.</li>
    <li>A <span className="co-catalog-item-details__kind-label">deployment config</span> to rollout new revisions when the image changes.</li>
    <li>A <span className="co-catalog-item-details__kind-label">service</span> to expose your workload inside the cluster.</li>
    <li>An optional <span className="co-catalog-item-details__kind-label">route</span> to expose your workload outside the cluster.</li>
  </ul>
</React.Fragment>;

// Transform image ports to k8s structure.
// `{ '3306/tcp': {} }` -> `{ containerPort: 3306, protocol: 'TCP' }`
const portsFromSpec = (portSpec: any): ContainerPort[] => {
  return _.reduce(portSpec, (result: ContainerPort[], value, key) => {
    const parts = key.split('/');
    if (parts.length === 1) {
      parts.push('tcp');
    }

    const containerPort = parseInt(parts[0], 10);
    if (_.isFinite(containerPort)) {
      result.push({
        containerPort,
        protocol: parts[1].toUpperCase(),
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn('Unrecognized image port format', key);
    }

    return result;
  }, []);
};

export const getPorts = (imageStreamImage: any): ContainerPort[] => {
  const portSpec = _.get(imageStreamImage, 'image.dockerImageMetadata.Config.ExposedPorts') ||
                   _.get(imageStreamImage, 'image.dockerImageMetadata.ContainerConfig.ExposedPorts');
  return portsFromSpec(portSpec);
};

// Use the same naming convention as the CLI.
const makePortName = (port: ContainerPort): string => `${port.containerPort}-${port.protocol}`.toLowerCase();

const ImageStreamInfo: React.SFC<ImageStreamInfoProps> = ({imageStream, tag}) => {
  const displayName = _.get(tag, ['annotations', 'openshift.io/display-name'], imageStream.metadata.name);
  const annotationTags = getAnnotationTags(tag);
  const description = _.get(tag, 'annotations.description');
  const sampleRepo = getSampleRepo(tag);

  return <div className="co-catalog-item-info">
    <div className="co-catalog-item-details">
      <ImageStreamIcon tag={tag} iconSize="large" />
      <div>
        <h2 className="co-section-heading co-catalog-item-details__name">{displayName}</h2>
        {annotationTags && <p className="co-catalog-item-details__tags">{_.map(annotationTags, (annotationTag, i) => <span className="co-catalog-item-details__tag" key={i}>{annotationTag}</span>)}</p>}
      </div>
    </div>
    {description && <p className="co-catalog-item-details__description">{description}</p>}
    {sampleRepo && <p>Sample repository: <ExternalLink href={sampleRepo} text={sampleRepo} /></p>}
    <SourceToImageResourceDetails />
  </div>;
};

class BuildSource extends React.Component<BuildSourceProps, BuildSourceState> {
  constructor(props) {
    super(props);

    const { preselectedNamespace: namespace = ''} = this.props;
    this.state = {
      tags: [],
      namespace,
      selectedTag: '',
      name: '',
      repository: '',
      ref: '',
      contextDir: '',
      createRoute: false,
      ports: [],
      inProgress: false,
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (_.isEmpty(props.obj.data)) {
      return null;
    }
    const previousTag = state.selectedTag;
    // Sort tags in reverse order by semver, falling back to a string comparison if not a valid version.
    const tags = getBuilderTagsSortedByVersion(props.obj.data);
    // Select the first tag if the current tag is missing or empty.
    const selectedTag = previousTag && _.includes(tags, previousTag)
      ? previousTag
      : _.get(_.head(tags), 'name');

    return {tags, selectedTag};
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedTag !== this.state.selectedTag) {
      this.getImageStreamImage();
    }
  }

  onNamespaceChange = (namespace: string) => {
    this.setState({namespace});
  }

  onTagChange = (selectedTag: any) => {
    this.setState({selectedTag}, this.getImageStreamImage);
  }

  onNameChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({name: event.currentTarget.value});
  }

  onRepositoryChange: React.ReactEventHandler<HTMLInputElement> = event => {
    // Reset ref and context dir if previously set from filling in a sample.
    this.setState({repository: event.currentTarget.value, ref: '', contextDir: ''});
  }

  onCreateRouteChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({createRoute: event.currentTarget.checked});
  }

  fillSample: React.ReactEventHandler<HTMLButtonElement> = event => {
    const { obj: { data: imageStream } } = this.props;
    const { name: currentName, selectedTag } = this.state;
    const tag = _.find(imageStream.spec.tags, { name: selectedTag });
    const repository = getSampleRepo(tag);
    const ref = getSampleRef(tag);
    const contextDir = getSampleContextDir(tag);
    const name = currentName || imageStream.metadata.name;
    this.setState({name, repository, ref, contextDir});
  }

  getImageStreamImage = () => {
    const { selectedTag } = this.state;
    if (!selectedTag) {
      return;
    }

    const { obj: { data: imageStream } } = this.props;
    const imageStreamTagName = `${imageStream.metadata.name}:${selectedTag}`;
    this.setState({inProgress: true});
    k8sGet(ImageStreamTagModel, imageStreamTagName, imageStream.metadata.namespace).then((imageStreamImage: K8sResourceKind) => {
      const ports = getPorts(imageStreamImage);
      this.setState({ports, inProgress: false});
    }, err => this.setState({error: err.message, inProgress: false}));
  }

  getLabels() {
    return { app: this.state.name };
  }

  getPodLabels() {
    const { name } = this.state;
    return {
      app: name,
      deploymentconfig: name,
    };
  }

  createImageStream(): Promise<K8sResourceKind> {
    const { name, namespace } = this.state;
    const labels = this.getLabels();
    const imageStream = {
      apiVersion: 'image.openshift.io/v1',
      kind: 'ImageStream',
      metadata: {
        name,
        namespace,
        labels,
      },
    };

    return k8sCreate(ImageStreamModel, imageStream);
  }

  createBuildConfig(): Promise<K8sResourceKind> {
    const { obj: { data: imageStream } } = this.props;
    const { name, namespace, repository, ref = 'master', contextDir, selectedTag } = this.state;
    const labels = this.getLabels();
    const buildConfig = {
      apiVersion: 'build.openshift.io/v1',
      kind: 'BuildConfig',
      metadata: {
        name,
        namespace,
        labels,
      },
      spec: {
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: `${name}:latest`,
          },
        },
        source: {
          git: {
            uri: repository,
            ref,
            contextDir,
            type: 'Git',
          },
        },
        strategy: {
          type: 'Source',
          sourceStrategy: {
            from: {
              kind: 'ImageStreamTag',
              name: `${imageStream.metadata.name}:${selectedTag}`,
              namespace: imageStream.metadata.namespace,
            },
          },
        },
        triggers: [{
          type: 'ImageChange',
          imageChange: {},
        }, {
          type: 'ConfigChange',
        }],
      },
    };

    return k8sCreate(BuildConfigModel, buildConfig);
  }

  createDeploymentConfig(): Promise<K8sResourceKind> {
    const { name, namespace, ports } = this.state;
    const labels = this.getLabels();
    const podLabels = this.getPodLabels();
    const deploymentConfig = {
      apiVersion: 'apps.openshift.io/v1',
      kind: 'DeploymentConfig',
      metadata: {
        name,
        namespace,
        labels,
      },
      spec: {
        selector: podLabels,
        replicas: 1,
        template: {
          metadata: {
            labels: podLabels,
          },
          spec: {
            containers: [{
              name,
              image: `${name}:latest`,
              ports,
              env: [],
            }],
          },
        },
        triggers: [{
          type: 'ImageChange',
          imageChangeParams: {
            automatic: true,
            containerNames: [
              name,
            ],
            from: {
              kind: 'ImageStreamTag',
              name: `${name}:latest`,
            },
          },
        }, {
          type: 'ConfigChange',
        }],
      },
    };

    return k8sCreate(DeploymentConfigModel, deploymentConfig);
  }

  createService(): Promise<K8sResourceKind> {
    const { name, namespace, ports } = this.state;
    const firstPort = _.head(ports);
    const labels = this.getLabels();
    const podLabels = this.getPodLabels();
    const service = {
      kind: 'Service',
      apiVersion: 'v1',
      metadata: {
        name,
        namespace,
        labels,
      },
      spec: {
        selector: podLabels,
        ports: [{
          port: firstPort.containerPort,
          targetPort: firstPort.containerPort,
          protocol: firstPort.protocol,
          // Use the same naming convention as the CLI.
          name: makePortName(firstPort),
        }],
      },
    };

    return k8sCreate(ServiceModel, service);
  }

  createRoute(): Promise<K8sResourceKind> {
    const { name, namespace, ports } = this.state;
    const firstPort = _.head(ports);
    const labels = this.getLabels();
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
          name,
        },
        // The service created by `createService` uses the same port as the container port.
        port: {
          // Use the port name, not the number for targetPort. The router looks
          // at endpoints, not services, when resolving ports, so port numbers
          // will not resolve correctly if the service port and container port
          // numbers don't match.
          targetPort: makePortName(firstPort),
        },
        wildcardPolicy: 'None',
      },
    };

    return k8sCreate(RouteModel, route);
  }

  handleError = err => {
    this.setState({error: this.state.error ? `${this.state.error}; ${err.message}` : err.message});
  }

  save = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    const { namespace, selectedTag, name, repository, createRoute, ports } = this.state;
    if (!name || !selectedTag || !namespace || !repository) {
      this.setState({error: 'Please complete all fields.'});
      return;
    }

    const requests = [
      this.createDeploymentConfig(),
      this.createImageStream(),
      this.createBuildConfig(),
    ];

    // Only create a service or route if the builder image has ports.
    if (!_.isEmpty(ports)) {
      requests.push(this.createService());
      if (createRoute) {
        requests.push(this.createRoute());
      }
    }

    requests.forEach(r => r.catch(this.handleError));
    this.setState({ inProgress: true, error: null });
    Promise.all(requests).then(() => {
      this.setState({inProgress: false});
      if (!this.state.error) {
        history.push(`/overview/ns/${this.state.namespace}`);
      }
    }).catch(() => this.setState({inProgress: false}));
  };

  render() {
    const { obj } = this.props;
    const { selectedTag, tags, ports } = this.state;
    if (obj.loadError) {
      return <LoadError message={obj.loadError.message} label="Image Stream" className="loading-box loading-box__errored" />;
    }

    if (!obj.loaded) {
      return <LoadingBox />;
    }

    const imageStream = obj.data;
    if (_.isEmpty(tags)) {
      return <MsgBox title="No Builder Tags" detail={`ImageStream ${imageStream.metadata.name} has no Source-to-Image builder tags.`} />;
    }

    const tag = _.find(imageStream.spec.tags, { name: selectedTag });
    const sampleRepo = getSampleRepo(tag);

    const tagOptions = {};
    _.each(tags, ({name}) => tagOptions[name] = <ResourceName kind="ImageStreamTag" name={`${imageStream.metadata.name}:${name}`} />);

    return <div className="row">
      <div className="col-md-7 col-md-push-5 co-catalog-item-info">
        <ImageStreamInfo imageStream={imageStream} tag={tag} />
      </div>
      <div className="col-md-5 col-md-pull-7">
        <form className="co-source-to-image-form" onSubmit={this.save}>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="namespace">Namespace</label>
            <NsDropdown selectedKey={this.state.namespace} onChange={this.onNamespaceChange} id="namespace" />
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="tag">Version</label>
            <Dropdown items={tagOptions} selectedKey={selectedTag} title={tagOptions[selectedTag]} onChange={this.onTagChange} id="tag" />
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="name">Name</label>
            <input className="form-control"
              type="text"
              onChange={this.onNameChange}
              value={this.state.name}
              id="name"
              aria-describedby="name-help"
              required />
            <div className="help-block" id="name-help">
              Names the resources created for this application.
            </div>
          </div>
          <div className="form-group">
            <label className="control-label co-required" htmlFor="repository">Git Repository</label>
            <input className="form-control"
              type="text"
              onChange={this.onRepositoryChange}
              value={this.state.repository}
              id="repository"
              required />
            {sampleRepo && <div className="help-block">
              <button type="button" className="btn btn-link btn-link--no-padding" onClick={this.fillSample}>
                Try Sample <i className="fa fa-level-up" aria-hidden="true" />
              </button>
            </div>}
            <div className="help-block">
              For private Git repositories,
              create a <Link to={`/k8s/ns/${this.state.namespace || 'default'}/secrets/new/source`}>source secret</Link>.
            </div>
          </div>
          {!_.isEmpty(ports) && <div className="form-group">
            <div className="checkbox">
              <label className="control-label">
                <input type="checkbox" onChange={this.onCreateRouteChange} checked={this.state.createRoute} aria-describedby="create-route-help" />
                Create route
              </label>
              <div className="help-block" id="create-route-help">Exposes your application at a public URL.</div>
            </div>
          </div>}
          <ButtonBar className="co-source-to-image-form__button-bar" errorMessage={this.state.error} inProgress={this.state.inProgress}>
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" className="btn btn-default" onClick={history.goBack}>Cancel</button>
          </ButtonBar>
        </form>
      </div>
    </div>;
  }
}

export const SourceToImagePage = (props) => {
  const title = 'Create Source-to-Image Application';
  const searchParams = new URLSearchParams(location.search);
  const imageStreamName = searchParams.get('imagestream');
  const imageStreamNamespace = searchParams.get('imagestream-ns');
  const preselectedNamespace = searchParams.get('preselected-ns');
  const resources = [
    {kind: 'ImageStream', name: imageStreamName, namespace: imageStreamNamespace, isList: false, prop: 'obj'},
  ];

  return <React.Fragment>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <div className="co-m-pane__body">
      <h1 className="co-m-pane__heading">{title}</h1>
      <Firehose resources={resources}>
        <BuildSource preselectedNamespace={preselectedNamespace} {...props} />
      </Firehose>
    </div>
  </React.Fragment>;
};

export type ImageStreamInfoProps = {
  imageStream: K8sResourceKind,
  tag: any,
};

export type BuildSourceProps = {
  obj: any,
  preselectedNamespace: string,
};

export type BuildSourceState = {
  tags: any[],
  namespace: string,
  selectedTag: string,
  name: string,
  repository: string,
  ref: string,
  contextDir: string,
  createRoute: boolean,
  ports: ContainerPort[],
  inProgress: boolean,
  error?: any,
};
