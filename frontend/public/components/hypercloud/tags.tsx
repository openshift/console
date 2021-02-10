import * as React from 'react';
import * as _ from 'lodash-es';
import { k8sGet } from '../../module/k8s';
import { RepositoryModel } from '../../models/hypercloud';
import { compoundExpand, sortable } from '@patternfly/react-table';
import { Kebab, ResourceKebab } from '../utils';
import { SingleExpandableTable } from './utils/expandable-table';
import { ExpandableInnerTable } from './utils/expandable-inner-table';

export const menuActions = [Kebab.factory.ModifyScanning];

const tableColumnClasses = [
  Kebab.columnClass,
];

export const Tags: React.SFC<TagsProps> = ({ tags, namespace, repository, registry, isExtRegistry }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <TagsListTable tags={tags} namespace={namespace} repository={repository} registry={registry} isExtRegistry={isExtRegistry} />
      </div>
    </>
  );
}

const TagsListTable = ({ tags, namespace, repository, registry, isExtRegistry }) => {

  const TagsListHeaderColumns = [
    'Name',
    'Signer',
    {
      title: 'Scan Result',
      cellTransforms: [compoundExpand],
    },
    'Created Time',
    {
      title: '',
      props: { className: tableColumnClasses[0] }
    }
  ];

  const rowRenderer = (index, obj) => {
    obj.registry = registry;
    obj.repository = repository;
    obj.kind = 'Tag';
    obj.namespace = namespace;
    obj.isExtRegistry = isExtRegistry;
    return [
      {
        title: obj?.version,
      },
      {
        title: obj?.signer,
      },
      {
        title: obj?.severity,
        props: {
          isOpen: false,
        },
      },
      {
        title: obj?.createdAt
      },
      {
        title: <ResourceKebab actions={menuActions} kind='Tag' resource={obj} />,
        props: { className: tableColumnClasses[0] }
      }
    ];
  };

  const innerRenderer = parentItem => {

    const ScanResultTableRow = obj => {
      return [
        {
          title: <a href={obj.link} target="_blank">{obj.name}</a>,
          textValue: obj.name,
        },
        {
          title: obj.severity,
          textValue: obj.severity,
        },
        {
          title: obj.version,
          textValue: obj.version,
        },
      ];
    };

    const ScanResultTableHeader = [
      {
        title: 'Vulnerability',
        sortFunc: 'string',
        transforms: [sortable],
      },
      {
        title: 'Status',
        transforms: [sortable],
      },
      {
        title: 'Fixable Version',
        transforms: [sortable],
      },
    ];

    const model = Object.assign({}, RepositoryModel);
    model.apiGroup = 'registry.' + model.apiGroup;

    return k8sGet(model, repository, namespace, { path: `imagescanresults/${parentItem.version}` })
      .then(res => {
        const innerItemsData = [];
        const resObj = _.get(res, parentItem.version);

        for (const proerty in resObj) {
          for (let i = 0; i < resObj[proerty].length; ++i) {
            innerItemsData.push({
              severity: resObj[proerty][i].Severity,
              name: resObj[proerty][i].Name,
              version: resObj[proerty][i].NamespaceName,
              link: resObj[proerty][i].Link
            });
          }
        }
        return <ExpandableInnerTable aria-label="Scan Result" header={ScanResultTableHeader} Row={ScanResultTableRow} data={innerItemsData} />;
      })
      .catch(err => {
        return <div>{err}</div>;
      });
  }

  return <SingleExpandableTable header={TagsListHeaderColumns} itemList={tags} rowRenderer={rowRenderer} innerRenderer={innerRenderer} compoundParent={2}></SingleExpandableTable>;
}

export type TagsProps = {
  tags: any;
  namespace: string;
  repository?: string;
  registry?: string;
  isExtRegistry?: boolean;
};
