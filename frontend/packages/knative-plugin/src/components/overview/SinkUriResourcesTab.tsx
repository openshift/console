import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { OverviewItem } from '@console/shared';
import { referenceFor } from '@console/internal/module/k8s';
import {
  ActionsMenu,
  ResourceLink,
  SidebarSectionHeading,
  ExternalLink,
} from '@console/internal/components/utils';

export type SinkUriResourcesTabProps = {
  itemData: OverviewItem;
};

const SinkUriResourcesTab: React.FC<SinkUriResourcesTabProps> = ({ itemData }) => {
  const { obj, eventSources } = itemData;
  const sinkUri = obj?.spec?.sinkUri;

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">URI</div>
          <div className="co-actions">
            <ActionsMenu actions={[]} />
          </div>
        </h1>
      </div>
      <ul
        className={classNames(
          'co-m-horizontal-nav__menu',
          'co-m-horizontal-nav__menu--within-sidebar',
          'co-m-horizontal-nav__menu--within-overview-sidebar',
          'odc-application-resource-tab',
        )}
      >
        <li className="co-m-horizontal-nav__menu-item">
          <button type="button">Resources</button>
        </li>
      </ul>
      <div className="overview__sidebar-pane-body">
        <SidebarSectionHeading text="URI" />
        <ul className="list-group">
          {sinkUri && (
            <li className="list-group-item  container-fluid">
              <ExternalLink
                href={sinkUri}
                additionalClassName="co-external-link--block"
                text={sinkUri}
              />
            </li>
          )}
        </ul>

        <SidebarSectionHeading text="Event Sources" />
        <ul className="list-group">
          {_.map(eventSources, (resource) => {
            if (!resource) {
              return null;
            }
            const {
              metadata: { name, uid, namespace },
            } = resource;
            return (
              <li className="list-group-item  container-fluid" key={uid}>
                <ResourceLink kind={referenceFor(resource)} name={name} namespace={namespace} />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default SinkUriResourcesTab;
