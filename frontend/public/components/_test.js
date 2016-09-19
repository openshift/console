// TODO: this is only temporary while we determine
// a better way to run plain JavaScript and React
// tests.
//
// Example usage:
//
// const myComponent = { ComponentA, ComponentB };
// export default myComponent;
// window.tectonicTesting && ( window.tectonicTesting.myComponent = myComponent );
//
// This way we only populate window when running tests.
//
// https://github.com/coreos-inc/bridge/issues/915

window.tectonicTesting = {};
