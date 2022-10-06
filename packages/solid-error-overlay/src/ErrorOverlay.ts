import {
  batch,
  ComponentProps,
  createComputed,
  createContext,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  JSX,
  mergeProps,
  onCleanup,
  onError,
  Show,
  useContext,
  untrack,
  ParentComponent,
  Component,
} from 'solid-js';
import * as ErrorStackParser from 'error-stack-parser';
import getSourceMap from './get-source-map';

type Unbox<T> = T extends Array<infer U> ? U : never
type StackFrame = Unbox<ReturnType<typeof ErrorStackParser.parse>>

export type ErrorOverlayRenderProps = {
  error: unknown
  goPrev: () => void
  goNext: () => void
  resetError: () => void
  toggleViewCompiled: () => void
  isCompiled: boolean
  currentCount: number
  maxCount: number
}

export type StackFrameState = {
  content: string | undefined
  isConstructor: boolean | undefined
  isEval: boolean | undefined
  isNative: boolean | undefined
  isTopLevel: boolean | undefined
  columnNumber: number | undefined
  lineNumber: number | undefined
  fileName: string | undefined
  functionName: string | undefined
}

function createStackFrameState({ instance, isCompiled }: {
  instance: StackFrame
  isCompiled: () => boolean
}): StackFrameState {
  const [data] = createResource(
    () => ({
      isCompiled: isCompiled(),
      fileName: instance.fileName,
      line: instance.lineNumber,
      column: instance.columnNumber,
      functionName: instance.functionName,
    }),
    async (source) => {
      if (!source.fileName) {
        return null;
      }
      const response = await fetch(source.fileName);
      const content = await response.text();
      const sourceMap = await getSourceMap(source.fileName, content);
      if (!source.isCompiled && sourceMap && source.line && source.column) {
        const result = sourceMap.originalPositionFor({
          line: source.line,
          column: source.column,
        });

        return {
          ...result,
          content: sourceMap.sourceContentFor(result.source),
        };
      }

      return {
        source: source.fileName,
        line: source.line,
        column: source.column,
        name: source.functionName,
        content,
      };
    },
  );

  return {
    isConstructor: instance.isConstructor,
    isEval: instance.isEval,
    isNative: instance.isNative,
    isTopLevel: instance.isToplevel,
    get fileName() {
      return data()?.source ?? instance.fileName;
    },
    get functionName() {
      return data()?.name ?? instance.functionName;
    },
    get columnNumber() {
      return data()?.column ?? instance.columnNumber;
    },
    get lineNumber() {
      return data()?.line ?? instance.lineNumber;
    },
    get content() {
      return data()?.content;
    },
  };
}

const ErrorOverlayContext = createContext<{
  isCompiled:() => boolean;
  error: () => unknown
}>();

const useErrorOverlayContext = (name: string) => {
  const ctx = useContext(ErrorOverlayContext);
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') {
      const message = `<${name}> must be used within <ErrorOverlay> render prop`;
      // eslint-disable-next-line no-console
      console.warn(message);
      throw new Error(message);
    } else {
      throw new Error();
    }
  }
  return ctx;
};

const StackFramesContext = createContext<StackFrame[]>();

export const ErrorOverlayStackFramesContent: ParentComponent = (props) => {
  const ctx = useErrorOverlayContext('ErrorOverlayStackFramesContent');

  const isError = createMemo(() => ctx.error() instanceof Error);

  return createMemo(() => {
    if (!isError()) return null;

    const error = ctx.error() as Error;

    return StackFramesContext.Provider({
      value: ErrorStackParser.parse(error),
      get children() {
        return props.children;
      },
    });
  });
};

export const ErrorOverlayStackFrames: Component<{
  children: (passedProps: StackFrameState) => JSX.Element
}> = (props) => {
  const ctx = useErrorOverlayContext('ErrorOverlayStackFrames');
  const stackFramesCtx = useContext(StackFramesContext);

  if (!stackFramesCtx) {
    if (process.env.NODE_ENV !== 'production') {
      const message = '<ErrorOverlayStackFrames> must be used under <ErrorOverlayStackFramesContent>';
      // eslint-disable-next-line no-console
      console.warn(message);
      throw new Error(message);
    } else {
      throw new Error();
    }
  }

  return For({
    get each() {
      return stackFramesCtx;
    },
    children: (frame) => {
      const state = createStackFrameState({
        instance: frame,
        isCompiled: ctx.isCompiled,
      });

      return untrack(() => props.children(state));
    },
  });
};

function ErrorOverlayInternal(props: {
  render: JSX.Element | ((props: ErrorOverlayRenderProps) => JSX.Element)
  errors: unknown[]
  resetError: () => void
}): JSX.Element {
  const [currentPage, setCurrentPage] = createSignal(1);
  const [viewCompiled, setViewCompiled] = createSignal(false);

  const length = createMemo(() => props.errors.length);
  const currentError = createMemo(() => props.errors[currentPage() - 1]);

  createComputed((currentLength: number) => {
    const newLength = length();
    if (currentLength < newLength) {
      setCurrentPage((current) => current + 1);
    }
    return newLength;
  }, length());

  function goPrev() {
    setCurrentPage((c) => {
      if (c > 1) {
        return c - 1;
      }
      return length();
    });
  }
  function goNext() {
    setCurrentPage((c) => {
      if (c < length()) {
        return c + 1;
      }
      return 1;
    });
  }
  function toggleViewCompiled() {
    setViewCompiled((c) => !c);
  }

  const { render } = props;

  return ErrorOverlayContext.Provider({
    value: {
      isCompiled: viewCompiled,
      error: currentError,
    },
    get children() {
      if (typeof render === 'function') {
        return untrack(() => render({
          goPrev,
          goNext,
          toggleViewCompiled,
          resetError: props.resetError,
          get currentCount() {
            return currentPage();
          },
          get maxCount() {
            return length();
          },
          get isCompiled() {
            return viewCompiled();
          },
          get error() {
            return currentError();
          },
        }));
      }

      return render;
    },
  });
}

export const ErrorOverlay: ParentComponent<{
  render?: JSX.Element | ((props: ErrorOverlayRenderProps) => JSX.Element)
  onError?: (error: unknown) => void
}> = (props) => {
  const [errors, setErrors] = createSignal<unknown[]>([]);
  const [fallback, setFallback] = createSignal(false);

  function resetError() {
    setErrors([]);
    setFallback(false);
  }

  function pushError(error: unknown) {
    props.onError?.(error);
    setErrors((current) => [error, ...current]);
  }

  createEffect(() => {
    const onErrorEvent = (error: ErrorEvent) => {
      pushError(error.error);
    };

    window.addEventListener('error', onErrorEvent);

    onCleanup(() => {
      window.removeEventListener('error', onErrorEvent);
    });
  });

  onError((error) => {
    pushError(error);
  });

  const errorOverlayInternalProps: ComponentProps<typeof ErrorOverlayInternal> = {
    get errors() {
      return errors();
    },
    get render() {
      return props.render;
    },
    resetError,
  };

  return [
    ErrorBoundary({
      fallback(err, reset) {
        batch(() => {
          setFallback(true);
          pushError(err);
        });

        return untrack(
          () => ErrorOverlayInternal(mergeProps(errorOverlayInternalProps, {
            resetError() {
              batch(() => {
                resetError();
                reset();
              });
            },
          })),
        );
      },
      get children() {
        return props.children;
      },
    }),
    Show({
      get when() {
        return !fallback() && errors().length;
      },
      get children() {
        return untrack(() => ErrorOverlayInternal(errorOverlayInternalProps));
      },
    }),
  ];
};
