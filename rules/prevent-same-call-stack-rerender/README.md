This rule is to check whether there are react rerender issues by updating different states in the same call stack.

# Usage

```json
{
  "rules": {
    "@dalife/no-multi-update-state": ["error"]
  }
}
```

# 👿

```tsx
useEffect(() => {
  setLoading(true);
  fetchData().then((resp) => {
    setData(resp.data);
    setLoading(false);
  });
}, []);
```

# 😃

```tsx
import { unstable_batchedUpdates } from 'react-dom';

useEffect(() => {
  setLoading(true);
  fetchData().then((resp) => {
    unstable_batchedUpdates(() => {
      setData(resp.data);
      setLoading(false);
    });
  });
}, []);

// It is allowed to call setState multiple times in useEffect, Because useEffect is controlled by react which has handled internally into a batch operation.
useEffect(() => {
  setA(calc(a));
  setB(calc(b));
}, [a, b]);
```
