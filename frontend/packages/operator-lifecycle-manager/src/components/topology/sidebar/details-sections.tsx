import type { FC } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import type { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { ResourceSummary, SectionHeading } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { TYPE_OPERATOR_BACKED_SERVICE } from '@console/topology/src/operators/components/const';

const DetailsSection: FC<{ resource: K8sResourceKind }> = ({ resource }) => {
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body">
      <SectionHeading text={t('olm~Operator details')} />
      <ResourceSummary resource={resource} />
    </div>
  );
};

export const useOperatorBackedPanelDetailsSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_OPERATOR_BACKED_SERVICE) {
    return [undefined, true, undefined];
  }
  const data = element.getData();
  const section = <DetailsSection resource={data.resource} />;
  return [section, true, undefined];
};
