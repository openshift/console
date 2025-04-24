import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';

type Breadcrumb = {
  /** The text to be displayed in the breadcrumb */
  name: string;
  /** The react router path to be used for the breadcrumb */
  path: string;
};

export type BreadcrumbsProps = {
  breadcrumbs: Breadcrumb[];
};

/**
 * A helper around the PatternFly Breadcrumb component.
 */
export const Breadcrumbs = ({ breadcrumbs }: BreadcrumbsProps) => (
  <Breadcrumb data-test="page-heading-breadcrumbs">
    {breadcrumbs.map((crumb, i, { length }) => {
      return (
        <BreadcrumbItem
          to={crumb.path}
          key={`${crumb.path}-${crumb.name}`}
          data-test-id={`breadcrumb-link-${i}`}
          isActive={i === length - 1}
          component={LinkTo(crumb.path)}
        >
          {crumb.name}
        </BreadcrumbItem>
      );
    })}
  </Breadcrumb>
);

Breadcrumbs.displayName = 'Breadcrumbs';
