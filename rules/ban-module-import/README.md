This rule is to prevent importing a module from a specific path. It is useful when you want to prevent importing a module from a specific path.

# Usage
```json
{
  "rules": {
    "@dalife/ban-module-import": ["error", {
      "banModules": [
        "history", // prevent importing history module
        "@dalife/*_node" // prevent import with glob format support
      ],
    }]
  }
}
```

# Options
## Options.banModules `array<string>`

The list of modules to ban. Each item is string and it supports glob format.
