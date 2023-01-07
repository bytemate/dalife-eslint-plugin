This rule is to check whether the module needs to use import type syntax


# Usage
```json
{
  "rules": {
    "@dalife/import-type": [
      "error",
      {
        "typeOnImportedNames": true // 使用ts 4.5.4版本 type规则, 默认为 false
      }
    ]
  }
}
```

# typeOnImportedNames === false
## 👿
```tsx
import { ColumnType } from 'antd/lib/table';
const columns: ColumnType<any>[] = [];
```

## 😃
```tsx
import type { ColumnType } from 'antd/lib/table';
const columns: ColumnType<any>[] = [];
```

# typeOnImportedNames === true
## 👿
```tsx
import { ColumnType } from 'antd/lib/table';
const columns: ColumnType<any>[] = [];
```

## 😃
```tsx
import { type ColumnType } from 'antd/lib/table';
const columns: ColumnType<any>[] = [];
```