import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';

export const Tags: React.SFC<TagsProps> = ({ tags, namespace }) => {
  const rows = tags?.map?.((tag: any, i: number) => {
    return (
      <div className="row" data-test-id={tag.type} key={i}>
        <div className="col-xs-6 col-sm-4 col-md-4">
          {tag.version}
        </div>
        <div className="col-xs-6 col-sm-4 col-md-4">
          {/* {tag.signer} */}
          <ResourceLink kind={referenceFor({ kind: 'ImageSigner', apiVersion: 'tmax.io/v1' })} namespace={namespace} name={tag.signer}
          />
        </div>
        <div className="col-xs-6 col-sm-4 col-md-4" data-test-id="status">
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
            <div className="col-xs-6 col-sm-4 col-md-4">Name</div>
            <div className="col-xs-6 col-sm-4 col-md-4">Signer</div>
            <div className="col-xs-6 col-sm-4 col-md-4">Created Time</div>
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
};
