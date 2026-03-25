import type { FC } from 'react';
import { useMemo } from 'react';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ServiceAccountModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import type { RootState } from '@console/internal/redux';
import { ResourceDropdownField } from '@console/shared';
import type { ResourceDropdownItems } from '@console/shared/src/components/dropdown/ResourceDropdown';

interface ServiceAccountDropdownProps {
  name: string;
  onLoad?: (items: ResourceDropdownItems) => void;
}

interface StateProps {
  namespace: string;
}

const ServiceAccountDropdown: FC<ServiceAccountDropdownProps & StateProps> = ({
  name,
  onLoad,
  namespace,
}) => {
  const { t } = useTranslation();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);

  const [saData, saLoaded, saLoadError] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: ServiceAccountModel.kind,
    namespace,
    optional: true,
  });

  const resources = useMemo(
    () => [
      {
        data: saData,
        loaded: saLoaded,
        loadError: saLoadError,
        kind: ServiceAccountModel.kind,
      },
    ],
    [saData, saLoaded, saLoadError],
  );

  return (
    <ResourceDropdownField
      name={name}
      label={t('knative-plugin~Service Account name')}
      resources={resources}
      dataSelector={['metadata', 'name']}
      placeholder={t('knative-plugin~Select a Service Account name')}
      autocompleteFilter={autocompleteFilter}
      helpText={t('knative-plugin~The name of Service Account use to run this')}
      fullWidth
      onLoad={onLoad}
      showBadge
    />
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  namespace: getActiveNamespace(state),
});

export default connect<StateProps, null, ServiceAccountDropdownProps>(mapStateToProps)(
  ServiceAccountDropdown,
);
