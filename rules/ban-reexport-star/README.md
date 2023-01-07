This rule is to prevent reexporting a module with star syntax. It is useful when you want to prevent reexporting modules with star syntax.

# Usage
```json
{
  "rules": {
    "@dalife/ban-reexport-star": ["error"]
  }
}
```

# 👿
``` ts
export * from 'xxx';
```

# 😃
``` ts
export default function test() {};
export const a = 1;
export { b } from 'xxx1';
export { default as c } from 'xxx2'
```