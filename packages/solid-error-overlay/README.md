# solid-error-overlay

<p align="center">
  <img
    src="https://github.com/LXSMNSYC/solid-error-overlay/blob/main/images/preview.png?raw=true"
    alt="Example"
    style="width: 80%; height: auto;"
  />
</p>

> Unstyled, headless Error Overlay for SolidJS

[![NPM](https://img.shields.io/npm/v/solid-error-overlay.svg)](https://www.npmjs.com/package/solid-error-overlay) [![JavaScript Style Guide](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)[![Open in CodeSandbox](https://img.shields.io/badge/Open%20in-CodeSandbox-blue?style=flat-square&logo=codesandbox)](https://codesandbox.io/s/github/LXSMNSYC/solid-error-overlay/tree/main/examples/demo)

## Install

```bash
npm i solid-error-overlay
```

```bash
yarn add solid-error-overlay
```

```bash
pnpm add solid-error-overlay
```

## Features

- Stack Trace - inspect the stack trace of the error
- Source Maps view - View the source code of the stack trace's origin, switch between compiled and original source
- Error Pagination - Capture multiple errors
- Global Errors - Capture unhandled global errors
- No Interruption - Display the overlay without interrupting the current page (only works for errors not originating from the component.)

## Usage

### Simplest usage

```js
import { ErrorOeverlay } from 'solid-error-overlay';

<ErrorOverlay onError={(error) => handleError(error)}>
  <App />
</ErrorOverlay>
```

### Customization

The `<ErrorOverlay>` component is unstyled and headless, therefore it is highly customizable.

The internal structure of the component is as follows:

```jsx
<ErrorOverlayContainer>
  <ErrorOverlayNavbar>
    <ErrorOverlayPagination>
      <ErrorOverlayPrevButton />
      <ErrorOverlayNextButton />
      <ErrorOverlayPageCounter />
    </ErrorOverlayPagination>
    <ErrorOverlayControls>
      <ErrorOverlayToggleCompiledButton />
      <ErrorOverlayResetButton />
    </ErrorOverlayControls>
  </ErrorOverlayNavbar>
  <ErrorOverlayContent>
    <ErrorOverlayErrorInfo />
    <ErrorOverlayStackFrames>
      <ErrorOverlayCompiledStackFrame />
      <ErrorOverlayOriginalStackFrame />
    </ErrorOverlayStackFrames>
  </ErrorOverlayContent>
</ErrorOverlayContainer>
```

Each of the components can be overriden through `<ErrorOverlay>`'s props:

```js
<ErrorOverlay
  ErrorOverlayPrevButton={(props) => (
    <button onClick={props.onClick}>Previous</button>
  )}
  {...overrides}
>
  <App />
</ErrorOverlay>
```

See the [demo](https://github/LXSMNSYC/solid-error-overlay/tree/main/examples/demo) for expanded use.

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)
