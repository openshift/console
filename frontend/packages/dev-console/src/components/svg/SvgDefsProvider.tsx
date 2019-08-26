import * as React from 'react';
import SvgDefsContext, { SvgDefsContextProps } from './SvgDefsContext';

interface DefsMap {
  [id: string]: {
    count: number;
    node: React.ReactNode;
  };
}

export interface DefsState {
  defs?: DefsMap;
}

export class Defs extends React.PureComponent<{}, DefsState> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  public setDefs(defs: DefsMap) {
    // setting the state will re-render this component
    this.setState({ defs: { ...defs } });
  }

  render() {
    const { defs } = this.state;
    return defs ? (
      <defs>
        {Object.keys(defs).map((id) => (
          <React.Fragment key={id}>{defs[id].node}</React.Fragment>
        ))}
      </defs>
    ) : null;
  }
}

export interface SvgDefsProviderProps {
  children?: React.ReactNode;
}

/**
 * Renders a `<defs>` element and sets up a {@link SvgDefsContext} provider such that child components
 * may contribute to the `<defs>` without the parent component needing explicit knowledge of each contribution.
 * This helps decouple the parent implementation from the children and ensures that duplicate defs entries,
 * such as filters, are eliminated.
 */
const SvgDefsProvider: React.FC<SvgDefsProviderProps> = (props) => {
  const defsRef = React.useRef<Defs>();

  const defs = React.useRef<DefsMap>({});

  const updateDefs = () => {
    // Set the defs directly on the child component so that only it will re-render.
    // Does not use `setState` because otherwise all child components would be re-renders again
    // when only the `Defs` component needs to be rendered.
    defsRef.current && defsRef.current.setDefs(defs.current);
  };

  const contextValue: SvgDefsContextProps = {
    addDef: (id, node) => {
      const defObj = defs.current[id];
      if (defObj) {
        defObj.count++;
      } else {
        defs.current[id] = {
          count: 1,
          node,
        };
        updateDefs();
      }
    },
    removeDef: (id) => {
      const defObj = defs.current[id];
      if (--defObj.count === 0) {
        delete defs.current[id];
        updateDefs();
      }
    },
  };

  return (
    <SvgDefsContext.Provider value={contextValue}>
      <Defs ref={defsRef} />
      {props.children}
    </SvgDefsContext.Provider>
  );
};

export default SvgDefsProvider;
