import * as React from 'react';
import { shallow } from 'enzyme';

import {
  GettingStartedLink,
  GettingStartedCard,
  GettingStartedCardProps,
} from '../GettingStartedCard';

describe('GettingStartedCard', () => {
  it('should render without any props without an error', () => {
    shallow(<GettingStartedCard {...({} as GettingStartedCardProps)} />);
  });

  it('should render the title', () => {
    const wrapper = shallow(<GettingStartedCard id="card" title="Card title" links={[]} />);

    expect(wrapper.render().text()).toContain('Card title');
  });

  it('should render the title and description', () => {
    const wrapper = shallow(
      <GettingStartedCard
        id="card"
        title="Card title"
        description="Some more details..."
        links={[]}
      />,
    );

    expect(wrapper.render().text()).toContain('Card title');
    expect(wrapper.render().text()).toContain('Some more details...');
  });

  it('should render all link as button or link', () => {
    const links: GettingStartedLink[] = [
      { id: 'button', title: 'Button', onClick: () => null },
      { id: 'internallink', title: 'Internal link', href: '/' },
      {
        id: 'externallink',
        title: 'External link',
        href: 'https://www.openshift.com/',
        external: true,
      },
    ];
    const wrapper = shallow(<GettingStartedCard id="card" title="Card title" links={links} />);

    expect(wrapper.find('SimpleListItem')).toHaveLength(3);
  });

  it('should render internal more link', () => {
    const moreLink: GettingStartedLink = { id: 'moreLink', title: 'Another link', href: '/' };

    const wrapper = shallow(
      <GettingStartedCard id="card" title="Card title" links={[]} moreLink={moreLink} />,
    );

    expect(wrapper.find('Link')).toHaveLength(1);
    expect(wrapper.find('ExternalLinkAltIcon')).toHaveLength(0);
  });

  it('should render external more link', () => {
    const moreLink: GettingStartedLink = {
      id: 'moreLink',
      title: 'OpenShift',
      href: 'https://www.openshift.com/',
      external: true,
    };

    const wrapper = shallow(
      <GettingStartedCard id="card" title="Card title" links={[]} moreLink={moreLink} />,
    );

    expect(wrapper.find('a')).toHaveLength(1);
    expect(wrapper.find('ExternalLinkAltIcon')).toHaveLength(1);
  });
});
