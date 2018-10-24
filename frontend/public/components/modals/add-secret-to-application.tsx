/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { k8sList } from '../../module/k8s';
import { DeploymentModel, DeploymentConfigModel, StatefulSetModel } from '../../models';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { Dropdown, ResourceName } from '../utils';
import { RadioInput } from '../radio';

const applicationResourceModels = [ DeploymentModel, DeploymentConfigModel, StatefulSetModel ];

export class AddSecretToApplicationModal extends React.Component {
  public state: AddSecretToApplicationModalState;

  constructor(public props: AddSecretToApplicationModalProps) {
    super(props);
    this.state = {
      inProgress: false,
      errorMessage: '',
      applicationOptions: {},
      applicationsByUID: {},
      addAs: 'envvars',
      prefix: '',
      mountpath: '',
    }
  }

  componentDidMount() {
    const { namespace } = this.props;
    const opts = { ns: namespace };
    Promise.all(applicationResourceModels.map(model => {
      const { kind } = model;
      return k8sList(model, opts).then(res => res.map(item => ({ ...item, kind })));
    })).then(applications => {
      const allItems = _.flatten(applications);
      const applicationsByUID = _.keyBy(allItems, 'metadata.uid');
      const applicationOptions = _.reduce(allItems, (options, item) => {
        const { name, uid } = item.metadata;
        options[uid] = <ResourceName kind={item.kind} name={name} />;
        return options;
      }, {});
      this.setState({applicationOptions, applicationsByUID});
    });
  }

  private onApplicationChange = event => {
    console.log('app change');
    console.log('event', event);
  }

  private handleChange = event => {
    const { name, value } = event.currentTarget;
    this.setState({
      [name]: value
    } as any);
  }

  private onAddAsChange = event => {
    this.setState({
      addAs: event.currentTarget.value,
    });
  }

  private submit = event => {
    event.preventDefault();

    const { secretName, namespace } = this.props;
    console.log('secretName', secretName);
    console.log('namespace', namespace);

  }

  render() {
    const { addAs, applicationOptions } = this.state;
    const addAsEnvVars = addAs === 'envvars' ? true : false;
    const addAsVolume = addAs === 'volume' ? true : false;

    return <form onSubmit={this.submit} name="co-add-secret-to-app" className="co-add-secret-to-app">
      <ModalTitle>Add Secret to Application</ModalTitle>
      <ModalBody>
        <div className="form-group">
          <label className="control-label co-required" htmlFor="co-add-secret-to-app__application">Add this secret to application</label>
          <Dropdown items={applicationOptions} selectedKey={''} title={'Select an application'} onChange={this.onApplicationChange} id="co-add-secret-to-app__application" />
        </div>
        <fieldset>
          <legend className="co-legend co-required">Add secret as</legend>
          <RadioInput title="Enviroment Variables" name="co-add-secret-to-app__add-as" id="co-add-secret-to-app__envvars" value="envvars" onChange={this.onAddAsChange} checked={addAsEnvVars} />
          {addAsEnvVars && <div className="co-m-radio-desc">
            <div className="form-group">
              <label htmlFor="co-add-secret-to-app__prefix">Prefix</label>
              <input className="form-control"
                name="prefix"
                id="co-add-secret-to-app__prefix"
                placeholder="(optional)"
                type="text"
                onChange={this.handleChange} />
            </div>
          </div>}
          <RadioInput title="Volume" name="co-add-secret-to-app__add-as" id="co-add-secret-to-app__volume" value="volume" onChange={this.onAddAsChange} checked={addAsVolume} />
          {addAsVolume && <div className="co-m-radio-desc">
            <div className="form-group">
              <label htmlFor="co-add-secret-to-app__mountpath" className="co-required">Mount Path</label>
              <input className="form-control"
                name="mountpath"
                id="co-add-secret-to-app__mountpath"
                type="text"
                onChange={this.handleChange} />
            </div>
          </div>}
        </fieldset>
      </ModalBody>
      <ModalSubmitFooter errorMessage={this.state.errorMessage} inProgress={this.state.inProgress} submitText="Save" cancel={this.props.cancel.bind(this)} />
    </form>;
  }
}

export const configureAddSecretToApplicationModal = createModalLauncher<AddSecretToApplicationModalProps>(AddSecretToApplicationModal);

export type AddSecretToApplicationModalProps = {
  cancel: (e: Event) => void;
  close: () => void;
  secretName: string;
  namespace: string;
};

export type AddSecretToApplicationModalState = {
  inProgress: boolean;
  errorMessage: string;
  applicationOptions: any;
  applicationsByUID: any;
  addAs: string;
  prefix: string;
  mountpath: string;
};
