import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  GettingStartedCard,
  GettingStartedLink,
} from '@console/shared/src/components/getting-started';
import * as operatorsIcon from '../../../image-files/operators_icon.svg';

import './recommended-operators-card.scss';

export const RecommendedOperatorsCard: React.FC = () => {
  const { t } = useTranslation();

  const moreLink: GettingStartedLink = {
    id: 'openshift-virtualization-recommended-operators',
    title: t('kubevirt-plugin~Learn more about Operators'),
    href: '/operatorhub/all-namespaces',
    external: true,
  };

  const links: GettingStartedLink[] = [
    {
      id: 'openshift-virtualization-ocs',
      title: t('kubevirt-plugin~OpenShift Container Storage'),
      href: '/operatorhub/all-namespaces?keyword=OCS',
    },
    {
      id: 'openshift-virtualization-mtv',
      title: t('kubevirt-plugin~Migration Toolkit for Virtualization'),
      href: '/operatorhub/all-namespaces?keyword=MTV',
    },
  ];

  return (
    <GettingStartedCard
      id="recommended-operators"
      icon={
        <img
          id="kv-getting-started--recommended-operators-icon"
          src={operatorsIcon}
          alt={t('kubevirt-plugin~Recommended Operators')}
        />
      }
      title={t('kubevirt-plugin~Recommended Operators')}
      titleColor={'var(--os-global--palette--blue-600)'}
      description={t(
        'kubevirt-plugin~Ease operational complexity with virtualization by using Operators.',
      )}
      links={links}
      moreLink={moreLink}
    />
  );
};
