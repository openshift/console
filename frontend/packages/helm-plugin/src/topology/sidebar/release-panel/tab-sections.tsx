import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { StatusBox } from '@console/internal/components/utils/status-box';
import TopologyGroupResourcesPanel from '@console/topology/src/components/side-bar/TopologyGroupResourcesPanel';
import { getResource } from '@console/topology/src/utils';
import HelmReleaseOverview from '../../../components/details-page/overview/HelmReleaseOverview';
import { TYPE_HELM_RELEASE } from '../../components/const';
import TopologyHelmReleaseNotesPanel from '../../TopologyHelmReleaseNotesPanel';

const HelmReleasePanelDetailsTabSection: React.FC<{ element: GraphElement }> = ({ element }) => {
  const { t } = useTranslation();
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

export const useHelmReleasePanelDetailsTabSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_HELM_RELEASE) {
    return [undefined, true, undefined];
  }
  const section = <HelmReleasePanelDetailsTabSection element={element} />;
  return [section, true, undefined];
};

export const useHelmReleasePanelResourceTabSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_HELM_RELEASE) {
    return [undefined, true, undefined];
  }
  const { manifestResources } = element.getData().data;
  const resource = getResource(element);
  if (!manifestResources || !resource?.metadata) {
    return [null, true, undefined];
  }
  const { namespace } = resource.metadata;

  const section = (
    <div className="overview__sidebar-pane-body">
      <TopologyGroupResourcesPanel
        manifestResources={manifestResources}
        releaseNamespace={namespace}
      />
    </div>
  );
  return [section, true, undefined];
};

export const useHelmReleasePanelReleaseNotesTabSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_HELM_RELEASE) {
    return [undefined, true, undefined];
  }
  const { releaseNotes } = element.getData().data;
  const section = <TopologyHelmReleaseNotesPanel releaseNotes={releaseNotes} />;
  return [section, true, undefined];
};
