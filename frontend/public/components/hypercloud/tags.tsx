import * as React from 'react';
import { useEffect, useState } from 'react';
// import * as classNames from 'classnames';
import { referenceFor } from '@console/internal/module/k8s';
// import { Kebab, detailsPage, Timestamp, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from '../utils';
import { ResourceLink } from '../utils';
import { k8sGet } from '../../module/k8s';
import { RepositoryModel } from '../../models/hypercloud';

// export const menuActions = [...Kebab.factory.common, Kebab.factory.ModifyScanning];


// const tableColumnClasses = [
//   '',
//   '',
//   '',
//   classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
//   Kebab.columnClass,
// ];

export const Tags: React.SFC<TagsProps> = ({ tags, namespace, repository }) => {

  const [scans, setScans] = useState({});

  useEffect(() => {
    getScans();
  }, []);

  const getScans = async () => {
    const model = Object.assign({}, RepositoryModel);
    model.apiGroup = 'registry.' + model.apiGroup;

    const res = await k8sGet(model, repository, namespace, { path: 'imagescanresults' });
    setScans(res);
  }

  const getWorstScan = (tag) => {
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

  const rows = tags?.map?.((tag: any, i: number) => {
    return (
      <div className="row" data-test-id={tag.type} key={i}>
        <div className="col-xs-5 col-sm-3 col-md-3">
          {tag.version}
        </div>
        <div className="col-xs-5 col-sm-3 col-md-3">
          {tag.signer &&
            <ResourceLink kind={referenceFor({ kind: 'ImageSigner', apiVersion: 'tmax.io/v1' })} namespace={namespace} name={tag.signer}
            />
          }
        </div>
        <div className="col-xs-5 col-sm-3 col-md-3">
          {getWorstScan(tag.version)}
        </div>
        <div className="col-xs-5 col-sm-3 col-md-3">
          {tag.createdAt}
        </div>
      </div>
    );
  });




  return (
    <>
      {tags?.length ? (
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-xs-5 col-sm-3 col-md-3">Name</div>
            <div className="col-xs-5 col-sm-3 col-md-3">Signer</div>
            <div className="col-xs-5 col-sm-3 col-md-3">Scan Result</div>
            <div className="col-xs-5 col-sm-3 col-md-3">Created Time</div>
          </div>
          <div className="co-m-table-grid__body">{rows}</div>
        </div>
      ) : (
          <div className="cos-status-box">
            <div className="text-center">No Conditions Found</div>
          </div>
        )}
    </>
  );
};

export type TagsProps = {
  tags: any;
  namespace: string;
  repository: string;
};
