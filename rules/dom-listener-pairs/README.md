This rule is to detect whether the DOM event listener is removed

# Usage
```json
{
  "rules": {
    "@dalife/dom-listeners-pairs": "error"
  }
}
```

# 👿
```tsx
useEffect(() => {
  dom.addEventListener('click', () => {});
}, []);
```

# 😃
```tsx
useEffect(() => {
  dom.addEventListener('click', handleClick);
  return () => {
    dom.removeEventListener('click', handleClick);
  }
}, []);
```
