import React from 'react';

import {angulars} from './react-wrapper';
import {Cog, Selector, LabelList, ResourceIcon} from './utils'

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Name</div>
  <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">Labels</div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">Status</div>
  <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">Pod Selector</div>
</div>;


const cogOfKind = (kind) => ({o}) => {
  const {factory: {Edit, Delete, ModifyLabels, ModifyCount, ModifyPodSelector}} = Cog;
  const options = [ModifyCount, ModifyPodSelector, ModifyLabels, Edit, Delete].map(f => f(kind, o));

  return <Cog options={options} size="small" anchor="left"></Cog>;
}

const rowOfKindstring = (name) => {
  return o => {
    const kind = angulars.kinds[name];
    const CogOfKind = cogOfKind(kind);

    // TODO: Temporary hack while we migrate details pages to React
    const detailsUrlSuffix = (name === 'DEPLOYMENT' ? '' : '/details');

    return (
      <div className="row co-resource-list__item">
        <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
          <CogOfKind o={o} />
          <ResourceIcon kind={kind.id}></ResourceIcon>
          <a href={`ns/${o.metadata.namespace}/${kind.plural}/${o.metadata.name}` + detailsUrlSuffix} title={o.metadata.uid}>{o.metadata.name}</a>
        </div>
        <div className="col-lg-3 col-md-3 col-sm-5 col-xs-6">
          <LabelList kind={kind.id} labels={o.metadata.labels} />
        </div>
        <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">
          <a href={`ns/${o.metadata.namespace}/${kind.plural}/${o.metadata.name}/pods`} title={"pods"}>
            {o.status.replicas || 0} of {o.spec.replicas} pods
          </a>
        </div>
        <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
          <Selector selector={o.spec.selector} />
        </div>
      </div>
    );
  };
}

export {Header, rowOfKindstring};
