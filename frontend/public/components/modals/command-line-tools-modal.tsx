import * as React from 'react';

import { createModalLauncher, ModalTitle, ModalBody, ModalFooter } from '../factory/modal';
import { OC_DOWNLOAD_LINK, ODO_DOWNLOAD_LINK } from '../../const';
import { ExternalLink } from '../utils';

export const commandLineToolsModal = createModalLauncher(
  ({cancel}) => <div className="modal-content">
    <ModalTitle>Command Line Tools</ModalTitle>
    <ModalBody className="modal-body">
      <h5>oc - OpenShift Command Line Interface (CLI)</h5>
      <p>With the OpenShift command line interface, you can create applications and manage OpenShift projects from a terminal.</p>
      <p>The oc binary offers the same capabilities as the kubectl binary, but it is further extended to natively support OpenShift Container Platform features.</p>
      <p><ExternalLink href={OC_DOWNLOAD_LINK} text="Download oc" /></p>
      <hr />
      <h5>odo - Developer-focused CLI for OpenShift</h5>
      <p>OpenShift Do (odo) is a fast, iterative, and straightforward CLI tool for developers who write, build, and deploy applications on OpenShift.</p>
      <p>odo abstracts away complex Kubernetes and OpenShift concepts, thus allowing developers to focus on what is most important to them: code.</p>
      <p><ExternalLink href={ODO_DOWNLOAD_LINK} text="Download odo" /></p>
    </ModalBody>
    <ModalFooter inProgress={false} errorMessage=""><button type="button" onClick={() => cancel()} className="btn btn-default">Close</button></ModalFooter>
  </div>);
