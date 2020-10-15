import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Base64 } from 'js-base64';
import { ActionGroup, Button } from '@patternfly/react-core';
import { pluralToKind } from './';
import { modelFor } from '@console/internal/module/k8s';
import { k8sCreate, k8sUpdate, referenceFor, K8sResourceKind } from '../../../module/k8s';
import {
  ButtonBar,
  history,
  resourceObjPath,
} from '../../utils';
import { ModalBody, ModalTitle, ModalSubmitFooter } from '../../factory/modal';
// import { AsyncComponent } from '../../utils/async';
// import { SecretModel } from '../../../models';


// withCommonForm returns SubForm which is a Higher Order Component for all the types of secret forms.
export const withCommonForm = (SubForm, params?: any, modal?: boolean) =>
  class FormComponent extends React.Component<CommonFormProps_, CommonFormState_> {
    constructor(props) {
      super(props);
      const existingData = _.pick(props.obj, ['metadata', 'type']);
      const kind = pluralToKind(params.plural);
      const defaultType = params.type || '';  // toDefaultType 대신 index.tsx에 plural에 따른 kind, type값 저장해야 겠음.
      const data = _.defaultsDeep({}, props.fixed, existingData, {
        apiVersion: 'v1',
        data: {},
        kind: kind,
        metadata: {
          name: '',
        },
        type: defaultType || ''
      })

      this.state = {
        // typeAbstraction: this.props.typeAbstraction,
        data,
        kind,
        inProgress: false,
        type: defaultType,
        stringData: _.mapValues(_.get(props.obj, 'data'), (value) => {
          return value ? Base64.decode(value) : '';
        }),
        disableForm: false,
      };
      this.onDataChanged = this.onDataChanged.bind(this);
      this.onNameChanged = this.onNameChanged.bind(this);
      this.onError = this.onError.bind(this);
      this.onFormDisable = this.onFormDisable.bind(this);
      this.save = this.save.bind(this);
    }
    onDataChanged(data) {
      this.setState({
        stringData: { ...data.stringData },
        type: data.type,
      });
    }
    onError(err) {
      this.setState({
        error: err,
        inProgress: false,
      });
    }
    onNameChanged(event) {
      const name = event.target.value;
      this.setState((state: CommonFormState_) => {
        const data = _.cloneDeep(state.data);
        data.metadata.name = name;
        return { data };
      });
    }
    onFormDisable(disable) {
      this.setState({
        disableForm: disable,
      });
    }
    save(e) {
      e.preventDefault();
      const { metadata } = this.state.data;
      let kindObj = modelFor(this.state.kind);
      this.setState({ inProgress: true });
      const newData = _.assign(
        {},
        this.state.data,
        { stringData: this.state.stringData },
        { type: this.state.type },
      );
      (this.props.isCreate
        ? k8sCreate(kindObj, newData)
        : k8sUpdate(kindObj, newData, metadata.namespace, newData.metadata.name)
      ).then(
        (data) => {
          this.setState({ inProgress: false });
          if (this.props.onSave) {
            this.props.onSave(data.metadata.name);
          }
          if (!modal) {
            history.push(resourceObjPath(data, referenceFor(data)));
          }
        },
        (err) => this.setState({ error: err.message, inProgress: false }),
      );
    }


    renderBody = () => {
      return (
        <>
          <fieldset disabled={!this.props.isCreate}>
            <div className="form-group">
              <label className="control-label co-required" htmlFor="secret-name">
                Name
              </label>
              <div>
                <input
                  className="pf-c-form-control"
                  type="text"
                  onChange={this.onNameChanged}
                  value={this.state.data.metadata.name}
                  aria-describedby="secret-name-help"
                  id="secret-name"
                  required
                />
                <p className="help-block" id="secret-name-help">
                  Unique name.
                </p>

    const onClick = methods.handleSubmit((data) => {
      let inDo = _.defaultsDeep(props.fixed, data);
      inDo = props.onSubmitCallback(inDo);
      k8sCreate(modelFor(kind), inDo)
      history.push(resourceObjPath(inDo, referenceFor(modelFor(kind))));
    })
    return (
      <FormProvider {...methods} >
        <div className="co-m-pane__body">
          <Helmet>
            <title>{title}</title>
          </Helmet>
          <form
            className="co-m-pane__body-group co-create-secret-form co-m-pane__form">
            <h1 className="co-m-pane__heading">{title}</h1>
            <p className="co-m-pane__explanation">{props.explanation}</p>
            <fieldset>
              <div className="form-group">
                <label className="control-label co-required" htmlFor="name">Name</label>
                <input className="pf-c-form-control" id='name' name='metadata.name' ref={methods.register} />

              </div>
            </div>
          </fieldset>
          <SubForm
            onChange={this.onDataChanged}
            onError={this.onError}
            onFormDisable={this.onFormDisable}
            stringData={this.state.stringData}
            // secretType={this.state.data.type}
            isCreate={this.props.isCreate}
          />
        </>
      );
    };

    render() {
      // const { secretTypeAbstraction } = this.state;
      const { onCancel = history.goBack } = this.props;
      const title = `${this.props.titleVerb} ${this.state.type} ${this.state.kind}`;  // titleVerb + type + kind
      return modal ? (
        <form className="co-create-secret-form modal-content" onSubmit={this.save}>
          <ModalTitle>{title}</ModalTitle>
          <ModalBody>{this.renderBody()}</ModalBody>
          <ModalSubmitFooter
            errorMessage={this.state.error || ''}
            inProgress={this.state.inProgress}
            submitText="Create"
            cancel={this.props.onCancel}
          />
        </form>
      ) : (
          <div className="co-m-pane__body">
            <Helmet>
              <title>{title}</title>
            </Helmet>
            <form
              className="co-m-pane__body-group co-create-secret-form co-m-pane__form"
              onSubmit={this.save}
            >
              <h1 className="co-m-pane__heading">{title}</h1>
              <p className="co-m-pane__explanation">{this.props.explanation}</p>
              {this.renderBody()}
              <ButtonBar errorMessage={this.state.error} inProgress={this.state.inProgress}>
                <ActionGroup className="pf-c-form">
                  <Button
                    type="submit"
                    isDisabled={this.state.disableForm}
                    variant="primary"
                    id="save-changes"
                  >
                    {this.props.saveButtonText || 'Create'}
                  </Button>
                  <Button type="button" variant="secondary" id="cancel" onClick={onCancel}>
                    Cancel
                </Button>
                </ActionGroup>
              </ButtonBar>
            </form>
          </div>
        );
    }
  };

type CommonFormState_ = {
  inProgress: boolean;
  kind: string;
  type?: string;
  data: K8sResourceKind;
  stringData: {
    [key: string]: string;
  };
  error?: any;
  disableForm: boolean;
};

type CommonFormProps_ = {
  obj?: K8sResourceKind;
  type: string;
  plural: string;
  fixed: any;
  kind?: string;
  isCreate: boolean;
  titleVerb: string;
  saveButtonText?: string;
  explanation?: string;
  onCancel?: () => void;
  onSave?: (name: string) => void;
};
