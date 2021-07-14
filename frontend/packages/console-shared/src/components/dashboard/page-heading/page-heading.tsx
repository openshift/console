/**
 * This is a wrapper around Page Header Component to be used as part of the Internal API
 *
 */

import * as React from 'react';
import { PageHeading as PageHeadingInternal } from '@console/internal/components/utils';

type BreadcrumbObject = {
  name: string;
  path: string;
};

type PageHeadingProps = {
  breadcrumbs?: BreadcrumbObject[];
  title?: string | JSX.Element;
  badge?: React.ReactNode;
  className?: string;
  detail?: boolean;
};

const PageHeading: React.FC<PageHeadingProps> = (props) => <PageHeadingInternal {...props} />;

export default PageHeading;
