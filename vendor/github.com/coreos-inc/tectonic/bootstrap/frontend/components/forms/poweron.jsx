import classNames from 'classnames';
import React from 'react';
import { connect } from 'react-redux';

import { WaitingLi } from './ui';
import { Pager } from '../pager';

export const PowerOn = connect(
  ({cluster}) => {
    const {controllers, workers} = cluster.status.kubelet;
    let etcdByIP = {};
    cluster.status.etcd.forEach(node => {
      etcdByIP[node.instance] = node;
    });

    return {
      error: cluster.error,
      controllers: controllers.map(node => {
        return {
          instance: node.instance,
          ready: node.ready,
          etcd: etcdByIP[node.instance],
        };
      }),
      workers: workers,
    };
  }
)(({error, controllers, workers, pagerInfo}) => {
  const controllerLis = controllers.map((node, ix) => {
    return (
      <WaitingLi done={node.ready} key={`controller-${ix}`}>
        <span title={node.instance}>Controller #{ix + 1}</span>
        <ul>
          {
            !node.etcd ? '' :
            <WaitingLi substep={true} done={node.etcd.ready}
               >Waiting for etcd</WaitingLi>
          }
          <WaitingLi substep={true} done={node.ready}
             >Waiting for bootstrap Kubernetes</WaitingLi>
        </ul>
      </WaitingLi>
    );
  });

  const workerLis = workers.map((node, ix) => {
    return (
      <WaitingLi done={node.ready} key={`worker-${ix}`}>
        <span title={node.instance}>Worker #{ix + 1}</span>
        <ul>
          <WaitingLi substep={true} done={node.ready}
             >Waiting for bootstrap Kubernetes</WaitingLi>
        </ul>
      </WaitingLi>
    );
  });

  return (
    <div>
      <h3 className="wiz-form__header">Power On</h3>
      <div className="row">
        <div className="col-sm-12">
          <div>We're ready to boot the cluster.</div>
          <div className="wiz-herotext">
            <span className="fa fa-power-off wiz-herotext-icon"></span> Power on the nodes
          </div>
          <div className="form-group">After powering up, your nodes will provision themselves automatically.
            This process can take up to 30 minutes, while the following happens.</div>
          <div className="form-group">
            <ul>
              <li>CoreOS is downloaded and installed to disk (about 200 MB)</li>
              <li>Cluster software is downloaded (about 500 MB)</li>
              <li>One or two reboots may occur</li>
            </ul>
          </div>
          <div className="form-group">
            <div className="wiz-launch__progress">
              <ul className="wiz-launch-progress">
                {controllerLis}
                {workerLis}
              </ul>
            </div>
          </div>
          <div className={classNames('wiz-error-bg', {hidden: !error})}>
            {error}
          </div>
        </div>
      </div>
      <Pager info={pagerInfo} />
    </div>
  );
});
PowerOn.isValid = ({cluster}) => {
  if (!cluster.ready) {
    return false;
  }

  const {controllers, workers} = cluster.status.kubelet;
  return controllers.every(n => n.ready) && workers.some(n => n.ready);
};
