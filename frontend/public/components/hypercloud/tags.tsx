import * as React from 'react';
import * as _ from 'lodash-es';
import { useEffect, useState } from 'react';
import { k8sGet } from '../../module/k8s';
import { RepositoryModel } from '../../models/hypercloud';
import { compoundExpand, sortable } from '@patternfly/react-table';
import { SingleExpandableTable } from './utils/expandable-table';
import { ExpandableInnerTable } from './utils/expandable-inner-table';

export const Tags: React.SFC<TagsProps> = React.memo(({ tags, namespace, repository }) => {
  const [addedTags, setAddedTags] = useState(tags);

  useEffect(() => {
    let mounted = true;
    getScans(mounted);
    return () => (mounted = false);
  }, []);


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


  const getScans = async (mounted) => {
    if (mounted) {
      const model = Object.assign({}, RepositoryModel);
      model.apiGroup = 'registry.' + model.apiGroup;

      const scans = await k8sGet(model, repository, namespace, { path: 'imagescanresults' });

      setAddedTags(addedTags.map((addedTag) => {
        addedTag.severity = getWorstScan(scans, addedTag.version);
        return addedTag;
      }));
    }
  }

  return (
    <>
      <div className="co-m-pane__body">
        <TagsListTable tags={addedTags} namespace={namespace} repository={repository} />
      </div>
    </>
  );
});

const TagsListTable = ({ tags, namespace, repository }) => {

  const TagsListHeaderColumns = [
    'Name',
    'Signer',
    {
      title: 'Scan Result',
      cellTransforms: [compoundExpand],
    },
    'Created Time',
  ];

  const rowRenderer = (index, obj) => {
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
  repository: string;
};
