import * as React from 'react';
import SvgDefsContext, { SvgDefsContextProps } from './SvgDefsContext';

export interface SvgDefsProps {
  id: string;
  children: React.ReactNode;
}

export type SvgDefsSetterProps = SvgDefsContextProps & SvgDefsProps;

export const SvgDefsSetter: React.FC<SvgDefsSetterProps> = (props) => {
  const { id, children } = props;

  const { addDef, removeDef } = React.useContext(SvgDefsContext);

  React.useEffect(() => {
    addDef(id, children);

    return () => {
      removeDef(id);
    };
  }, [id, children, addDef, removeDef]);

  return null;
};

/**
 * Contributes `children` to the parent SVG `<defs>` element.
 * A contribution is assumed to be static in nature in that the children will never change
 * for a given ID. This is because there may be multiple children referencing the same defs contribution.
 * The assumption must be that there is not a single owner but many owners and therefore each
 * owner must be contributing the same def.
 */
const SvgDefs: React.FC<SvgDefsProps> = React.memo(
  (props) => {
    return (
      <SvgDefsContext.Consumer>
        {({ addDef, removeDef }) => (
          <SvgDefsSetter {...props} addDef={addDef} removeDef={removeDef} />
        )}
      </SvgDefsContext.Consumer>
    );
  },
  () => true,
);

SvgDefs.displayName = 'SvgDefs';

export default SvgDefs;
