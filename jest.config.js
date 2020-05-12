// siumlate offline for testing
process.env.IS_OFFLINE = "true";
process.env.IS_TESTING = "true";

module.exports = {
  collectCoverage: true,
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 10000,
  watchPathIgnorePatterns: ["<rootDir>/tests/configs"]
};
