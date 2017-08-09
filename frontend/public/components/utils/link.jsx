import React from 'react';

import { CONST } from '../../const';

const basePathPattern = new RegExp(`^${window.SERVER_FLAGS.basePath}`);
const nsPathPattern = new RegExp(`^/?ns/${CONST.legalNamePattern.source}/?(.*)$`);
const allNsPathPattern = /^\/?all-namespaces\/?(.*)$/;

export const stripBasePath = path => path.replace(basePathPattern, '');

export const isNamespaced = path => {
  const subpath = stripBasePath(path);
  return subpath.match(nsPathPattern) || subpath.match(allNsPathPattern);
};
