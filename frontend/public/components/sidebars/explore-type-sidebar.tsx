import * as React from 'react';
import * as _ from 'lodash-es';
import { Breadcrumb, BreadcrumbItem, Button, TextContent } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CamelCaseWrap } from '@console/dynamic-plugin-sdk';
import {
  getDefinitionKey,
  getSwaggerPath,
  K8sKind,
  SwaggerDefinition,
  SwaggerDefinitions,
  fetchSwagger,
} from '../../module/k8s';
import { EmptyBox, LinkifyExternal } from '../utils';

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
  const { kindObj, schema } = props;
  const { t } = useTranslation();
  const [allDefinitions, setAllDefinitions] = React.useState<SwaggerDefinitions>(null);

  React.useEffect(() => {
    if (kindObj) {
      fetchSwagger()
        .then((response) => {
          setAllDefinitions(response);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Could not fetch swagger definitions', err);
        });
    } else if (schema) {
      setAllDefinitions({ 'custom-schema': schema });
    }
  }, [kindObj, schema]);

  if (!kindObj && !schema) {
    return null;
  }

  if (!allDefinitions) {
    return null;
  }
  const currentSelection = _.last(drilldownHistory);
  // Show the current selected property or the top-level definition for the kind.
  const currentPath = currentSelection
    ? currentSelection.path
    : [kindObj ? getDefinitionKey(kindObj, allDefinitions) : 'custom-schema'];
  const currentDefinition: SwaggerDefinition = _.get(allDefinitions, currentPath);
  const currentProperties =
    currentDefinition?.properties ||
    currentDefinition?.items?.properties ||
    currentDefinition?.definitions;

  // Prefer the description saved in `currentSelection`. It won't always be defined in the definition itself.
  const description = currentSelection
    ? currentSelection?.description
    : currentDefinition?.description;
  const required = new Set(currentDefinition?.required || []);
  const kindLabel = kindObj?.labelKey ? t(kindObj.labelKey) : kindObj?.kind;
  const breadcrumbs = drilldownHistory.length
    ? [kindObj ? kindLabel : t('public~Schema'), ..._.map(drilldownHistory, 'name')]
    : [];

  const drilldown = (
    e: React.MouseEvent<HTMLButtonElement>,
    name: string,
    desc: string,
    path: string[],
  ) => {
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
  const getDrilldownPath = (name: string): string[] => {
    const path = kindObj
      ? currentDefinition.items
        ? getSwaggerPath(allDefinitions, [...currentPath, 'items'], name, true)
        : getSwaggerPath(allDefinitions, currentPath, name, true)
      : [...currentPath, 'properties', name];

    // Only allow drilldown if the reference has additional properties to explore.
    const child = _.get(allDefinitions, path) as SwaggerDefinition;
    return _.has(child, 'properties') || _.has(child, 'items.properties') ? path : null;
  };

  // Get the type to display for a property reference.
  const getTypeForRef = (ref: string): string =>
    _.get(allDefinitions, [ref, 'format']) || _.get(allDefinitions, [ref, 'type']);

  return (
    <>
      {!_.isEmpty(breadcrumbs) && (
        <Breadcrumb className="co-breadcrumb co-break-word">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <BreadcrumbItem key={i} isActive={isLast}>
                {isLast ? (
                  crumb
                ) : (
                  <Button
                    type="button"
                    onClick={(e) => breadcrumbClicked(e, i)}
                    isInline
                    variant="link"
                  >
                    {crumb}
                  </Button>
                )}
              </BreadcrumbItem>
            );
          })}
        </Breadcrumb>
      )}
      <TextContent>
        {description && (
          <p className="co-break-word co-pre-wrap">
            <LinkifyExternal>{description}</LinkifyExternal>
          </p>
        )}
        {_.isEmpty(currentProperties) ? (
          <EmptyBox label={t('public~Properties')} />
        ) : (
          <ul className="co-resource-sidebar-list pf-c-list">
            {_.map(currentProperties, (definition: SwaggerDefinition, name: string) => {
              const path = getDrilldownPath(name);
              const definitionType = definition.type || getTypeForRef(getRef(definition));
              const definitionTypeStr = Array.isArray(definitionType)
                ? definitionType.join(' ')
                : definitionType;

              return (
                <li key={name} className="co-resource-sidebar-item">
                  <h5 className="co-resource-sidebar-item__header co-break-word">
                    <CamelCaseWrap value={name} />
                    &nbsp;
                    <small>
                      <span className="co-break-word">{definitionTypeStr}</span>
                      {required.has(name) && <> &ndash; required</>}
                    </small>
                  </h5>
                  {definition.description && (
                    <p className="co-break-word co-pre-wrap">
                      <LinkifyExternal>{definition.description}</LinkifyExternal>
                    </p>
                  )}
                  {path && (
                    <Button
                      type="button"
                      onClick={(e) => drilldown(e, name, definition.description, path)}
                      isInline
                      variant="link"
                    >
                      {t('public~View details')}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </TextContent>
    </>
  );
};

type ExploreTypeProps = {
  kindObj: K8sKind;
  schema?: any;
  scrollTop?: () => void;
};
