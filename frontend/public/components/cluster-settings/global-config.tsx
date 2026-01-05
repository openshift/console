import { useState, useEffect } from 'react';
import * as _ from 'lodash';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom-v5-compat';
import {
  AlertVariant,
  Content,
  ContentVariants,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { RootState } from '../../redux';
import {
  K8sKind,
  k8sList,
  referenceForModel,
  getResourceDescription,
  modelFor,
  referenceForGroupVersionKind,
} from '../../module/k8s';
import { EmptyBox, LoadingBox } from '../utils/status-box';
import { ExpandableAlert } from '../utils/alerts';
import { Kebab } from '../utils/kebab';
import { resourcePathFromModel } from '../utils/resource-link';
import { TextFilter } from '../factory/text-filter';
import { fuzzyCaseInsensitive } from '../factory/table-filters';
import i18next from 'i18next';
import {
  ClusterGlobalConfig,
  isClusterGlobalConfig,
} from '@console/dynamic-plugin-sdk/src/extensions/cluster-settings';
import { useCanClusterUpgrade } from '@console/shared/src/hooks/useCanClusterUpgrade';
import filterNonUpgradableResources from './filterNonUpgradableResources';
import { IDP_TYPES } from '@console/shared/src/constants/auth';

type ConfigDataType = { model: K8sKind; id: string; name: string; namespace: string };

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
    <Tr data-test-action={item.label}>
      <Td width={30}>
        <Link to={item.path} data-test-id={item.label}>
          {item.label}
        </Link>
        {showAPIGroup && (
          <div className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">{item.apiGroup}</div>
        )}
      </Td>
      <Td visibility={['hidden', 'visibleOnSm']}>
        <div className="co-line-clamp">{item.description || '-'}</div>
      </Td>
      <Td>
        <Kebab options={item.menuItems} />
      </Td>
    </Tr>
  );
};

const useConfigResources = () => {
  const { clusterOperatorConfigResources, configResources } = useSelector<
    RootState,
    { clusterOperatorConfigResources: K8sKind[]; configResources: K8sKind[] }
  >(({ k8s }) => ({
    clusterOperatorConfigResources:
      k8s.getIn(['RESOURCES', 'clusterOperatorConfigResources']) ?? [],
    configResources: k8s.getIn(['RESOURCES', 'configResources']) ?? [],
  }));

  const canClusterUpgrade = useCanClusterUpgrade();
  const adjustedConfigResources = canClusterUpgrade
    ? configResources
    : configResources.filter(filterNonUpgradableResources);

  return [adjustedConfigResources, clusterOperatorConfigResources];
};

export const GlobalConfigPage: React.FCC = () => {
  const { t } = useTranslation();
  const [globalConfigs] = useResolvedExtensions<ClusterGlobalConfig>(isClusterGlobalConfig);
  const [configResources, clusterOperatorConfigResources] = useConfigResources();
  const [errors, setErrors] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [textFilter, setTextFilter] = useState('');

  const oauthMenuItems = _.map(IDP_TYPES, (label: string, id: string) => ({
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

  useEffect(() => {
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
        .flatMap((item) => {
          if (item.model) {
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
          }
          return [];
        })
        .concat([
          {
            label: 'Alertmanager',
            apiGroup: 'monitoring.coreos.com',
            id: 'alertmanager',
            description: 'Configure grouping and routing of alerts',
            path: '/settings/cluster/alertmanagerconfig',
            menuItems: [
              {
                label: t('public~Create Receiver'),
                href: '/settings/cluster/alertmanagerconfig/receivers/~new',
              },
              {
                label: t('public~Edit configuration YAML'),
                href: `/settings/cluster/alertmanageryaml`,
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
    return () => {
      isSubscribed = false;
    };
    // oauthMenuItems, editYAMLMenuItem, viewAPIExplorerMenuItem would cause infinite renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <PaneBody>
      {!loading && (
        <>
          <Content component={ContentVariants.p} className="pf-v6-u-mb-xl">
            {t('public~Edit the following resources to manage the configuration of your cluster.')}
          </Content>
          <Toolbar>
            <ToolbarContent>
              <ToolbarItem>
                <TextFilter
                  value={textFilter}
                  label={t('public~by name or description')}
                  onChange={(_event, val) => setTextFilter(val)}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
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
          <Table gridBreakPoint="">
            <Thead>
              <Tr>
                <Th width={30}>{t('public~Configuration resource')}</Th>
                <Th visibility={['hidden', 'visibleOnSm']}>{t('public~Description')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {_.map(visibleItems, (item) => (
                <ItemRow item={item} key={item.id} showAPIGroup={showAPIGroup(item.label)} />
              ))}
            </Tbody>
          </Table>
        ))}
    </PaneBody>
  );
};
