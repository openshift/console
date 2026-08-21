function sanitizeHtml(dirty) {
  return dirty;
}

sanitizeHtml.simpleTransform = function () {
  return function (tagName, attribs) {
    return { tagName, attribs };
  };
};

sanitizeHtml.defaults = { allowedTags: [], allowedAttributes: {} };

module.exports = sanitizeHtml;
module.exports.default = sanitizeHtml;
