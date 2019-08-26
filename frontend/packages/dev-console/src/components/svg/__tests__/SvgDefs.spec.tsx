import * as React from 'react';
import { mount } from 'enzyme';
import { SvgDefsSetter, SvgDefsSetterProps } from '../SvgDefs';
import SvgDefsContext from '../SvgDefsContext';

// FIXME context api enzyme error: Enzyme Internal Error: unknown node with tag 13
// need to update enzyme and enzyme-adapter-react-16
// describe('SvgDefs', () => {
//   it('should get #addDef and #removeDef from context', () => {
//     const contextProps: SvgDefsContextProps = {
//       addDef: jest.fn(),
//       removeDef: jest.fn(),
//     };
//     const props: SvgDefsProps = {
//       id: 'foo',
//       children: <span />,
//     };
//     const wrapper = mount(
//       <SvgDefsContext.Provider value={contextProps}>
//         <SvgDefs {...props} />
//       </SvgDefsContext.Provider>,
//     );
//     const innerWrapper = wrapper.find(SvgDefsSetter).first();
//     expect(innerWrapper.props()).toEqual({
//       ...contextProps,
//       ...props,
//     });
//   });
// });

describe('SvgDefsSetter', () => {
  it('should callback #addDef and #removeDef on update', () => {
    const props: SvgDefsSetterProps = {
      id: 'foo',
      addDef: jest.fn(),
      removeDef: jest.fn(),
      children: <span />,
    };

    const wrapper = mount(
      <SvgDefsContext.Provider value={props}>
        <SvgDefsSetter {...props} />
      </SvgDefsContext.Provider>,
    );
    expect(props.addDef).toHaveBeenCalledWith(props.id, props.children);

    // FIXME Enzyme doesn't support setting props on nested component.
    // Will look further to validate
    // test update
    // const newChild = <div />;
    // wrapper.setProps({ children: newChild });
    // expect(props.addDef).toHaveBeenCalledTimes(2);
    // expect(props.addDef).toHaveBeenLastCalledWith(props.id, newChild);

    // test unmount
    wrapper.unmount();
    expect(props.removeDef).toHaveBeenCalledTimes(1);
    expect(props.removeDef).toHaveBeenLastCalledWith(props.id);
  });
});
