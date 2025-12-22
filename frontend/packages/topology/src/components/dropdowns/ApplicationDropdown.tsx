import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Firehose } from '@console/internal/components/utils';
import { ResourceDropdown } from '@console/shared';
import { ResourceDropdownProps } from '../../../../console-shared/src/components/dropdown/ResourceDropdown';
import { getBaseWatchedResources } from '../../data-transforms/transform-utils';

type ApplicationDropdownProps = Omit<ResourceDropdownProps, 'dataSelector' | 'placeholder'> & {
  namespace?: string;
};

const ApplicationDropdown: FC<ApplicationDropdownProps> = ({ namespace, ...props }) => {
  const { t } = useTranslation();

  const resources = useMemo(() => {
    // Use only base watched resources since dynamic factories are handled separately
    // and ApplicationDropdown primarily needs the base resources for application labels
    const watchedBaseResources = getBaseWatchedResources(namespace);
    return Object.keys(watchedBaseResources).map((key) => ({
      ...watchedBaseResources[key],
      prop: key,
    }));
  }, [namespace]);

  return (
    <Firehose resources={resources}>
      <ResourceDropdown
        {...props}
        placeholder={t('topology~Select an application')}
        dataSelector={['metadata', 'labels', 'app.kubernetes.io/part-of']}
      />
    </Firehose>
  );
};

export default ApplicationDropdown;
