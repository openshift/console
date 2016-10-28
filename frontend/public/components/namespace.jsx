import React from 'react';

import {angulars} from './react-wrapper';
import {makeList} from './factory';
import {LabelList, ResourceIcon} from './utils';

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-4">Namespace Name</div>
  <div className="col-xs-4">Namespace Labels</div>
  <div className="col-xs-4">Status</div>
</div>;

const NamespaceRow = ({obj: namespace}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <ResourceIcon kind={angulars.kinds.NAMESPACE.id} />
    <a href={`namespaces?name=${namespace.metadata.name}`} title={namespace.metadata.uid}>
      {namespace.metadata.name}
    </a>
  </div>
  <div className="col-xs-4">
    <LabelList kind={angulars.kinds.NAMESPACE.id} labels={namespace.metadata.labels}  />
  </div>
  <div className="col-xs-4">
    {namespace.status.phase}
  </div>
</div>;

const kind = 'NAMESPACE';

const NamespacesList = makeList('Namespaces', kind, Header, NamespaceRow);

export {NamespacesList};
