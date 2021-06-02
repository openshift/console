import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  ActionsMenu,
  ResourceLink,
  SidebarSectionHeading,
  ExternalLink,
  KebabAction,
  ResourceIcon,
} from '@console/internal/components/utils';
import { referenceFor, modelFor } from '@console/internal/module/k8s';
import { KnativeServiceOverviewItem } from '../../topology/topology-types';

export type SinkUriResourcesTabProps = {
  itemData: KnativeServiceOverviewItem;
  menuAction: KebabAction;
};

const SinkUriResourcesTab: React.FC<SinkUriResourcesTabProps> = ({ itemData, menuAction }) => {
  const { t } = useTranslation();
  const { obj, eventSources } = itemData;
  const sinkUri = obj?.spec?.sinkUri;
  const actions = [];
  if (eventSources.length > 0) {
    const sourceModel = modelFor(referenceFor(eventSources[0]));
    actions.push(menuAction(sourceModel, obj, eventSources));
  }

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon className="co-m-resource-icon--lg" kind={obj?.kind || 'Uri'} />
            <ExternalLink href={sinkUri} text={sinkUri} />
          </div>
          <div className="co-actions">
            <ActionsMenu actions={actions} />
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
          <button type="button">{t('knative-plugin~Resources')}</button>
        </li>
      </ul>
      <div className="overview__sidebar-pane-body">
        <SidebarSectionHeading text={t('knative-plugin~Event Sources')} />
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
