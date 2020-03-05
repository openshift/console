import * as React from 'react';
import { Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import { shallow, mount, ShallowWrapper, ReactWrapper } from 'enzyme';

import store from '@console/internal/redux';
import {
  PageHeading,
  PageHeadingProps,
  BreadCrumbs,
  BreadCrumbsProps,
} from '../../../public/components/utils/headings';
import { ResourceIcon } from '../../../public/components/utils';
import { testResourceInstance } from '../../../__mocks__/k8sResourcesMocks';

describe(BreadCrumbs.displayName, () => {
  let wrapper: ShallowWrapper<BreadCrumbsProps>;
  let breadcrumbs: BreadCrumbsProps['breadcrumbs'];

  beforeEach(() => {
    breadcrumbs = [
      { name: 'pods', path: '/pods' },
      { name: 'containers', path: '/pods' },
    ];
    wrapper = shallow(<BreadCrumbs breadcrumbs={breadcrumbs} />);
  });

  it('renders each given breadcrumb', () => {
    const links: ShallowWrapper<any> = wrapper.find(Link);
    const nonLink: ShallowWrapper<any> = wrapper.findWhere(
      (BreadcrumbItem) => BreadcrumbItem.props().isActive === true,
    );

    expect(links.length + nonLink.length).toEqual(breadcrumbs.length);

    breadcrumbs.forEach((crumb, i) => {
      if (i < links.length) {
        expect(links.at(i).props().to).toEqual(crumb.path);
        expect(
          links
            .at(i)
            .childAt(0)
            .text(),
        ).toEqual(crumb.name);
      } else {
        expect(nonLink.render().text()).toEqual(crumb.name);
      }
    });
  });
});

describe(PageHeading.displayName, () => {
  let wrapper: ReactWrapper<PageHeadingProps>;

  beforeEach(() => {
    // Need full mount with redux store since this is a redux-connected component
    wrapper = mount(<PageHeading.WrappedComponent obj={null} />, {
      wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  });

  it('renders resource icon if given `kind`', () => {
    const kind = 'Pod';
    wrapper.setProps({ kind });
    const icon = wrapper.find(ResourceIcon);

    expect(icon.exists()).toBe(true);
    expect(icon.props().kind).toEqual(kind);
  });

  it('renders custom title component if given', () => {
    const title = <span>My Custom Title</span>;
    wrapper.setProps({ title });

    expect(wrapper.find('.co-m-pane__heading').contains(title)).toBe(true);
  });

  it('renders breadcrumbs if given `breadcrumbsFor` function', () => {
    const breadcrumbs = [];
    wrapper = wrapper.setProps({
      breadcrumbsFor: () => breadcrumbs,
      obj: { data: testResourceInstance, loaded: true, loadError: null },
    });

    expect(wrapper.find(BreadCrumbs).exists()).toBe(true);
    expect(wrapper.find(BreadCrumbs).props().breadcrumbs).toEqual(breadcrumbs);
  });

  it('does not render breadcrumbs if object has not loaded', () => {
    wrapper = wrapper.setProps({ breadcrumbsFor: () => [], obj: null });

    expect(wrapper.find(BreadCrumbs).exists()).toBe(false);
  });
});
