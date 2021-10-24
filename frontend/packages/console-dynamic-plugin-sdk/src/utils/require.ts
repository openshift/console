/* eslint-disable */

export const safeRequire = (modulePath) => {
    let module;
    try {
        module = require(modulePath);
    } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND') {
            throw error;
        } else {
            console.error(error);
        }
    }
    return module;
}