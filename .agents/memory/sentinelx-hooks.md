---
name: SentinelX Orval Hook Destructuring Pattern
description: Correct way to use Orval-generated TanStack Query hooks in this project
---

Orval-generated query hooks return `UseQueryResult<T>`, NOT `T` directly.

**Correct:**
```ts
const { data: incidents } = useListIncidents();
const { data: asset } = useGetAsset(id, { query: { enabled: !!id, queryKey: getGetAssetQueryKey(id) } });
```

**Wrong:**
```ts
const incidents = useListIncidents(); // incidents is UseQueryResult, not T[]
(incidents ?? []).map(...) // TypeError: .map is not a function
```

**Why:** The rules doc says "returns T directly — NOT wrapped in { data: T }" means the `.data` property is typed as `T` (not `{ data: T }`). You still destructure `.data` from the hook result.

**How to apply:** Every time a query hook is called, destructure `{ data, isLoading, error }` from it.
