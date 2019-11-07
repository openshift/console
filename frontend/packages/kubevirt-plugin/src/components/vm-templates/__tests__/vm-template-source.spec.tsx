import * as React from 'react';
import { shallow } from 'enzyme';
import { TemplateSource } from '../vm-template-source';
import { containerTemplate } from '../../../../integration-tests/tests/utils/templates/containerTemplate';
import { pxeTemplate } from '../../../../integration-tests/tests/utils/templates/pxeTemplate';
import { urlTemplate } from '../../../../integration-tests/tests/utils/templates/urlTemplate';

const testTemplateSource = ({ props }) => <TemplateSource {...props} />;

describe('<TemplateSource />', () => {
  it('renders correctly', () => {
    const tests = [
      {
        props: {
          template: pxeTemplate,
        },
      },
      {
        props: {
          template: pxeTemplate,
          detailed: true,
        },
      },
      {
        props: {
          template: containerTemplate,
        },
      },
      {
        props: {
          template: containerTemplate,
          detailed: true,
        },
      },
      {
        props: {
          template: urlTemplate,
        },
      },
      {
        props: {
          template: urlTemplate,
          detailed: true,
        },
      },
    ];
    tests.forEach((fixture) => {
      const component = shallow(testTemplateSource(fixture));
      expect(component).toMatchSnapshot();
    });
  });
});
