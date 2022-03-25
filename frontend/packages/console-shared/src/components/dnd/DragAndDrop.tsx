import * as React from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

const useDNDProviderElement = (props) => {
  const backend = React.useRef(HTML5Backend);

  if (!props.children) return null;

  return <DndProvider backend={backend.current}>{props.children}</DndProvider>;
};

const DragAndDrop = (props) => {
  const DNDElement = useDNDProviderElement(props);
  return <>{DNDElement}</>;
};

export default DragAndDrop;
