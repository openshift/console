import React from 'react';

import { k8sEnum } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { RadioInput } from './_radio';

export const podRestartPolicyModal = createModalLauncher(({pod, cancel, close}) => {
  const _submit = e => {
    e.preventDefault();
    close(e.target.elements.policy.value);
  };

  return <form onSubmit={_submit}>
    <ModalTitle>Configure Restart Policy</ModalTitle>
    <ModalBody>
      <div className="co-m-form-row">
        <p>What should happen when this container exits or stops unexpectedly?</p>
      </div>
      {_.sortBy(k8sEnum.RestartPolicy, 'weight').map(p => <div className="co-m-form-row" key={p.id}>
        <RadioInput
          name="policy"
          value={p.id}
          defaultChecked={p.id === pod.spec.restartPolicy}
          title={p.default ? <span>{p.label} <span className="co-no-bold">(default)</span></span> : p.label}
          desc={p.description}
        />
      </div>)}
    </ModalBody>
    <ModalSubmitFooter submitText="Save Restart Policy" cancel={cancel} />
  </form>;
});
