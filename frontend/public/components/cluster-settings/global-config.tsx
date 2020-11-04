import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { AlertVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

import { RootState } from '../../redux';
import { K8sKind, k8sList, referenceForModel, getResourceDescription } from '../../module/k8s';
import { EmptyBox, ExpandableAlert, Kebab, LoadingBox, resourcePathFromModel } from '../utils';
import { addIDPItems } from './oauth';
import { TextFilter } from '../factory';
import { fuzzyCaseInsensitive } from '../factory/table-filters';
import { withExtensions, isGlobalConfig, GlobalConfig } from '@console/plugin-sdk';

const stateToProps = (state: RootState) => ({
  configResources: state.k8s.getIn(['RESOURCES', 'configResources']),
});

const ItemRow = ({ item }) => {
  return (
    <div className="row co-resource-list__item" data-test-action={item.label}>
      <div className="col-xs-10 col-sm-4">
        <Link to={item.path} data-test-id={item.label}>
          {item.label}
        </Link>
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
  configResources,
  globalConfigs,
}) => {
  const [errors, setErrors] = React.useState([]);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [textFilter, setTextFilter] = React.useState('');
  const { t } = useTranslation();

  const oauthMenuItems = _.map(addIDPItems, (label: string, id: string) => ({
    label: t('oauth~{{label}}', { label }),
    href: `/settings/idp/${id}`,
  }));

  React.useEffect(() => {
    const editYAMLMenuItem = (name: string, resourceLink: string) => ({
      label: t('global-config~Edit {{name}} resource', { name }),
      href: `${resourceLink}/yaml`,
    });
    const viewAPIExplorerMenuItem = (name: string, apiExplorerLink: string) => ({
      label: t('global-config~Explore {{name}} API', { name }),
      href: apiExplorerLink,
    });
    let isSubscribed = true;
    Promise.all(
      configResources.map((model: K8sKind) => {
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
      const winnowedResponses = flattenedResponses.map((item) => ({
        model: item.model,
        uid: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        kind: item.kind,
      }));
      const usableConfigs = globalConfigs.map((item) => item.properties);
      const allItems = [...winnowedResponses, ...usableConfigs]
        .map((item) => {
          const apiExplorerLink = `/api-resource/cluster/${referenceForModel(item.model)}`;
          const resourceLink = resourcePathFromModel(item.model, item.name, item.namespace);
          return {
            label: item.kind,
            id: item.uid,
            description: getResourceDescription(item.model),
            path: resourceLink,
            menuItems: [
              editYAMLMenuItem(item.kind, resourceLink),
              viewAPIExplorerMenuItem(item.kind, apiExplorerLink),
              ...(item.kind === 'OAuth' ? oauthMenuItems : []),
            ],
          };
        })
        .concat([
          {
            label: 'Alertmanager',
            id: 'alertmanager',
            description: 'Configure grouping and routing of alerts',
            path: '/monitoring/alertmanagerconfig',
            menuItems: [
              {
                label: t('global-config~Create Receiver'),
                href: '/monitoring/alertmanagerconfig/receivers/~new',
              },
              {
                label: t('global-config~Edit configuration YAML'),
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
  }, [configResources, errors, globalConfigs, oauthMenuItems, t]);
  const visibleItems = items.filter(({ label, description = '' }) => {
    return (
      fuzzyCaseInsensitive(textFilter, label) ||
      description.toLowerCase().indexOf(textFilter.toLowerCase()) !== -1
    );
  });

  return (
    <div className="co-m-pane__body">
      {!loading && (
        <>
          <p className="co-help-text">
            {t(
              'global-config~Edit the following resources to manage the configuration of your cluster.',
            )}
          </p>
          <div className="co-m-pane__filter-row">
            <TextFilter
              value={textFilter}
              label={t('global-config~by name or description')}
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
          <EmptyBox label={t('global-config~Configuration resources')} />
        ) : (
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <div className="row co-m-table-grid__head">
              <div className="col-xs-10 col-sm-4">{t('global-config~Configuration resource')}</div>
              <div className="hidden-xs col-sm-7">{t('global-config~Description')}</div>
              <div />
            </div>
            <div className="co-m-table-grid__body">
              {_.map(visibleItems, (item) => (
                <ItemRow item={item} key={item.id} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};

export const GlobalConfigPage = connect(stateToProps)(
  withExtensions<GlobalConfigPageExtensionProps>({ globalConfigs: isGlobalConfig })(
    GlobalConfigPage_,
  ),
);

type GlobalConfigPageExtensionProps = {
  globalConfigs: GlobalConfig[];
};

type GlobalConfigPageProps = GlobalConfigPageExtensionProps & {
  configResources: K8sKind[];
};
