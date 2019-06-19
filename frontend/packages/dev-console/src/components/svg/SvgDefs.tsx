import * as React from 'react';
import SvgDefsContext, { SvgDefsContextProps } from './SvgDefsContext';

export interface SvgDefsProps {
  id: string;
  children: React.ReactNode;
}

export type SvgDefsSetterProps = SvgDefsContextProps & SvgDefsProps;

export class SvgDefsSetter extends React.Component<SvgDefsSetterProps> {
  static contextType = SvgDefsContext;

  componentDidMount() {
    const { addDef, id, children } = this.props;
    addDef(id, children);
  }

  componentDidUpdate() {
    const { addDef, id, children } = this.props;
    addDef(id, children);
  }

  componentWillUnmount() {
    const { removeDef, id } = this.props;
    removeDef(id);
  }

  render() {
    return null;
  }
}

/**
 * Contributes `children` to the parent SVG `<defs>` element.
 * A contribution is assumed to be static in nature in that the children will never change
 * for a given ID. This is because there may be multiple children referencing the same defs contribution.
 * The assumption must be that there is not a single owner but many owners and therefore each
 * owner must be contributing the same def.
 */
export default class SvgDefs extends React.Component<SvgDefsProps> {
  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <SvgDefsContext.Consumer>
        {({ addDef, removeDef }) => (
          <SvgDefsSetter {...this.props} addDef={addDef} removeDef={removeDef} />
        )}
      </SvgDefsContext.Consumer>
    );
  }
}
