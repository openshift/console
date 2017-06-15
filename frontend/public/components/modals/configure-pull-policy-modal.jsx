import React from 'react';

import { k8sEnum } from '../../module/k8s';
import { createModalLauncher, ModalTitle, ModalBody, ModalSubmitFooter } from '../factory/modal';
import { RadioInput } from '../radio';

export const configurePullPolicyModal = createModalLauncher(({container, cancel, close}) => {
  const _submit = e => {
    e.preventDefault();
    close(e.target.elements.policy.value);
  };

  return <form onSubmit={_submit}>
    <ModalTitle>Configure Pull Policy</ModalTitle>
    <ModalBody>
      <div className="co-m-form-row">
        <p>Each time a new pod is created by the replication controller, it needs to know how to fetch the container image(s):</p>
      </div>
      {_.sortBy(k8sEnum.PullPolicy, 'weight').map(p => <div className="co-m-form-row" key={p.id}>
        <RadioInput
          name="policy"
          value={p.id}
          defaultChecked={p.id === container.imagePullPolicy}
          title={p.default ? <span>{p.label} <span className="co-no-bold">(default)</span></span> : p.label}
          desc={p.description}
        />
      </div>)}
    </ModalBody>
    <ModalSubmitFooter submitText="Save Pull Policy" cancel={cancel} />
  </form>;
});
