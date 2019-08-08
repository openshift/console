import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';

import { getDefinitionKey, getStoredSwagger, K8sKind, SwaggerDefinition, SwaggerDefinitions } from '../../module/k8s';
import { ResourceSidebarWrapper, sidebarScrollTop } from './resource-sidebar';
import { CamelCaseWrap, EmptyBox, LinkifyExternal } from '../utils';

const getRef = (definition: SwaggerDefinition): string => {
  const ref = definition.$ref || _.get(definition, 'items.$ref');
  const re = /^#\/definitions\//;
  // Only follow JSON pointers, not external URI references.
  return ref && re.test(ref) ? ref.replace(re, '') : null;
};

export const ExploreType: React.FC<ExploreTypeProps> = (props) => {
  // Track the previously selected items to build breadcrumbs. Each history
  // entry contains the name, description, and path to the definition in the
  // OpenAPI document.
  const [drilldownHistory, setDrilldownHistory] = React.useState([]);
  const {kindObj} = props;
  if (!kindObj) {
    return null;
  }

  const allDefinitions: SwaggerDefinitions = getStoredSwagger();
  if (!allDefinitions) {
    return null;
  }
  const currentSelection = _.last(drilldownHistory);
  // Show the current selected property or the top-level definition for the kind.
  const currentPath = currentSelection ? currentSelection.path : [getDefinitionKey(kindObj, allDefinitions)];
  const currentDefinition: SwaggerDefinition = _.get(allDefinitions, currentPath) || {};

  // Prefer the description saved in `currentSelection`. It won't always be defined in the definition itself.
  const description = currentSelection ? currentSelection.description : currentDefinition.description;
  const required = new Set(currentDefinition.required || []);
  const breadcrumbs = drilldownHistory.length ? [kindObj.kind, ..._.map(drilldownHistory, 'name')] : [];

  const drilldown = (e: React.MouseEvent<HTMLButtonElement>, name: string, desc: string, path: string[]) => {
    e.preventDefault();
    setDrilldownHistory([...drilldownHistory, { name, description: desc, path }]);
    if (props.scrollTop) {
      props.scrollTop();
    }
  };

  const breadcrumbClicked = (e: React.MouseEvent<HTMLButtonElement>, i: number) => {
    e.preventDefault();
    setDrilldownHistory(_.take(drilldownHistory, i));
  };

  // Get the path in the swagger document to additional property details for drilldown.
  // This can be
  // - A reference to another top-level definition
  // - Inline property declartions
  // - Inline property declartions for array items
  const getDrilldownPath = (definition: SwaggerDefinition, name: string): string[] => {
    const ref = getRef(definition);
    // Only allow drilldown if the reference has additional properties to explore.
    if (ref && (_.get(allDefinitions, [ref, 'properties']) || _.get(allDefinitions, [ref, 'items']))) {
      return [ref];
    }

    if (definition.properties) {
      return [...currentPath, 'properties', name];
    }

    if (_.get(definition, 'items.properties')) {
      return [...currentPath, 'properties', name, 'items'];
    }

    return null;
  };

  // Get the type to display for a property reference.
  const getTypeForRef = (ref: string): string => _.get(allDefinitions, [ref, 'format']) || _.get(allDefinitions, [ref, 'type']);

  return (
    <React.Fragment>
      <ol className="breadcrumb">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return <li key={i} className={classNames({'active': isLast})}>
            {isLast
              ? crumb
              : <button type="button" className="btn btn-link btn-link--no-btn-default-values" onClick={e => breadcrumbClicked(e, i)}>{crumb}</button>}
          </li>;
        })}
      </ol>
      {description && <p className="co-break-word co-pre-line"><LinkifyExternal>{description}</LinkifyExternal></p>}
      {_.isEmpty(currentDefinition.properties)
        ? <EmptyBox label="Properties" />
        : <ul className="co-resource-sidebar-list">
          {_.map(currentDefinition.properties, (definition: SwaggerDefinition, name: string) => {
            const path = getDrilldownPath(definition, name);
            const definitionType = definition.type || getTypeForRef(getRef(definition));
            return (
              <li key={name} className="co-resource-sidebar-item">
                <h5 className="co-resource-sidebar-item__header co-break-word">
                  <CamelCaseWrap value={name} />
                  &nbsp;
                  <small>
                    <span className="co-break-word">{definitionType}</span>
                    {required.has(name) && <React.Fragment> &ndash; required</React.Fragment>}
                  </small>
                </h5>
                {definition.description && <p className="co-break-word co-pre-line"><LinkifyExternal>{definition.description}</LinkifyExternal></p>}
                {path && <button type="button" className="btn btn-link btn-link--no-btn-default-values" onClick={e => drilldown(e, name, definition.description, path)}>View Details</button>}
              </li>
            );
          })}
        </ul>
      }
    </React.Fragment>
  );
};

export const ExploreTypeSidebar: React.FC<ExploreTypeSidebarProps> = ({height, isCreateMode, ...exploreTypeProps}) => (
  <ResourceSidebarWrapper label={exploreTypeProps.kindObj.kind} linkLabel="View Schema" style={{height}} isCreateMode={isCreateMode} startHidden>
    <ExploreType {...exploreTypeProps} scrollTop={sidebarScrollTop} />
  </ResourceSidebarWrapper>
);

type ExploreTypeProps = {
  kindObj: K8sKind;
  scrollTop?: () => void;
};

type ExploreTypeSidebarProps = {
  height: number;
  isCreateMode?: boolean;
} & ExploreTypeProps;
