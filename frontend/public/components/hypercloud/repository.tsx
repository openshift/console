import * as _ from 'lodash-es';
import * as React from 'react';
import { useEffect, useState } from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { K8sResourceKind } from '../../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from '../factory';
import { Kebab, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { RepositoryModel } from '../../models/hypercloud';
import { Tags } from './tags';
import { scanningModal } from './modals';
import { k8sGet } from '../../module/k8s';

export const menuActions = [...Kebab.factory.common, Kebab.factory.ModifyScanning];

const kind = RepositoryModel.kind;

const tableColumnClasses = [
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  Kebab.columnClass,
];

const RepositoryTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={obj.metadata.name}
          displayName={obj.spec.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.uid}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const RepositoryTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[2] },
    },
  ];
};

RepositoryTableHeader.displayName = 'RepositoryTableHeader';


const RepositoriesList = (props) => {
  return (<Table
    {...props}
    aria-label="Repositories"
    Header={RepositoryTableHeader}
    Row={RepositoryTableRow}
    virtualize
  />
  );
}
const RepositoriesPage = (props) => {


  const { canCreate = true, namespace, isExtRegistry } = props;
  let registry;
  if (isExtRegistry) {
    registry = props.selector.matchLabels['ext-registry'];
  } else {
    registry = props.selector.matchLabels.registry;
  }

  return (
    <>
      <div className="pf-m-expanded" style={{ padding: '30px 0 0 30px' }}>
        {isExtRegistry ? <button className="pf-c-dropdown__toggle pf-m-primary" style={{ backgroundColor: '#0066cc', color: 'white', fontSize: '14px', width: '150px', height: '25px', display: 'flex', justifyContent: 'center' }} onClick={scanningModal.bind(null, { kind: 'Repository', ns: namespace, showNs: false, labelSelector: { 'ext-registry': registry }, isExtRegistry })}>
          Image Scan Request
      </button> : <button className="pf-c-dropdown__toggle pf-m-primary" style={{ backgroundColor: '#0066cc', color: 'white', fontSize: '14px', width: '150px', height: '25px', display: 'flex', justifyContent: 'center' }} onClick={scanningModal.bind(null, { kind: 'Repository', ns: namespace, showNs: false, labelSelector: { registry }, isExtRegistry })}>
            Image Scan Request
      </button>}
      </div>
      <ListPage canCreate={canCreate} kind="Repository" ListComponent={RepositoriesList} {...props} />
    </>
  );
};

const RepositoryDetails: React.FC<RepositoryDetailsProps> = ({ obj: repository }) => {

  const [addedTags, setAddedTags] = useState(repository.spec.versions);

  useEffect(() => {
    getScans();
  }, []);


  const isExtRegistry = repository.metadata.labels.app === 'ext-registry' ? true : false;

  const getWorstScan = (scans, tag) => {
    const res = scans[tag];
    if (res) {
      if (res.hasOwnProperty('Critical')) {
        return 'Critical';
      } else if (res.hasOwnProperty('High')) {
        return 'High';
      } else if (res.hasOwnProperty('Medium')) {
        return 'Medium';
      } else if (res.hasOwnProperty('Low')) {
        return 'Low';
      } else if (res.hasOwnProperty('Negligible')) {
        return 'Negligible';
      } else if (res.hasOwnProperty('Unknown')) {
        return 'Unknown';
      }
    }
    return '';
  }

  const getScans = async () => {
    const model = Object.assign({}, RepositoryModel);
    model.apiGroup = 'registry.' + model.apiGroup;
    if (isExtRegistry) {
      model.plural = 'ext-repositories';
    }

    const scans = await k8sGet(model, repository.metadata.name, repository.metadata.namespace, { path: 'imagescanresults' });

    setAddedTags(addedTags.map((addedTag) => {
      addedTag.severity = getWorstScan(scans, addedTag.version);
      return addedTag;
    }));
  }

  // const showSigner = repository.metadata.labels?.app === 'registry' ? true : false;


  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Registry Details" />
        <div className="row">
          <div className="col-lg-6">
            <ResourceSummary resource={repository} showPodSelector={false} showNodeSelector={false} showAnnotations={false} showTolerations={false} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Tags" />
        <Tags repository={repository.metadata.name} tags={addedTags} namespace={repository.metadata.namespace} registry={repository.spec.registry} isExtRegistry={isExtRegistry} /* showSigner={showSigner} */ />
      </div>
    </>
  );
}

const { details, editYaml } = navFactory;

const RepositoriesDetailsPage: React.FC<RepositoriesDetailsPageProps> = props => <DetailsPage
  {...props}
  kind={kind}
  menuActions={menuActions}
  pages={[
    details(RepositoryDetails),
    editYaml(),
  ]}
/>;


type RepositoryDetailsProps = {
  obj: K8sResourceKind;
};

type RepositoriesDetailsPageProps = {
  match: any;
};

export { RepositoriesPage, RepositoriesDetailsPage };