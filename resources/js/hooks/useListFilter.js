import { useMemo, useState } from 'react';

export function useListFilter(items, { searchKeys = [], filters = {} } = {}) {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState(
    Object.fromEntries(Object.keys(filters).map((k) => [k, 'all']))
  );

  const setFilter = (key, value) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const filtered = useMemo(() => {
    let result = items;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchKeys.some((key) => String(item[key] ?? '').toLowerCase().includes(q))
      );
    }

    Object.entries(filters).forEach(([key, fn]) => {
      const val = filterValues[key];
      if (val && val !== 'all') {
        result = result.filter((item) => fn(item, val));
      }
    });

    return result;
  }, [items, search, searchKeys, filters, filterValues]);

  return { search, setSearch, filterValues, setFilter, filtered };
}
