import React from 'react';

import { k8sEnum } from '../../module/k8s/enum';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';

export const podRestartPolicyModal = createModalLauncher(({pod, close}) => {
  const _submit = e => {
    e.preventDefault();
    pod.spec.restartPolicy = e.target.elements.policy.value;
    close();
  };

  return <form onSubmit={_submit}>
    <ModalTitle>Configure Restart Policy</ModalTitle>
    <ModalBody>
      <div className="row co-m-form-row">
        <div className="col-xs-12">
          <p>What should happen when this container exits or stops unexpectedly?</p>
        </div>
      </div>
      <div className="row co-m-form-row">
        <div className="col-xs-12">
          {_.sortBy(k8sEnum.RestartPolicy, 'weight').map(p => <div className="co-m-form-row" key={p.id}>
            <label>
              <input type="radio" name="policy" value={p.id} defaultChecked={p.id === pod.spec.restartPolicy} />
              <span>{p.label}</span>
              {p.default && <span className="co-no-bold"> (default)</span>}
            </label>
            <p className="co-m-radio-desc">{p.description}</p>
          </div>)}
        </div>
      </div>
    </ModalBody>
    <ModalSubmitFooter errorFormatter="k8sApi" submitText="Save Restart Policy" cancel={close} />
  </form>;
});
