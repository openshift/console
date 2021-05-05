import * as ts from 'typescript';
import * as tsu from 'tsutils';
import * as _ from 'lodash';

const getJSDoc = (node: ts.Node): ts.JSDoc[] => (tsu.canHaveJsDoc(node) ? tsu.getJsDoc(node) : []);

export const getJSDocComments = (node: ts.Node) => _.compact(getJSDoc(node).map((d) => d.comment));

export const printJSDocComments = (docComments: string[]) => docComments.join('\n\n').trim();
