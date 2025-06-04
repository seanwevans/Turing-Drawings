export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.jsx'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
};
