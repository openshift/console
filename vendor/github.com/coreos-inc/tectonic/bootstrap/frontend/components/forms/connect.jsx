import React from 'react';
import { connect } from 'react-redux';

import { WaitingLi } from './ui';
import { Pager } from '../pager';

export const Connect = connect(
  ({cluster}) => {
    const {controllers, workers} = cluster.status.kubelet;
    const tectonicsByIP = {};
    cluster.status.tectonic.forEach(node => {
      tectonicsByIP[node.instance] = node;
    });

    return {
      controllers: controllers.map(node => {
        return {
          instance: node.instance,
          ready: node.ready,
          tectonic: tectonicsByIP[node.instance],
        };
      }),
      workers: workers.map(node => {
        return {
          instance: node.instance,
          ready: node.ready,
          tectonic: tectonicsByIP[node.instance],
        };
      }),
    };
  }
)(({controllers, workers, pagerInfo}) => {
  const controllerIP = controllers[0].instance;
  const controllerLis = controllers.map((node, ix) => {
    return (
      <WaitingLi done={node.tectonic.ready} key={`controller-${ix}`}>
        <span title={node.instance}>Controller #{ix + 1}</span>
      </WaitingLi>
    );
  });
  const workerLis = workers.map((node, ix) => {
    return (
      <WaitingLi done={node.tectonic.ready} key={`worker-${ix}`}>
        <span title={node.instance}>Worker #{ix + 1}</span>
      </WaitingLi>
    );
  });
  return (
    <div>
      <h3 className="wiz-form__header">Connect Nodes</h3>
      <div className="row">
        <div className="col-sm-12">
          <div>We're ready to connect your nodes! First, download your cluster assets.</div>
          <a href="/cluster/assets.zip" target="_blank" className="wiz-hero-button"
             ><i className="fa fa-download"></i>&nbsp;&nbsp; Download Cluster Asset Files</a>
          <p>Next, run the following commands on your local machine to extract your cluster assets.</p>
          <pre className="wiz-shell-example">
unzip assets.zip{'\n'}
scp -r assets core@{controllerIP}:/home/core/assets{'\n'}
          </pre>
          <p>Run the configuration tool "bootkube-start" via SSH.
            This command will print messages as configuration progresses.</p>
          <pre className="wiz-shell-example">
ssh core@{controllerIP} 'sudo /home/core/bootkube-start'{'\n'}
          </pre>
          <p>The process can take up to 10 minutes as 150 MB of containers are downloaded.
            Each controller and worker node will appear after it is properly configured.</p>
          <div className="wiz-launch__progress">
            <ul className="wiz-launch-progress">
              {controllerLis}
              {workerLis}
            </ul>
          </div>
        </div>
      </div>
      <Pager info={pagerInfo} />
    </div>
  );
});
Connect.isValid = ({cluster}) => {
  return cluster.ready && cluster.status.tectonic.every(n => n.ready);
};
