import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { withTranslation } from 'react-i18next';

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

class SimpleTabNav_ extends React.Component<SimpleTabNavProps, SimpleTabNavState> {
  constructor(props) {
    super(props);
    this.state = { selectedTab: props.selectedTab };
  }

  onClickTab = (name) => {
    this.props.onClickTab && this.props.onClickTab(name);
    this.setState({
      selectedTab: name,
    });
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const selectedTab = (
      _.find(nextProps.tabs, { name: prevState.selectedTab }) ||
      _.find(nextProps.tabs, { name: nextProps.selectedTab }) ||
      _.head(nextProps.tabs)
    ).name;
    if (prevState.selectedTab !== selectedTab) {
      return {
        selectedTab,
      };
    }
    return null;
  }

  render() {
    const { tabs, tabProps, additionalClassNames } = this.props;
    const { selectedTab } = this.state;
    const selectedTabData = _.find(tabs, { name: selectedTab }) || _.head(tabs);
    const Component = selectedTabData.component;

    return (
      <>
        <ul className={classNames('co-m-horizontal-nav__menu', additionalClassNames)}>
          {_.map(tabs, (tab) => (
            <SimpleTab
              key={tab.name}
              active={selectedTabData.name === tab.name}
              onClick={this.onClickTab}
              title={tab.name}
            />
          ))}
        </ul>
        <Component {...tabProps} />
      </>
    );
  }
}

export const SimpleTabNav = withTranslation()(SimpleTabNav_) as React.FC<SimpleTabNavProps>;

export type Tab = {
  name: string;
  component: any;
};

type SimpleTabNavProps = {
  onClickTab?: (name: string) => void;
  selectedTab?: string;
  tabProps: any;
  tabs: Tab[];
  additionalClassNames?: string;
};

type SimpleTabNavState = {
  selectedTab: string;
};

type SimpleTabProps = {
  active: boolean;
  onClick: (title: string) => void;
  title: string;
};
