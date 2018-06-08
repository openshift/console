/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Field, reduxForm, getFormValues } from 'redux-form';

import store from '../../../redux';
import { ClusterServiceVersionResourceKind } from '../index';
import { PromiseComponent } from '../../utils';
import { k8sUpdate, referenceFor } from '../../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../../factory/modal';

export class ResourceRequirementsModal extends PromiseComponent {
  props: ResourceRequirementsModalProps;

  private submit(e) {
    e.preventDefault();

    const {Form, obj, cancel, type, path} = this.props;
    const formData = getFormValues(Form.formName)(store.getState());
    let newObj = _.cloneDeep(obj);
    _.set(newObj, `spec.${path}.${type}`, formData);
    const k8sModel = store.getState().k8s.getIn(['RESOURCES', 'models', referenceFor(obj)]);

    this.handlePromise(k8sUpdate(k8sModel, newObj)).then(cancel);
  }

  render() {
    return <form onSubmit={e => this.submit(e)}>
      <ModalTitle>{this.props.title}</ModalTitle>
      <ModalBody>
        <div className="row co-m-form-row">
          <div className="col-sm-12">{this.props.description}</div>
        </div>
        <div className="row co-m-form-row">
          <this.props.Form handleSubmit={this.submit} />
        </div>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Save Changes" cancel={e => this.props.cancel(e)} />
    </form>;
  }
}

export const ResourceRequirementsModalLink: React.SFC<ResourceRequirementsModalLinkProps> = (props) => {
  const {obj, type, path, onChange} = props;
  const {cpu, memory} = _.get(obj.spec, `${path}.${type}`, {cpu: null, memory: null});

  const onClick = () => {
    const modal = createModalLauncher(modalProps => <ResourceRequirementsModal {...modalProps} cancel={(e) => onChange().then(() => modalProps.cancel(e))} />);
    const description = `Define the ${type === 'limits' ? 'resource' : 'request'} limits for this ${obj.kind} instance.`;
    const title = `${obj.kind} ${type === 'limits' ? 'Resource' : 'Request'} Limits`;

    const ResourceRequirementsForm = () => <div>
      <div className="col-xs-5">
        <label style={{fontWeight: 300}} className="text-muted text-uppercase" htmlFor="cpu">CPU cores</label>
        <Field name="cpu" component="input" type="text" className="form-control" style={{width: 150}} autoFocus placeholder="500m" />
      </div>
      <div className="col-xs-5">
        <label style={{fontWeight: 300}} className="text-muted text-uppercase" htmlFor="memory">Memory</label>
        <Field name="memory" component="input" type="text" className="form-control" style={{width: 150}} placeholder="50Mi" />
      </div>
    </div>;
    const Form = reduxForm({form: 'ResourceRequirements', initialValues: {cpu, memory}})(ResourceRequirementsForm);
    Form.formName = 'ResourceRequirements';

    return modal({title, description, obj, Form, type, path});
  };

  return <a className="co-m-modal-link" onClick={onClick}>{`CPU: ${cpu || 'none'}, Memory: ${memory || 'none'}`}</a>;
};

export type ResourceRequirementsModalProps = {
  Form: React.ComponentType<any> & {formName: string};
  title: string;
  description: string;
  obj: ClusterServiceVersionResourceKind;
  type: 'requests' | 'limits';
  path: string;
  cancel: (error: any) => void;
};

export type ResourceRequirementsModalLinkProps = {
  obj: ClusterServiceVersionResourceKind;
  type: 'requests' | 'limits';
  path: string;
  onChange: () => Promise<any>;
};

ResourceRequirementsModalLink.displayName = 'ResourceRequirementsModalLink';
