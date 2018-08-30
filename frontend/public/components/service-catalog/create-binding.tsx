/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import { LoadingBox } from '../utils/status-box';
import { history, Firehose, NavTitle, resourcePathFromModel } from '../utils';
import { ServiceInstanceModel, ServiceBindingModel } from '../../models';
import { k8sCreate } from '../../module/k8s';
import { ButtonBar } from '../utils/button-bar';

class CreateBindingForm extends React.Component<CreateBindingFormProps, CreateBindingFormState> {
  constructor (props) {
    super(props);

    this.state = {
      name: '',
      inProgress: false,
    };

    this.onNameChange = this.onNameChange.bind(this);
    this.save = this.save.bind(this);
  }

  static getDerivedStateFromProps(props: CreateBindingFormProps, state: CreateBindingFormState) {
    const { name } = state;
    const { obj } = props;

    const defaultName = _.get(obj, 'data.metadata.name');
    if (!name && defaultName) {
      return { name: defaultName };
    }

    return null;
  }

  onNameChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({name: event.currentTarget.value});
  }

  save = (e) => {
    e.preventDefault();
    if (!this.state.name) {
      this.setState({error: 'Please complete all fields.'});
      return;
    }
    this.setState({inProgress: true});
    const newServiceBinding = {
      apiVersion: 'servicecatalog.k8s.io/v1beta1',
      kind: 'ServiceBinding',
      metadata: {
        name: this.state.name,
        namespace: _.get(this.props.obj, 'data.metadata.namespace'),
      },
      spec: {
        instanceRef: {
          name: _.get(this.props.obj, 'data.metadata.name'),
        }
      },
    };
    k8sCreate(ServiceBindingModel, newServiceBinding).then(() => {
      this.setState({inProgress: false});
      history.push(resourcePathFromModel(ServiceInstanceModel, newServiceBinding.spec.instanceRef.name, newServiceBinding.metadata.namespace));
    }, err => this.setState({error: err.message, inProgress: false}));
  };

  render() {
    const { obj, match } = this.props;
    const serviceInstance = _.get(obj, 'data');
    const title = 'Create Binding';

    if (!obj.loaded) {
      return <LoadingBox />;
    }

    return <React.Fragment>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <NavTitle
        title={title}
        obj={obj}
        breadcrumbsFor={() => [
          {name: serviceInstance.metadata.name, path: resourcePathFromModel(ServiceInstanceModel, serviceInstance.metadata.name, serviceInstance.metadata.namespace)},
          {name: `${title}`, path: `${match.url}`}
        ]}
      />
      <div className="co-m-pane__body">
        <p className="co-m-pane__explanation">Bindings create a secret containing the necessary information for an application to use a service.</p>
        <div className="row">
          <div className="col-md-5">
            <p>Create a binding for <strong>{serviceInstance.metadata.name}</strong> in <strong>{serviceInstance.metadata.namespace}</strong>.</p>
            <form className="co-create-service-binding" onSubmit={this.save}>
              <div className="form-group co-create-service-binding__name">
                <label className="control-label" htmlFor="name">Service Binding Name</label>
                <input className="form-control"
                  type="text"
                  onChange={this.onNameChange}
                  value={this.state.name}
                  id="name"
                  required />
              </div>
              <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
                <button type="submit" className="btn btn-primary">Create</button>
                <Link to={resourcePathFromModel(ServiceInstanceModel, serviceInstance.metadata.name, serviceInstance.metadata.namespace)} className="btn btn-default">Cancel</Link>
              </ButtonBar>
            </form>
          </div>
        </div>
      </div>
    </React.Fragment>;
  }
}

export const CreateBinding = (props) => {
  const resources = [
    {kind: 'ServiceInstance', name: props.match.params.name, namespace: props.match.params.ns, isList: false, prop: 'obj'},
  ];
  return <Firehose resources={resources}>
    <CreateBindingForm {...props} />
  </Firehose>;
};

export type CreateBindingFormProps = {
  obj: any,
  match: any,
};

export type CreateBindingFormState = {
  name: string,
  inProgress: boolean,
  error?: any,
};
