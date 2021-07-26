import * as React from 'react';
import { match } from 'react-router-dom';
import * as _ from 'lodash-es';

import { useExtensions, ResourceTabPage, isResourceTabPage } from '@console/plugin-sdk';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import {
  Firehose,
  HorizontalNav,
  FirehoseResource,
  KebabOptionsCreator,
  Page,
  AsyncComponent,
  PageComponentProps,
} from '../utils';
import {
  K8sResourceKindReference,
  K8sResourceKind,
  K8sKind,
  referenceForModel,
  referenceFor,
} from '../../module/k8s';
import { ErrorBoundaryFallback } from '../error';

export const DetailsPage = withFallback<DetailsPageProps>(({ pages = [], ...props }) => {
  const resourceKeys = _.map(props.resources, 'prop');
  const renderAsyncComponent = (page: ResourceTabPage, cProps: PageComponentProps) => (
    <AsyncComponent loader={page.properties.loader} {...cProps} />
  );

  const resourcePageExtensions = useExtensions<ResourceTabPage>(isResourceTabPage);

  const pluginPages = React.useMemo(
    () =>
      resourcePageExtensions
        .filter(
          (p) =>
            referenceForModel(p.properties.model) ===
            (props.kindObj ? referenceFor(props.kindObj) : props.kind),
        )
        .map((p) => ({
          href: p.properties.href,
          name: p.properties.name,
          component: (cProps) => renderAsyncComponent(p, cProps),
        })),
    [resourcePageExtensions, props],
  );
  let allPages = [...pages, ...pluginPages];
  allPages = allPages.length ? allPages : null;

  return (
    <>
      <Firehose
        resources={[
          {
            kind: props.kind,
            kindObj: props.kindObj,
            name: props.name,
            namespace: props.namespace,
            isList: false,
            prop: 'obj',
          } as FirehoseResource,
        ].concat(props.resources || [])}
      >
        <HorizontalNav
          pages={allPages}
          pagesFor={props.pagesFor}
          className={`co-m-${_.get(props.kind, 'kind', props.kind)}`}
          match={props.match}
          label={props.label || (props.kind as any).label}
          resourceKeys={resourceKeys}
          customData={props.customData}
          alertURL={props.alertURL}
        />
      </Firehose>
    </>
  );
}, ErrorBoundaryFallback);

export type DetailsPageProps = {
  match: match<any>;
  title?: string | JSX.Element;
  titleFunc?: (obj: K8sResourceKind) => string | JSX.Element;
  menuActions?: Function[] | KebabOptionsCreator; // FIXME should be "KebabAction[] |" refactor pipeline-actions.tsx, etc.
  buttonActions?: any[];
  pages?: Page[];
  pagesFor?: (obj: K8sResourceKind) => Page[];
  kind: K8sResourceKindReference;
  kindObj?: K8sKind;
  label?: string;
  name?: string;
  alertURL?: string;
  namespace?: string;
  resources?: FirehoseResource[];
  breadcrumbsFor?: (obj: K8sResourceKind) => { name: string; path: string }[];
  customData?: any;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ obj: K8sResourceKind }>;
  getResourceStatus?: (resource: K8sResourceKind) => string;
  children?: React.ReactNode;
  customKind?: string;
};

DetailsPage.displayName = 'DetailsPage';
