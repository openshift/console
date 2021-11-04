import * as React from 'react';
import { useRouteMatch } from 'react-router-dom';
import * as classNames from 'classnames';
import { HorizontalNavFC } from '@console/dynamic-plugin-sdk';
import { NavBar } from '../utils/horizontal-nav';
import HorizontalNavContent from './HorizontalNavContent';

const HorizontalNav: HorizontalNavFC = ({ pages, className, ...props }) => {
  const { path, url } = useRouteMatch();
  return (
    <div className={classNames('co-m-page__body', className)}>
      <NavBar pages={pages} baseURL={url} basePath={path} />
      <HorizontalNavContent {...props} pages={pages} />
    </div>
  );
};

export default HorizontalNav;
