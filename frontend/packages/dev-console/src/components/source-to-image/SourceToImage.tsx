import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { LoadingBox, LoadError } from '@console/internal/components/utils/status-box';
import {
  Dropdown,
  history,
  MsgBox,
  NsDropdown,
  ResourceName,
} from '@console/internal/components/utils';
import { ImageStreamTagModel } from '@console/internal/models';
import { ContainerPort, k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { getBuilderTagsSortedByVersion } from '@console/internal/components/image-stream';
import { ButtonBar } from '@console/internal/components/utils/button-bar';
import { getActivePerspective } from '@console/internal/reducers/ui';
import {
  getPorts,
  getSampleRepo,
  getSampleRef,
  getSampleContextDir,
  getTagDataWithDisplayName,
} from '../../utils/imagestream-utils';
import ImageStreamInfo from './ImageStreamInfo';
import {
  createDeploymentConfig,
  createImageStream,
  createBuildConfig,
  createService,
  createRoute,
} from '../../utils/create-resource-utils';
import AppNameSelector from '../dropdown/AppNameSelector';
import SourceToImageResourceDetails from './SourceToImageResourceDetails';

const mapBuildSourceStateToProps = (state) => {
  return {
    activePerspective: getActivePerspective(state),
  };
};

class BuildSource extends React.Component<
  BuildSourceStateProps & BuildSourceProps,
  BuildSourceState
> {
  constructor(props) {
    super(props);

    const { preselectedNamespace: namespace = '' } = this.props;
    this.state = {
      tags: [],
      namespace,
      application: '',
      selectedApplicationKey: '',
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
    const selectedTag =
      previousTag && _.includes(tags, previousTag) ? previousTag : _.get(_.head(tags), 'name');

    return { tags, selectedTag };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedTag !== this.state.selectedTag) {
      this.getImageStreamImage();
    }
  }

  onNamespaceChange = (namespace: string) => {
    this.setState({ namespace });
  };

  onApplicationChange = (application: string, selectedKey: string) => {
    this.setState({ application, selectedApplicationKey: selectedKey });
  };

  onTagChange = (selectedTag: any) => {
    this.setState({ selectedTag }, this.getImageStreamImage);
  };

  onNameChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ name: event.currentTarget.value });
  };

  onRepositoryChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    // Reset ref and context dir if previously set from filling in a sample.
    this.setState({ repository: event.currentTarget.value, ref: '', contextDir: '' });
  };

  onCreateRouteChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    this.setState({ createRoute: event.currentTarget.checked });
  };

  fillSample: React.ReactEventHandler<HTMLButtonElement> = () => {
    const {
      obj: { data: imageStream },
    } = this.props;
    const { name: currentName, selectedTag } = this.state;
    const tag = _.find(imageStream.spec.tags, { name: selectedTag });
    const repository = getSampleRepo(tag);
    const ref = getSampleRef(tag);
    const contextDir = getSampleContextDir(tag);
    const name = currentName || imageStream.metadata.name;
    this.setState({ name, repository, ref, contextDir });
  };

  getImageStreamImage = () => {
    const { selectedTag } = this.state;
    if (!selectedTag) {
      return;
    }

    const {
      obj: { data: imageStream },
    } = this.props;
    const imageStreamTagName = `${imageStream.metadata.name}:${selectedTag}`;
    this.setState({ inProgress: true });
    k8sGet(ImageStreamTagModel, imageStreamTagName, imageStream.metadata.namespace)
      .then((imageStreamImage: K8sResourceKind) => {
        const ports = getPorts(imageStreamImage);
        this.setState({ ports, inProgress: false });
        return null;
      })
      .catch((err) => this.setState({ error: err.message, inProgress: false }));
  };

  handleError = (err) => {
    this.setState((state) => ({
      error: state.error ? `${state.error}; ${err.message}` : err.message,
    }));
  };

  save = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    const {
      activePerspective,
      obj: { data: imageStream },
    } = this.props;
    const {
      name,
      namespace,
      application,
      selectedTag,
      repository,
      createRoute: canCreateRoute,
      ports,
      ref,
      contextDir,
    } = this.state;
    if (!name || !selectedTag || !namespace || !application || !repository) {
      this.setState({ error: 'Please complete all required fields.' });
      return;
    }

    const requests = [
      createDeploymentConfig(name, namespace, application, ports, imageStream),
      createImageStream(name, namespace, application, imageStream),
      createBuildConfig(
        name,
        namespace,
        application,
        repository,
        ref,
        contextDir,
        selectedTag,
        imageStream,
      ),
    ];

    // Only create a service or route if the builder image has ports.
    if (!_.isEmpty(ports)) {
      requests.push(createService(name, namespace, application, ports, imageStream));
      if (canCreateRoute) {
        requests.push(createRoute(name, namespace, application, ports, imageStream));
      }
    }

    requests.forEach((r) => r.catch(this.handleError));
    this.setState({ inProgress: true, error: null });
    Promise.all(requests)
      .then(() => {
        this.setState({ inProgress: false });
        if (!this.state.error) {
          switch (activePerspective) {
            case 'dev':
              history.push(`/dev/topology/ns/${this.state.namespace}`);
              break;
            default:
              history.push(`/k8s/cluster/projects/${this.state.namespace}/workloads`);
          }
        }
      })
      .catch(() => this.setState({ inProgress: false }));
  };

  render() {
    const { obj } = this.props;
    const { selectedTag, tags, ports } = this.state;
    if (obj.loadError) {
      return (
        <LoadError
          message={obj.loadError.message}
          label="Image Stream"
          className="loading-box loading-box__errored"
        />
      );
    }

    if (!obj.loaded) {
      return <LoadingBox />;
    }

    const imageStream = obj.data;
    if (_.isEmpty(tags)) {
      return (
        <MsgBox
          title="No Builder Tags"
          detail={`ImageStream ${imageStream.metadata.name} has no Source-to-Image builder tags.`}
        />
      );
    }

    const [tag, displayName] = getTagDataWithDisplayName(
      imageStream.spec.tags,
      selectedTag,
      imageStream.metadata.name,
    );
    const sampleRepo = getSampleRepo(tag);

    const tagOptions = {};
    _.each(
      tags,
      ({ name }) =>
        (tagOptions[name] = (
          <ResourceName kind="ImageStreamTag" name={`${imageStream.metadata.name}:${name}`} />
        )),
    );
    return (
      <div className="row">
        <div className="col-md-7 col-md-push-5 co-catalog-item-info">
          <ImageStreamInfo displayName={displayName} tag={tag} />
          <SourceToImageResourceDetails />
        </div>
        <div className="col-md-5 col-md-pull-7">
          <form className="co-source-to-image-form" onSubmit={this.save}>
            <div className="form-group">
              <label className="control-label co-required" htmlFor="namespace">
                Namespace
              </label>
              <NsDropdown
                selectedKey={this.state.namespace}
                onChange={this.onNamespaceChange}
                id="namespace"
              />
            </div>
            <AppNameSelector
              namespace={this.state.namespace}
              application={this.state.application}
              selectedKey={this.state.selectedApplicationKey}
              onChange={this.onApplicationChange}
            />
            <div className="form-group">
              <label className="control-label co-required" htmlFor="tag">
                Version
              </label>
              <Dropdown
                items={tagOptions}
                selectedKey={selectedTag}
                title={tagOptions[selectedTag]}
                onChange={this.onTagChange}
                id="tag"
              />
            </div>
            <div className="form-group">
              <label className="control-label co-required" htmlFor="name">
                Name
              </label>
              <input
                className="form-control"
                type="text"
                onChange={this.onNameChange}
                value={this.state.name}
                id="name"
                aria-describedby="name-help"
                required
              />
              <div className="help-block" id="name-help">
                Names the resources created for this application.
              </div>
            </div>
            <div className="form-group">
              <label className="control-label co-required" htmlFor="repository">
                Git Repository
              </label>
              <input
                className="form-control"
                type="text"
                onChange={this.onRepositoryChange}
                value={this.state.repository}
                id="repository"
                required
              />
              {sampleRepo && (
                <div className="help-block">
                  <button
                    type="button"
                    className="btn btn-link btn-link--no-padding"
                    onClick={this.fillSample}
                  >
                    Try Sample <i className="fa fa-level-up" aria-hidden="true" />
                  </button>
                </div>
              )}
              <div className="help-block">
                For private Git repositories, create a{' '}
                <Link to={`/k8s/ns/${this.state.namespace || 'default'}/secrets/new/source`}>
                  source secret
                </Link>
                .
              </div>
            </div>
            {!_.isEmpty(ports) && (
              <div className="form-group">
                <div className="checkbox">
                  <label className="control-label">
                    <input
                      type="checkbox"
                      onChange={this.onCreateRouteChange}
                      checked={this.state.createRoute}
                      aria-describedby="create-route-help"
                    />
                    Create route
                  </label>
                  <div className="help-block" id="create-route-help">
                    Exposes your application at a public URL.
                  </div>
                </div>
              </div>
            )}
            <ButtonBar
              className="co-source-to-image-form__button-bar"
              errorMessage={this.state.error}
              inProgress={this.state.inProgress}
            >
              <button type="submit" className="btn btn-primary">
                Create
              </button>
              <button type="button" className="btn btn-default" onClick={history.goBack}>
                Cancel
              </button>
            </ButtonBar>
          </form>
        </div>
      </div>
    );
  }
}

export default connect<BuildSourceStateProps, {}, BuildSourceProps>(mapBuildSourceStateToProps)(
  BuildSource,
);

export type BuildSourceProps = {
  obj?: any;
  preselectedNamespace: string;
};

export type BuildSourceState = {
  tags: any;
  namespace: string;
  application: string;
  selectedApplicationKey: string;
  selectedTag: string;
  name: string;
  repository: string;
  ref: string;
  contextDir: string;
  createRoute: boolean;
  ports: ContainerPort[];
  inProgress: boolean;
  error?: string;
};

interface BuildSourceStateProps {
  activePerspective: string;
}
