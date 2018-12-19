import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';

import Button from 'patternfly-react/dist/esm/components/Button/Button';
import CatalogItemHeader from 'patternfly-react-extensions/dist/esm/components/CatalogItemHeader/CatalogItemHeader';
import { FieldLevelHelp } from 'patternfly-react';

import { Dropdown, Firehose } from '../utils';
import { ProjectModel } from '../../models';
import {MarketplacePage} from './marketplace-page';

const getNamespaceItems = (props) => {
  const {namespace, loaded} = props;
  if (!loaded || !namespace) {
    return {};
  }
  let items = _.reduce(namespace.data, (acc, ns) => {
    const name = _.get(ns, 'metadata.name', false);
    if (name) {
      acc.push(name);
    }
    return acc;
  }, []);
  items = _.sortBy(items);
  return _.zipObject(items, items);
};

const getChannelItems = (channels) => {
  let items = _.reduce(channels, (acc, channel) => {
    if (channel.name) {
      acc.push(channel.name);
    }
    return acc;
  }, []);
  items = _.sortBy(items);
  return _.zipObject(items, items);
};

const NamespaceDropdown = (props) => {
  const { title, onChange, id } = props;
  const items = getNamespaceItems(props);
  return <Dropdown title={title} id={id} items={items} dropDownClassName="dropdown--full-width" onChange={onChange} />;
};

class DropdownElement extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const { title, id, items, onChange, help } = this.props;
    return (
      <div className="co-marketplace-subscribe--dropdownelement">
        {title}
        {help && <FieldLevelHelp content={help} />}
        <br />
        {id === 'namespace' ?
        <Firehose resources={[{ kind: ProjectModel.kind, prop: 'namespace', isList: true }]}>
          <NamespaceDropdown title={title} id={id} onChange={onChange} />
        </Firehose>
        :
        <Dropdown title={title} id={id} items={items} dropDownClassName="dropdown--full-width" onChange={onChange} />
        }
      </div>
    );
  }
};

const CreateSubscription = (props) => {
  const {items, loaded, item, dropdown} = props;
  if (!loaded || !items) {
    return <MsgBox title="Issue Loading Existing Subscriptions" detail="Cannot create a Subscription without first knowing what subscriptions already exist." />;
  }

  const subscriptionNames = _.map(items, (subscription) => _.get(subscription, 'metadata.generateName'));
  if (_.includes(subscriptionsNames, item.name)) {
    return <MsgBox title="Subscription Already Exists" detail="A subscription with this operator already exists in this namespace." />;
  }

  const {namespace, channel, strategy} = dropdown;
  const {name, channels, catalogSource, catalogSourceNamespace} = item;
  
  const updateChannel = _.reduce(channels, (acc, ch) => {
    if (ch.name === channel) {
      acc.push({name: ch.name, currentCSV: ch.currentCSV});
    }
    return acc;
  }, [])[0];

  const subscription = {
    apiVersion: `${SubscriptionModel.apiGroup}/${SubscriptionModel.apiVersion}`,
    kind: `${SubscriptionModel.kind}`,
    metadata: {
      generateName: `${name}`, // the name of the subscription object - need to check that a subscription doesn't already exist before creating it
      namespace: `${namespace}`,  // targetNamespace provided by the user in the UI
    },
    spec: {
      source: `${catalogSource}`, // catalogsource name - query the openshift-operators namespace to get the name?
      sourceNamespace: `${catalogSourceNamespace}`, // where the catalogsource is
      name: `${name}`, // what is this?
      startingCSV: `${updateChannel.currentCSV}`,
      channel: `${updateChannel.name}`,
      installPlanApproval: `${strategy}`,
    },
  };

  // k8sCreate(CatalogSourceConfigModel, catalogSourceConfig).then(k8sCreate(SubscriptionModel, subscription));
  k8sCreate(SubscriptionModel, subscription);
  return <MarketplacePage/>;
}

const subscribe = (dropdown, item) => {
  const {namespace} = dropdown;
  const resources = [];
  resources.push({
    isList: true,
    kind: referenceForModel(SubscriptionModel),
    namespace: `${namespace}`,
    prop: 'subscriptions',
  });
  return <Firehose resources={resources}>
    <CreateSubscription item={item} dropdown={dropdown}/>
  </Firehose>;
};

export class MarketplaceSubscribe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      form: {
        dropdowns: {
          namespace: null,
          channel: null,
          strategy: null,
        },
      },
    };
  }

  onChange(selected, id) {
    this.setState((prevState) => {
      const form = prevState.form;
      form.dropdowns[id] = selected;
      return {
        form: form,
      };
    });
  }

  render() {
    const { item, close, subscribe } = this.props;
    if (item === null) {
      return null;
    }
    const { name, imgUrl, version, provider, description, channels } = item;

    const updateChannels = getChannelItems(channels);

    const form = [
      {
        title: 'Target Namespace',
        id: 'namespace',
        help: 'Select a namespace to subscribe this operator to.',
      },
      {
        title: 'Update Channel',
        id: 'channel',
        items: updateChannels,
      },
      {
        title: 'Update Strategy',
        id: 'strategy',
        items: {
          Automatic: 'Automatic',
          Manual: 'Manual',
        },
      },
    ];
    return (
      <div className="co-marketplace-subscribe">
        <div className="co-marketplace-subscribe--header">
          <h1>Subscribe Service</h1>
          <p className="co-help-text">Select the namespace where you want to make the application available and select channel and update strategy.</p>
        </div>
        <div className="co-marketplace-subscribe--form">
          <div className="co-marketplace-subscribe--dropdowns">
            { form &&
              form.map((dropdown, index) => (
                <DropdownElement
                  key={`subscribe-dropdown-${dropdown.id}-${index}`}
                  id={dropdown.id}
                  title={dropdown.title}
                  items={dropdown.items}
                  help={dropdown.help}
                  onChange={(selected) => this.onChange(selected, dropdown.id)}
                />
              ))
            }
          </div>
          <div className="co-marketplace-subscribe--buttons">
            <Button bsStyle="primary" className="btn-cancel" onClick={() => subscribe(this.state.form.dropdowns, item)}>
              Subscribe
            </Button>
            <Button bsStyle="default" onClick={close}>
              Cancel
            </Button>
          </div>
        </div>
        <div className="co-marketplace-subscribe--description">
          <CatalogItemHeader
            className="long-description-test"
            iconImg={imgUrl}
            title={name}
            vendor={`${version} provided by ${provider}`}
          />
          <div style={{ marginTop : '20px' }}>
            {description}
          </div>
        </div>
      </div>
    );
  }
}

MarketplaceSubscribe.displayName = 'MarketplaceSubscribe';
MarketplaceSubscribe.propTypes = {
  item: PropTypes.object,
};
