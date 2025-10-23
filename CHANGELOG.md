# msw-inspector

## 3.3.0

### Minor Changes

- [#250](https://github.com/toomuchdesign/msw-inspector/pull/250) [`5d132db`](https://github.com/toomuchdesign/msw-inspector/commit/5d132db541bb61e4148724ac0f36fe5be628844c) Thanks [@toomuchdesign](https://github.com/toomuchdesign)! - Wrap message error urls in double quotes

## 3.2.0

### New Features

- `mswInspector.getRequests`: support full url match via regex

## 3.1.0

### New Features

- Improve error message when `request.body` is already read

## 3.0.0

### Breaking change

- Support `msw` v2+
- `mswInspector.getRequests` method switched from sync to async

## 2.0.0

### Breaking change

- Drop support for Node.js v16
- Query object parsed with `qs` library
- `requestMapper` option replaced by `requestLogger`

### New Features

- Pattern matching powered by `path-to-regexp`
- `debug` option added
- Throw error when invalid URL provided

## 1.0.0

### Breaking change

- Support `msw` v1+

## 0.1.0

### New Features

- Add `requestLogger` option to customize inspection results

## 0.0.1

Initial release
