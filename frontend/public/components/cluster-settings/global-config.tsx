import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { RootState } from '../../redux';
import {
  K8sKind,
  k8sList,
  referenceForModel,
  getResourceDescription,
  modelFor,
  referenceForGroupVersionKind,
} from '../../module/k8s';
import { EmptyBox, ExpandableAlert, Kebab, LoadingBox, resourcePathFromModel } from '../utils';
import { addIDPItems } from './oauth';
import { TextFilter } from '../factory';
import { fuzzyCaseInsensitive } from '../factory/table-filters';
import i18next from 'i18next';
import {
  ClusterGlobalConfig,
  isClusterGlobalConfig,
} from '@console/dynamic-plugin-sdk/src/extensions/cluster-settings';

type ConfigDataType = { model: K8sKind; id: string; name: string; namespace: string };

const stateToProps = (state: RootState) => ({
  configResources: state.k8s.getIn(['RESOURCES', 'configResources']),
  clusterOperatorConfigResources: state.k8s.getIn(['RESOURCES', 'clusterOperatorConfigResources']),
});

export const breadcrumbsForGlobalConfig = (detailsPageKind: string, detailsPagePath: string) => [
  {
    name: i18next.t('public~Configuration'),
    path: '/settings/cluster/globalconfig',
  },
  {
    name: i18next.t('public~{{kind}} details', { kind: detailsPageKind }),
    path: detailsPagePath,
  },
];

const ItemRow = ({ item, showAPIGroup }) => {
  return (
    <div className="row co-resource-list__item" data-test-action={item.label}>
      <div className="col-xs-10 col-sm-4">
        <Link to={item.path} data-test-id={item.label}>
          {item.label}
        </Link>
        {showAPIGroup && <div className="text-muted small">{item.apiGroup}</div>}
      </div>
      <div className="hidden-xs col-sm-7">
        <div className="co-line-clamp">{item.description || '-'}</div>
      </div>
      <div className="dropdown-kebab-pf">
        <Kebab options={item.menuItems} />
      </div>
    </div>
  );
};

const GlobalConfigPage_: React.FC<GlobalConfigPageProps & GlobalConfigPageExtensionProps> = ({
  clusterOperatorConfigResources,
  configResources,
  globalConfigs,
}) => {
  const [errors, setErrors] = React.useState([]);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [textFilter, setTextFilter] = React.useState('');
  const { t } = useTranslation();

  React.useEffect(() => {
    const oauthMenuItems = _.map(addIDPItems, (label: string, id: string) => ({
      label: t('public~{{label}}', { label }),
      href: `/settings/idp/${id}`,
    }));
    const editYAMLMenuItem = (name: string, resourceLink: string) => ({
      label: t('public~Edit {{name}} resource', { name }),
      href: `${resourceLink}/yaml`,
    });
    const viewAPIExplorerMenuItem = (name: string, apiExplorerLink: string) => ({
      label: t('public~Explore {{name}} API', { name }),
      href: apiExplorerLink,
    });
    let isSubscribed = true;
    Promise.all(
      [...configResources, ...clusterOperatorConfigResources].map((model: K8sKind) => {
        return k8sList(model)
          .catch(({ response: { status }, message = `Could not get resource ${model.kind}` }) => {
            if (status !== 403) {
              setErrors((current) => [...current, message]);
            }
            return [];
          })
          .then((resources) => resources.map((i: K8sKind) => ({ ...i, model })));
      }),
    ).then((responses) => {
      const flattenedResponses = _.flatten(responses);
      const winnowedResponses: ConfigDataType[] = flattenedResponses.map((item) => ({
        model: item.model,
        id: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
      }));
      const usableConfigs: ConfigDataType[] = globalConfigs.map(({ properties }) => {
        const { group, version, kind } = properties.model;
        return {
          ...properties,
          model: modelFor(referenceForGroupVersionKind(group)(version)(kind)),
        };
      });
      const allItems = [...winnowedResponses, ...usableConfigs]
        .map((item) => {
          const apiExplorerLink = `/api-resource/cluster/${referenceForModel(item.model)}`;
          const resourceLink = resourcePathFromModel(item.model, item.name, item.namespace);
          return {
            label: item.model.kind,
            apiGroup: item.model.apiGroup,
            id: item.id,
            description: getResourceDescription(item.model),
            path: resourceLink,
            menuItems: [
              editYAMLMenuItem(item.model.kind, resourceLink),
              viewAPIExplorerMenuItem(item.model.kind, apiExplorerLink),
              ...(item.model.kind === 'OAuth' ? oauthMenuItems : []),
            ],
          };
        })
        .concat([
          {
            label: 'Alertmanager',
            apiGroup: 'monitoring.coreos.com',
            id: 'alertmanager',
            description: 'Configure grouping and routing of alerts',
            path: '/monitoring/alertmanagerconfig',
            menuItems: [
              {
                label: t('public~Create Receiver'),
                href: '/monitoring/alertmanagerconfig/receivers/~new',
              },
              {
                label: t('public~Edit configuration YAML'),
                href: `/monitoring/alertmanageryaml`,
              },
            ],
          },
        ]);
      const sortedItems = _.sortBy(_.flatten(allItems), 'label', 'asc');
      if (isSubscribed) {
        setItems(sortedItems);
        setLoading(false);
      }
    });
    return () => (isSubscribed = false);
  }, [clusterOperatorConfigResources, configResources, globalConfigs, t]);
  const visibleItems = items.filter(({ label, description = '' }) => {
    return (
      fuzzyCaseInsensitive(textFilter, label) ||
      description.toLowerCase().indexOf(textFilter.toLowerCase()) !== -1
    );
  });
  const groupedItems = _.groupBy(visibleItems, _.property('label'));
  const showAPIGroup = (item) => groupedItems?.[item]?.length > 1;

  return (
    <div className="co-m-pane__body">
      {!loading && (
        <>
          <p className="co-help-text">
            {t('public~Edit the following resources to manage the configuration of your cluster.')}
          </p>
          <div className="co-m-pane__filter-row">
            <TextFilter
              value={textFilter}
              label={t('public~by name or description')}
              onChange={(val) => setTextFilter(val)}
            />
          </div>
        </>
      )}
      {!_.isEmpty(errors) && (
        <ExpandableAlert
          variant={AlertVariant.danger}
          alerts={errors.map((error, i) => (
            <div key={i}>{error}</div>
          ))}
        />
      )}
      {loading && <LoadingBox />}
      {!loading &&
        (_.isEmpty(visibleItems) ? (
          <EmptyBox label={t('public~Configuration resources')} />
        ) : (
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <div className="row co-m-table-grid__head">
              <div className="col-xs-10 col-sm-4">{t('public~Configuration resource')}</div>
              <div className="hidden-xs col-sm-7">{t('public~Description')}</div>
            </div>
            <div className="co-m-table-grid__body">
              {_.map(visibleItems, (item) => (
                <ItemRow item={item} key={item.id} showAPIGroup={showAPIGroup(item.label)} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export const GlobalConfigPage = connect(stateToProps)((props) => {
  const [resolvedExtensions] = useResolvedExtensions<ClusterGlobalConfig>(isClusterGlobalConfig);
  return <GlobalConfigPage_ globalConfigs={resolvedExtensions} {...props} />;
});

type GlobalConfigPageExtensionProps = {
  globalConfigs: ClusterGlobalConfig[];
};

type GlobalConfigPageProps = GlobalConfigPageExtensionProps & {
  clusterOperatorConfigResources: K8sKind[];
  configResources: K8sKind[];
};
