import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { isUpstream } from '@console/internal/components/utils';
import {
  CENTOS,
  CENTOS_EXAMPLE_CONTAINER,
  FEDORA_EXAMPLE_CONTAINER,
  RHEL,
  RHEL_EXAMPLE_CONTAINER,
} from '../../../utils/strings';

type ContainerSourceHelpProps = {
  imageName: string;
};
export const ContainerSourceHelp: React.FC<ContainerSourceHelpProps> = ({ imageName }) => {
  const { t } = useTranslation();

  const labelImage = () => {
    const os = {
      [RHEL]: RHEL_EXAMPLE_CONTAINER,
      [CENTOS]: CENTOS_EXAMPLE_CONTAINER,
    };

    const label =
      os[Object.keys(os).find((name) => imageName?.includes(name))] || FEDORA_EXAMPLE_CONTAINER;

    return label;
  };

  const container = isUpstream() ? FEDORA_EXAMPLE_CONTAINER : labelImage();

  return (
    <div className="pf-c-form__helper-text" aria-live="polite" data-test="ContainerSourceHelp">
      {t('kubevirt-plugin~Example: {{container}}', { container })}
    </div>
  );
};
