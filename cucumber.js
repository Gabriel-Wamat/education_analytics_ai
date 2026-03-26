module.exports = {
  default: {
    format: ["progress"],
    paths: ["tests/acceptance/features/**/*.feature"],
    require: [
      "tests/acceptance/support/**/*.ts",
      "tests/acceptance/steps/**/*.ts"
    ],
    requireModule: ["ts-node/register/transpile-only"]
  }
};
