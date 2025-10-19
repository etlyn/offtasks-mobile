const React = require('react');

module.exports = new Proxy(
  {},
  {
    get: (_, property) => {
      if (property === 'default') {
        return ({ children }) => React.createElement(React.Fragment, null, children);
      }

      return () => null;
    },
  }
);
