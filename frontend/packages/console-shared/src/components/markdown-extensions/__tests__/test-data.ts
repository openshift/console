import { MARKDOWN_COPY_BUTTON_ID, MARKDOWN_SNIPPET_ID, MARKDOWN_EXECUTE_BUTTON_ID } from '../const';

export const htmlDocumentForCopyClipboard = `<div id="copy-markdown-1"><div ${MARKDOWN_SNIPPET_ID}="1234">some test data for testing</div><button ${MARKDOWN_COPY_BUTTON_ID}="1234"</button><div ${MARKDOWN_SNIPPET_ID}="12354">some test data for testing</div><button ${MARKDOWN_COPY_BUTTON_ID}="12354"</button></div>`;

export const htmlDocumentForExecuteButton = `<div id="execute-markdown-1"><div ${MARKDOWN_SNIPPET_ID}="1234">some test data for testing</div><button ${MARKDOWN_EXECUTE_BUTTON_ID}="1234"</button><div ${MARKDOWN_SNIPPET_ID}="12354">some test data for testing</div><button ${MARKDOWN_EXECUTE_BUTTON_ID}="12354"</button></div>`;
