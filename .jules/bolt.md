## 2025-03-03 - Inline IIFE JSON parsing in React renders
**Learning:** React renders can be unnecessarily blocked by inline expensive calculations, such as IIFEs running `JSON.parse` and `JSON.stringify` directly in the JSX. This is particularly problematic in components with frequent state changes like a controlled textarea.
**Action:** Always wrap expensive synchronous data formatting or calculations in `useMemo` so they only re-run when their actual dependencies change, preventing UI freezing on unrelated renders.
