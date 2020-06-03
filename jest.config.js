// siumlate offline for testing
process.env.IS_OFFLINE = "true";
process.env.IS_TESTING = "true";

module.exports = {
  collectCoverage: false,
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 20000,
  watchPathIgnorePatterns: ["<rootDir>/tests/configs"],
};
