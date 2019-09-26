import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { ActionGroup, Button } from '@patternfly/react-core';
import { IChangeEvent, ISubmitEvent } from 'react-jsonschema-form';
import { JSONSchema6 } from 'json-schema';

import { LoadingBox } from '../utils/status-box';
import { ServiceInstanceModel, ServiceBindingModel, ClusterServicePlanModel } from '../../models';
import { k8sCreate, K8sResourceKind, referenceForModel } from '../../module/k8s';
import { ButtonBar } from '../utils/button-bar';
import {
  createParametersSecret,
  getBindingCreateSchema,
  getBindingParametersForm,
  getUISchema,
  ServiceCatalogParametersForm,
} from './schema-form';
import {
  Firehose,
  history,
  PageHeading,
  resourcePathFromModel,
} from '../utils';

const PARAMETERS_SECRET_KEY = 'parameters';

const BindingParametersForm: React.SFC<BindingParametersFormProps> = ({plan, ...rest}) => {
  if (!plan.loaded) {
    return <LoadingBox />;
  }

  const schema: JSONSchema6 = getBindingCreateSchema(plan.data);
  const parametersForm = getBindingParametersForm(plan.data);
  const uiSchema = getUISchema(parametersForm);
  return <ServiceCatalogParametersForm schema={schema} uiSchema={uiSchema} {...rest} />;
};

const BindingParameters: React.SFC<BindingParametersProps> = props => {
  const planName = _.get(props.instance, 'spec.clusterServicePlanRef.name');
  if (!planName) {
    return null;
  }

  const resources = [
    {kind: referenceForModel(ClusterServicePlanModel), name: planName, prop: 'plan'},
  ];
  return <Firehose resources={resources}>
    <BindingParametersForm {...props as any} />
  </Firehose>;
};

class CreateBindingForm extends React.Component<CreateBindingProps, CreateBindingState> {
  constructor(props) {
    super(props);

    this.state = {
      name: props.match.params.name,
      formData: {},
      inProgress: false,
    };
  }

  onNameChange: React.ReactEventHandler<HTMLInputElement> = event => {
    this.setState({name: event.currentTarget.value});
  }

  createBinding = (secretName: string): Promise<K8sResourceKind> => {
    const parametersFrom = secretName ? [{ secretKeyRef: { name: secretName, key: PARAMETERS_SECRET_KEY } }] : [];
    const serviceBinding = {
      apiVersion: 'servicecatalog.k8s.io/v1beta1',
      kind: 'ServiceBinding',
      metadata: {
        name: this.state.name,
        namespace: _.get(this.props.obj, 'data.metadata.namespace'),
      },
      spec: {
        instanceRef: {
          name: _.get(this.props.obj, 'data.metadata.name'),
        },
        parametersFrom,
      },
    };

    return k8sCreate(ServiceBindingModel, serviceBinding);
  }

  onFormChange = ({formData}: IChangeEvent) => this.setState({formData})

  save = ({formData}: ISubmitEvent<any>) => {
    const { name: bindingName } = this.state;
    if (!bindingName) {
      this.setState({error: 'Please complete all fields.'});
      return;
    }
    this.setState({inProgress: true});
    const secretName = _.isEmpty(formData) ? null : `${bindingName}-bind-parameters`;
    this.createBinding(secretName)
      .then(binding => secretName ? createParametersSecret(secretName, PARAMETERS_SECRET_KEY, formData, binding) : null)
      .then(() => {
        this.setState({inProgress: false});
        const instance = this.props.obj.data;
        history.push(resourcePathFromModel(ServiceBindingModel, bindingName, instance.metadata.namespace));
      }, err => this.setState({error: err.message, inProgress: false}));
  };


  render() {
    const { obj, match } = this.props;
    const { name, formData, inProgress, error } = this.state;
    const serviceInstance = _.get(obj, 'data');
    const title = 'Create Service Binding';

    if (!obj.loaded) {
      return <LoadingBox />;
    }

    return <React.Fragment>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading
        title={title}
        obj={obj}
        breadcrumbsFor={() => [
          {name: serviceInstance.metadata.name, path: resourcePathFromModel(ServiceInstanceModel, serviceInstance.metadata.name, serviceInstance.metadata.namespace)},
          {name: `${title}`, path: `${match.url}`},
        ]}
      />
      <div className="co-m-pane__body">
        <p className="co-m-pane__explanation">Service bindings create a secret containing the necessary information for an application to use a service.</p>
        <div className="row">
          <div className="col-md-5">
            <p>Create a binding for <strong>{serviceInstance.metadata.name}</strong> in <strong>{serviceInstance.metadata.namespace}</strong>.</p>
            <form className="co-create-service-binding co-m-pane__form">
              <div className="form-group co-create-service-binding__name">
                <label className="control-label co-required" htmlFor="name">Service Binding Name</label>
                <input className="pf-c-form-control"
                  type="text"
                  onChange={this.onNameChange}
                  value={name}
                  id="name"
                  required />
              </div>
            </form>
            <BindingParameters instance={serviceInstance} onSubmit={this.save} formData={formData} onChange={this.onFormChange}>
              <ButtonBar errorMessage={error} inProgress={inProgress}>
                <ActionGroup className="pf-c-form">
                  <Button
                    type="submit"
                    variant="primary">
                    Create
                  </Button>
                  <Button
                    type="button"
                    id="cancel"
                    onClick={history.goBack}
                    variant="secondary">
                    Cancel
                  </Button>
                </ActionGroup>
              </ButtonBar>
            </BindingParameters>
          </div>
        </div>
      </div>
    </React.Fragment>;
  }
}

export const CreateBindingPage: React.SFC<CreateBindingPageProps> = (props) => {
  const resources = [
    {kind: referenceForModel(ServiceInstanceModel), name: props.match.params.name, namespace: props.match.params.ns, isList: false, prop: 'obj'},
  ];
  return <Firehose resources={resources}>
    <CreateBindingForm {...props as any} />
  </Firehose>;
};

export type BindingParametersFormProps = {
  plan: any,
  formData: any,
  onChange: (e: IChangeEvent) => void,
  onSubmit: (e: ISubmitEvent<any>) => void,
};

export type BindingParametersProps = {
  instance: any,
  formData: any,
  onChange: (e: IChangeEvent) => void,
  onSubmit: (e: ISubmitEvent<any>) => void,
};

export type CreateBindingProps = {
  obj: any,
  match: any,
};

export type CreateBindingState = {
  name: string,
  formData: any,
  inProgress: boolean,
  error?: any,
};

export type CreateBindingPageProps = {
  match: any,
};
