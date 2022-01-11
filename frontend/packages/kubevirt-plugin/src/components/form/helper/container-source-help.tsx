import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { isUpstream } from '@console/internal/components/utils';
import {
  CENTOS7,
  CENTOS8,
  CENTOS_STREAM8,
  CENTOS_STREAM9,
  CENTOS7_EXAMPLE_CONTAINER,
  CENTOS8_EXAMPLE_CONTAINER,
  CENTOS_STREAM8_EXAMPLE_CONTAINER,
  CENTOS_STREAM9_EXAMPLE_CONTAINER,
  FEDORA_EXAMPLE_CONTAINER,
  RHEL7,
  RHEL8,
  RHEL7_EXAMPLE_CONTAINER,
  RHEL8_EXAMPLE_CONTAINER,
  WIN2k,
  WIN10,
  NO_LABEL,
} from '../../../utils/strings';

type ContainerSourceHelpProps = {
  imageName: string;
};
export const ContainerSourceHelp: React.FC<ContainerSourceHelpProps> = ({ imageName }) => {
  const { t } = useTranslation();

  const labelImage = () => {
    const os = {
      [RHEL7]: isUpstream() ? FEDORA_EXAMPLE_CONTAINER : RHEL7_EXAMPLE_CONTAINER,
      [RHEL8]: isUpstream() ? FEDORA_EXAMPLE_CONTAINER : RHEL8_EXAMPLE_CONTAINER,
      [CENTOS7]: CENTOS7_EXAMPLE_CONTAINER,
      [CENTOS8]: CENTOS8_EXAMPLE_CONTAINER,
      [CENTOS_STREAM8]: CENTOS_STREAM8_EXAMPLE_CONTAINER,
      [CENTOS_STREAM9]: CENTOS_STREAM9_EXAMPLE_CONTAINER,
      [WIN2k]: NO_LABEL,
      [WIN10]: NO_LABEL,
    };

    const label =
      os[Object.keys(os).find((name) => imageName?.includes(name))] || FEDORA_EXAMPLE_CONTAINER;

    return label;
  };

  const container = labelImage();

  return (
    <div className="pf-c-form__helper-text" aria-live="polite" data-test="ContainerSourceHelp">
      {container !== NO_LABEL && t('kubevirt-plugin~Example: {{container}}', { container })}
    </div>
  );
};
