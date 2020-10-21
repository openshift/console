import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Button } from '@patternfly/react-core';
import { getQuickStartByName } from '../../utils/quick-start-utils';
import { QuickStartTaskStatus } from '../../utils/quick-start-types';
import QuickStartConclusion from '../QuickStartConclusion';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const i18nNS = 'quickstart';

type QuickStartConclusionProps = React.ComponentProps<typeof QuickStartConclusion>;
let wrapper: ShallowWrapper<QuickStartConclusionProps>;
const props: QuickStartConclusionProps = {
  tasks: getQuickStartByName('explore-serverless').spec.tasks,
  allTaskStatuses: [
    QuickStartTaskStatus.SUCCESS,
    QuickStartTaskStatus.SUCCESS,
    QuickStartTaskStatus.SUCCESS,
  ],
  conclusion: 'conclusion',
  onTaskSelect: jest.fn(),
  onQuickStartChange: jest.fn(),
};

describe('QuickStartConclusion', () => {
  beforeEach(() => {
    wrapper = shallow(<QuickStartConclusion {...props} />);
  });

  it('should render conclusion if there are no failed tasks', () => {
    expect(
      wrapper
        .find(SyncMarkdownView)
        .first()
        .props().content,
    ).toEqual('conclusion');
  });

  it('should render link for next quick start if nextQuickStart prop is available and there are no failed tasks', () => {
    wrapper = shallow(<QuickStartConclusion {...props} nextQuickStart="Serverless Application" />);
    expect(
      wrapper
        .find(Button)
        .at(0)
        .props().children[0],
    ).toEqual(`${i18nNS}~Start {{nextQuickStart}} quick start`);
  });

  it('should not render link for next quick start if nextQuickStart props is not available', () => {
    expect(wrapper.find(Button).length).toBe(0);
  });

  it('should not render conclusion, link for next quick start and should render message for retrying if there are failed tasks', () => {
    wrapper = shallow(
      <QuickStartConclusion
        {...props}
        nextQuickStart="Serverless Application"
        allTaskStatuses={[
          QuickStartTaskStatus.FAILED,
          QuickStartTaskStatus.SUCCESS,
          QuickStartTaskStatus.SUCCESS,
        ]}
      />,
    );
    expect(
      wrapper
        .find(SyncMarkdownView)
        .first()
        .props().content,
    ).toEqual(
      `${i18nNS}~One or more verifications did not pass during this quick start. Revisit the tasks or the help links, and then try again.`,
    );
    expect(wrapper.find(Button).length).toBe(0);
  });
});
