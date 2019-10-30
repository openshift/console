import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';

class SimpleTab extends React.PureComponent<SimpleTabProps> {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    this.props.onClick(this.props.title);
  }

  render() {
    const { active, title } = this.props;
    const className = classNames('co-m-horizontal-nav__menu-item', {
      'co-m-horizontal-nav-item--active': active,
    });
    return (
      <li className={className}>
        <button onClick={this.onClick} type="button">
          {title}
        </button>
      </li>
    );
  }
}

export class SimpleTabNav extends React.Component<SimpleTabNavProps, SimpleTabNavState> {
  constructor(props) {
    super(props);
    this.onClickTab = this.onClickTab.bind(this);
    const selectedTab = _.find(props.tabs, { name: props.selectedTab }) || _.head(props.tabs);
    this.state = { selectedTab };
  }

  onClickTab(name) {
    const { tabs } = this.props;
    this.props.onClickTab && this.props.onClickTab(name);
    this.setState({
      selectedTab: _.find(tabs, { name }),
    });
  }

  render() {
    const { tabs, tabProps, additionalClassNames } = this.props;
    const { selectedTab } = this.state;
    const Component = selectedTab.component;

    return (
      <>
        <div className={classNames('co-m-horizontal-nav__menu', additionalClassNames)}>
          <ul className="co-m-horizontal-nav__menu-list">
            {_.map(tabs, (tab) => (
              <SimpleTab
                active={selectedTab.name === tab.name}
                key={tab.name}
                onClick={this.onClickTab}
                title={tab.name}
              />
            ))}
          </ul>
        </div>
        <Component {...tabProps} />
      </>
    );
  }
}

type SimpleTabNavProps = {
  onClickTab?: (name: string) => void;
  selectedTab?: string;
  tabProps: any;
  tabs: {
    name: string;
    component: any;
  }[];
  additionalClassNames?: string;
};

type SimpleTabNavState = {
  selectedTab: any;
};

type SimpleTabProps = {
  active: boolean;
  onClick: (title: string) => void;
  title: string;
};
