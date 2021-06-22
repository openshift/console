import * as React from 'react';
import { GraphElement, Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { StatusBox } from '@console/internal/components/utils/status-box';
import TopologyGroupResourcesPanel from '@console/topology/src/components/side-bar/TopologyGroupResourcesPanel';
import { getResource } from '@console/topology/src/utils';
import HelmReleaseOverview from '../../../components/details-page/overview/HelmReleaseOverview';
import { TYPE_HELM_RELEASE } from '../../components/const';
import TopologyHelmReleaseNotesPanel from '../../TopologyHelmReleaseNotesPanel';

export const useHelmReleasePanelDetailsTabSection = (element: GraphElement) => {
  const { t } = useTranslation();
  if (element.getType() !== TYPE_HELM_RELEASE) return undefined;
  const secret = element.getData().resources.obj;
  return !secret ? (
    <>
      <StatusBox
        loaded
        loadError={{
          message: t('helm-plugin~Unable to find resource for {{helmLabel}}', {
            helmLabel: element.getLabel(),
          }),
        }}
      />
      <p>Status Box</p>
    </>
  ) : (
    <HelmReleaseOverview obj={secret} customData={undefined} />
  );
};

export const useHelmReleasePanelResourceTabSection = (element: GraphElement) => {
  if (element.getType() !== TYPE_HELM_RELEASE) return undefined;
  const { manifestResources } = element.getData().data;
  const { namespace } = getResource(element as Node).metadata;

  return manifestResources ? (
    <div className="overview__sidebar-pane-body">
      <TopologyGroupResourcesPanel
        manifestResources={manifestResources}
        releaseNamespace={namespace}
      />
    </div>
  ) : null;
};

export const useHelmReleasePanelReleaseNotesTabSection = (element: GraphElement) => {
  if (element.getType() !== TYPE_HELM_RELEASE) return undefined;
  const { releaseNotes } = element.getData().data;
  return <TopologyHelmReleaseNotesPanel releaseNotes={releaseNotes} />;
};
