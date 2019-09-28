import * as React from 'react';
import { Base64 } from 'js-base64';
import { safeDump } from 'js-yaml';
import * as _ from 'lodash-es';

import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { k8sPatch, K8sResourceKind } from '../../module/k8s';
import { SecretModel } from '../../models';

export const AlertRoutingModal: React.FC<AlertRoutingModalProps> = ({
  config,
  secret,
  cancel,
  close,
}) => {
  const [errorMessage, setErrorMessage] = React.useState();
  const [inProgress, setInProgress] = React.useState(false);

  const submit = (event): void => {
    event.preventDefault();
    const configObj = _.cloneDeep(config);
    _.set(
      configObj,
      ['route', 'group_by'],
      event.target.elements['input-group-by'].value.split(','),
    );
    _.set(configObj, ['route', 'group_wait'], event.target.elements['input-group-wait'].value);
    _.set(
      configObj,
      ['route', 'group_interval'],
      event.target.elements['input-group-interval'].value,
    );
    _.set(
      configObj,
      ['route', 'repeat_interval'],
      event.target.elements['input-repeat-interval'].value,
    );

    let yamlStringData = '';

    try {
      yamlStringData = safeDump(configObj);
    } catch (e) {
      setErrorMessage(`Error getting YAML: ${e}`);
      return;
    }
    setInProgress(true);
    k8sPatch(SecretModel, secret, [
      { op: 'replace', path: '/data/alertmanager.yaml', value: Base64.encode(yamlStringData) },
    ]).then(close, (err) => {
      setErrorMessage(err.message);
      setInProgress(false);
    });
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content">
      <ModalTitle className="modal-header">Edit Routing Configuration</ModalTitle>
      <ModalBody>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label htmlFor="group-by" className="control-label">
              Group By
            </label>
          </div>
          <div className="co-m-form-col col-sm-12">
            <div className="form-inline">
              <div className="pf-c-input-group">
                <input
                  placeholder="cluster, alertname"
                  type="text"
                  className="pf-c-form-control"
                  id="input-group-by"
                  defaultValue={_.get(config, ['route', 'group_by'])}
                  aria-describedby="input-group-by-help"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label htmlFor="group-wait" className="control-label">
              Group Wait
            </label>
          </div>
          <div className="co-m-form-col col-sm-12">
            <div className="form-inline">
              <div className="pf-c-input-group">
                <input
                  placeholder="30s"
                  type="text"
                  className="pf-c-form-control"
                  id="input-group-wait"
                  defaultValue={_.get(config, ['route', 'group_wait'])}
                  aria-describedby="input-group-wait-help"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label htmlFor="group-interval" className="control-label">
              Group Interval
            </label>
          </div>
          <div className="co-m-form-col col-sm-12">
            <div className="form-inline">
              <div className="pf-c-input-group">
                <input
                  placeholder="5m"
                  type="text"
                  className="pf-c-form-control"
                  id="input-group-interval"
                  defaultValue={_.get(config, ['route', 'group_interval'])}
                  aria-describedby="input-group-interval-help"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label htmlFor="repeat-interval" className="control-label">
              Repeat Interval
            </label>
          </div>
          <div className="co-m-form-col col-sm-12">
            <div className="form-inline">
              <div className="pf-c-input-group">
                <input
                  placeholder="3h"
                  type="text"
                  className="pf-c-form-control"
                  id="input-repeat-interval"
                  defaultValue={_.get(config, ['route', 'repeat_interval'])}
                  aria-describedby="input-repeat-interval-help"
                />
              </div>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter
        inProgress={inProgress}
        errorMessage={errorMessage}
        cancel={cancel}
        submitText="Save"
      />
    </form>
  );
};

export const createAlertRoutingModal = createModalLauncher<AlertRoutingModalProps>(
  AlertRoutingModal,
);

export type AlertRoutingModalProps = {
  cancel: () => void;
  close: () => void;
  config: any;
  secret: K8sResourceKind;
};
