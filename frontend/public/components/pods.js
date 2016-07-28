import React from 'react';
import {angulars, register, withStoreAndHose} from './react-wrapper';
import createComponent from './k8s-list-factory';
import {podPhase} from '../module/filter/pods';
import Cog from './cog';
import LabelList from './label-list';
import ResourceIcon from './resource-icon';

const PodCog = ({pod}) => {
  const {k8s, ModalLauncherSvc} = angulars;

  const options = [
    {
      label: 'Modify Labels...',
      callback: ModalLauncherSvc.open.bind(null, 'configure-labels', {
        kind: k8s.enum.Kind.POD,
        resource: () => pod,
      }),
    },
    {
      label: 'Delete Pod...',
      callback: ModalLauncherSvc.open.bind(null, 'confirm', {
        title: 'Delete Pod',
        message: `Are you sure you want to delete ${pod.metadata.name}?`,
        btnText: 'Delete Pod',
        executeFn: () => () => angulars.k8s.pods.delete(pod),
      }),
    }
  ];
  return <div className="co-m-cog-wrapper"><Cog options={options} size="small" anchor="left"></Cog></div>;
}

const PodRow = (p) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
    <PodCog pod={p}></PodCog>
    <ResourceIcon kind="pod"></ResourceIcon>
    <a href={`/ns/${p.metadata.namespace}/pods/${p.metadata.name}`} title={p.metadata.uid}>{p.metadata.name}</a>
  </div>
  <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
    <LabelList kind="pod" labels={p.metadata.labels}  />
  </div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">{podPhase(p)}</div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">{p.spec.containers.length}</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
    {!p.spec.nodeName ? '-' : <a href={`/nodes/${p.spec.nodeName}`}>{p.spec.nodeName}</a> }
  </div>
</div>;

const PodHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Pod Name</div>
  <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">Pod Labels</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Status</div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">Containers</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Node</div>
</div>;

const PodList = createComponent('podsList', 'pods', PodHeader, PodRow);

export {PodRow, PodHeader, PodList};
