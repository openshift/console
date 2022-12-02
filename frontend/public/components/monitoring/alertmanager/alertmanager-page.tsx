import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import classNames from 'classnames';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Route, Switch } from 'react-router-dom';

import { breadcrumbsForGlobalConfig } from '../../cluster-settings/global-config';
import { AlertmanagerConfig } from './alertmanager-config';
import AlertmanagerYAML from './alertmanager-yaml-editor';

const AlertmanagerPage: React.FC<{ match: { url: string } }> = ({ match }) => {
  const { t } = useTranslation();

  const configPath = '/monitoring/alertmanagerconfig';
  const YAMLPath = '/monitoring/alertmanageryaml';

  const { url } = match;

  const breadcrumbs = breadcrumbsForGlobalConfig('Alertmanager', configPath);

  return (
    <>
      <div className="pf-c-page__main-breadcrumb">
        <Breadcrumb className="monitoring-breadcrumbs">
          <BreadcrumbItem>
            <Link className="pf-c-breadcrumb__link" to={breadcrumbs[0].path}>
              {breadcrumbs[0].name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>{breadcrumbs[1].name}</BreadcrumbItem>
        </Breadcrumb>
      </div>
      <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <span className="co-resource-item__resource-name" data-test-id="resource-title">
              {t('public~Alertmanager')}
            </span>
          </div>
        </h1>
      </div>
      <ul className="co-m-horizontal-nav__menu">
        <li
          className={classNames('co-m-horizontal-nav__menu-item', {
            'co-m-horizontal-nav-item--active': url === configPath,
          })}
        >
          <Link to={configPath}>{t('public~Details')}</Link>
        </li>
        <li
          className={classNames('co-m-horizontal-nav__menu-item', {
            'co-m-horizontal-nav-item--active': url === YAMLPath,
          })}
        >
          <Link to={YAMLPath}>{t('public~YAML')}</Link>
        </li>
      </ul>
      <Switch>
        <Route path={configPath} exact component={AlertmanagerConfig} />
        <Route path={YAMLPath} exact component={AlertmanagerYAML} />
      </Switch>
    </>
  );
};

export default AlertmanagerPage;
