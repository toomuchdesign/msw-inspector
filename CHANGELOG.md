# 3.1.0

### New Features

- `mswInspector.getRequests`: support full url match via regex

# 3.0.0

### Breaking change

- Support `msw` v2+
- `mswInspector.getRequests` method switched from sync to async

# 2.0.0

### Breaking change

- Drop support for Node.js v16
- Query object parsed with `qs` library
- `requestMapper` option replaced by `requestLogger`

### New Features

- Pattern matching powered by `path-to-regexp`
- `debug` option added
- Throw error when invalid URL provided

# 1.0.0

### Breaking change

- Support `msw` v1+

# 0.1.0

### New Features

- Add `requestLogger` option to customize inspection results

# 0.0.1

Initial release
