module.exports = {
  rules: {
    "ban-module-import": require("./lib/rules/ban-module-import").rule,
    "ban-module-import-warn": require("./lib/rules/ban-module-import-warn")
      .rule,
    "dom-listener-pairs": require("./lib/rules/dom-listener-pairs").rule,
    "timer-must-clear": require("./lib/rules/timer-must-clear").rule,
    "import-source-in-deps": require("./lib/rules/import-source-in-deps").rule,
    "import-type": require("./lib/rules/import-type").rule,
    "ban-reexport-star": require("./lib/rules/ban-reexport-star").rule,
    "no-deprecated-type-React.FC":
      require("./lib/rules/no-deprecated-type-React.FC").rule,
    "react-v17": require("./lib/rules/react-v17").rule,
    "prevent-same-call-stack-rerender":
      require("./lib/rules/prevent-same-call-stack-rerender").rule,
    "react-prefer-named-imports":
      require("./lib/rules/react-prefer-named-imports").rule,
  },
};
