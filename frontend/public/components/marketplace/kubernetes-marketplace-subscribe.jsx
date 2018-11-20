import * as React from 'react';
import * as _ from 'lodash-es';

import Button from 'patternfly-react/dist/esm/components/Button/Button';
import CatalogItemHeader from 'patternfly-react-extensions/dist/esm/components/CatalogItemHeader/CatalogItemHeader';
import { FieldLevelHelp } from 'patternfly-react';
import { Dropdown, Firehose } from '../utils';
import { ProjectModel } from '../../models';

const getItems = (props) => {
  const {namespace, loaded} = props;
  if (!loaded || !namespace) {
    return {};
  }
  let items = [];
  _.forEach(namespace.data, ns => {
    const name = _.get(ns, 'metadata.name', false);
    if (name) {
      items.push(name);
    }
  });
  items = _.sortBy(items);
  return _.zipObject(items, items);
};

const NamespaceDropdown = (props) => {
  // Some namespaces are too long to fit in the dropdown
  // when the screen is small
  const { title, onChange, id } = props;
  const items = getItems(props);
  return <Dropdown
    title={title}
    id={id}
    items={items}
    dropDownClassName="dropdown--full-width"
    onChange={onChange}
  />;
}

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
        {id === 'namespace'
        ?<Firehose resources={[{ kind: ProjectModel.kind, prop: 'namespace', isList: true }]}>
          <NamespaceDropdown
            title={title}
            id={id}
            onChange={onChange}
          />
        </Firehose>
        :<Dropdown
          title={title}
          id={id}
          items={items}
          dropDownClassName="dropdown--full-width"
          onChange={onChange}
        />}
      </div>
    );
  }
}
class AdminSubscribe extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      form: {
        dropdowns: {
          namespace: null,
          channel: null,
          strategy: null
        }
      }
    };
  }

  onChange(selected, id) {
    this.setState((prevState) => {
      const form = prevState.form;
      form.dropdowns[id] = selected;
      return {
        form: form
      };
    });
  }

  render () {
    const { item, close, subscribe } = this.props;
    if (item === null) {
      return null;
    }
    const { name, imgUrl, provider, description } = item;

    const form = [
      {
        title: 'Target Namespace',
        id: 'namespace',
        help: 'Select a namespace to subscribe this operator to.',
      },
      {
        title: 'Update Channel',
        id: 'channel',
        items: {
          stable: 'Stable',
          latest: 'Latest'
        }
      },
      {
        title: 'Update Strategy',
        id: 'strategy',
        items: {
          automatic: 'Automatic',
          manual: 'Manual'
        }
      }
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
            <Button bsStyle="primary" className="btn-cancel" onClick={() => subscribe(this.state.form.dropdowns.namespace)}>
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
            vendor={<span> {provider}</span>}
          />
          <div style={{ marginTop : '20px' }}>
            {description}
          </div>
        </div>
      </div>
    );
  }
}
export { AdminSubscribe };
