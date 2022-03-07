import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  GettingStartedCard,
  GettingStartedLink,
} from '@console/shared/src/components/getting-started';

import './FeatureHighlightsCard.scss';

const getTitle = (title: string, readTime: string): React.ReactElement => {
  return (
    <span>
      {title} &#8226;{' '}
      <span className="kubevirt-feature-highlights-card--time-estimate">{`${readTime} read`}</span>
    </span>
  );
};

export const FeatureHighlightsCard: React.FC = () => {
  const { t } = useTranslation();

  const moreLink: GettingStartedLink = {
    id: 'openshift-virtualization-feature-highlights',
    title: t('kubevirt-plugin~Visit the blog'),
    href: 'https://cloud.redhat.com/learn/topics/virtualization/',
    external: true,
  };

  const links: GettingStartedLink[] = [
    {
      id: 'item1',
      title: getTitle(t('kubevirt-plugin~Automatic Windows VM installation'), '8 min'),
      href:
        'https://www.openshift.com/blog/automatic-installation-of-a-windows-vm-using-openshift-virtualization',
      external: true,
    },
    {
      id: 'item2',
      title: getTitle(t('kubevirt-plugin~OpenShift Virtualization 4.7 Highlights'), '5 min'),
      href: 'https://www.openshift.com/blog/openshift-virtualization-4.7-highlights',
      external: true,
    },
  ];

  return (
    <GettingStartedCard
      id="feature-highlights"
      icon={
        <i
          className="fas fa-blog"
          color="var(--pf-global--primary-color--100)"
          aria-hidden="true"
        />
      }
      title={t('kubevirt-plugin~Feature highlights')}
      titleColor={'var(--co-global--palette--blue-600)'}
      description={t(
        'kubevirt-plugin~Read about the latest information and key virtualization features on the Virtualization highlights.',
      )}
      links={links}
      moreLink={moreLink}
    />
  );
};
