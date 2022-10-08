module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  modulePathIgnorePatterns: ["./dist/", "./temps/", "./test/mocks.ts"],
  coveragePathIgnorePatterns: ["./test/mocks.ts"],
}
