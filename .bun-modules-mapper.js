/**
 * Module mapper to support path aliases in tests
 * This is used by Bun's test runner to resolve @bunpress/* imports
 */
module.exports = {
  moduleMappers: [
    {
      // Maps @bunpress/* imports to src/*
      alias: '@bunpress/',
      mapper: 'src/'
    }
  ]
}; 