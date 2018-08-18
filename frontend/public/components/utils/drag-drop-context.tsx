import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

// Need to create this decorator, because of the issue with react-dnd module:
// https://github.com/react-dnd/react-dnd/issues/186#issuecomment-282789420
export default DragDropContext(HTML5Backend);
