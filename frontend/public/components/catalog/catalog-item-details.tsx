import * as React from 'react';
import * as _ from 'lodash-es';
import { PropertiesSidePanel, PropertyItem } from '@patternfly/react-catalog-view-extension';
import { ClusterServicePlanModel } from '../../models';
import { k8sGet } from '../../module/k8s';
import { Timestamp } from '../utils';
import { SupportUrlLink } from './description-utils';
import { FullDescription } from './full-description';
import { Item, Plan } from './types';

type CatalogTileDetailsProps = {
  item: Item;
};

export const CatalogTileDetails: React.FC<CatalogTileDetailsProps> = ({ item }) => {
  const {
    obj: { metadata = {} },
    kind,
    tileProvider,
    tileDescription,
    supportUrl,
    longDescription,
    documentationUrl,
    sampleRepo,
    customProperties,
    markdownDescription,
  } = item;
  const { name, creationTimestamp } = metadata;
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [markdownLoading, setMarkdownLoading] = React.useState<boolean>(false);
  const [markdown, setMarkdown] = React.useState<string>('');

  React.useEffect(() => {
    if (kind === 'ClusterServiceClass') {
      k8sGet(ClusterServicePlanModel, null, null, {
        queryParams: { fieldSelector: `spec.clusterServiceClassRef.name=${name}` },
      }).then(({ items }) => {
        setPlans(_.orderBy(items, ['spec.externalMetadata.displayName', 'metadata.name']));
      });
    }
  }, [name, kind]);

  React.useEffect(() => {
    if (_.isFunction(markdownDescription)) {
      setMarkdownLoading(true);
      markdownDescription()
        .then((md) => {
          setMarkdown(md);
          setMarkdownLoading(false);
        })
        .catch(() => setMarkdownLoading(false));
    } else {
      setMarkdown(markdownDescription);
    }
  }, [markdownDescription]);

  return (
    <div className="modal-body modal-body-border">
      <div className="modal-body-content">
        <div className="modal-body-inner-shadow-covers">
          <div className="co-catalog-page__overlay-body">
            <PropertiesSidePanel>
              {customProperties}
              {tileProvider && <PropertyItem label="Provider" value={tileProvider} />}
              <SupportUrlLink link={supportUrl} />
              {creationTimestamp && (
                <PropertyItem
                  label="Created At"
                  value={<Timestamp timestamp={creationTimestamp} />}
                />
              )}
            </PropertiesSidePanel>
            <FullDescription
              kind={kind}
              tileDescription={tileDescription}
              longDescription={longDescription}
              documentationUrl={documentationUrl}
              sampleRepo={sampleRepo}
              plans={plans}
              markdownLoading={markdownLoading}
              markdown={markdown}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
