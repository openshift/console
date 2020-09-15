module.exports = {
  root: true,
  extends: ['plugin:console/node-typescript-prettier'],
  plugins: ["cypress"],
  rules: {
    "no-console": "off",
    "no-namespace": "off",
    "no-redeclare": "off",
    "promise/catch-or-return": "off"
  }
};
