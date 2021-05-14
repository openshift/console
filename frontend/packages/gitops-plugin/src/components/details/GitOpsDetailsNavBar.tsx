import * as React from 'react';
import { Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import GitOpsDetails from './GitOpsDetails';
import { NavBar, Page } from '@console/internal/components/utils';
import GitOpsDeploymentHistory from './deploymentHistory/GitOpsDeploymentHistory';

const GitOpsDetailsNavBar = ({ match, customData }) => {
  const { t } = useTranslation();
  const pages: Page[] = [
    {
      href: '',
      name: t('gitops-plugin~Overview'),
      component: GitOpsDetails,
    },
    {
      href: 'deploymentHistory',
      name: t('gitops-plugin~Deployment History'),
      component: GitOpsDeploymentHistory,
    },
  ];
  return (
    <div className="co-m-page__body " style={{ marginTop: 'var(--pf-global--spacer--xl)' }}>
      <div
        className="co-m-horizontal-nav"
        style={{ borderTop: '1px solid var(--pf-global--palette--black-300)' }}
      >
        <NavBar pages={pages} baseURL={match.url} basePath={match.path} />
      </div>
      {pages.map((p) => {
        const path = `${match.path}/${p.path || p.href}`;
        const render = (params) => {
          return <p.component {...p.pageData} params={params} customData={customData} />;
        };
        return <Route path={path} exact key={p.name} render={render} />;
      })}
    </div>
  );
};

export default GitOpsDetailsNavBar;
