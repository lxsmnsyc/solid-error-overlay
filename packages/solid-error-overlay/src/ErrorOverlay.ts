import {
  batch,
  createComponent,
  createComputed,
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
} from 'solid-js';
import * as ErrorStackParser from 'error-stack-parser';
import {
  omitProps,
} from 'solid-use';
import getSourceMap from './get-source-map';
import createDynamic from './create-dynamic';

type Unbox<T> = T extends Array<infer U> ? U : never;
type StackFrame = Unbox<ReturnType<typeof ErrorStackParser.parse>>;

export interface ErrorOverlayContainerProps {
  children: JSX.Element;
}
export interface ErrorOverlayNavbarProps {
  children: JSX.Element;
}
export interface ErrorOverlayPaginationProps {
  children: JSX.Element;
}
export interface ErrorOverlayPrevButtonProps {
  onClick: () => void;
}
export interface ErrorOverlayNextButtonProps {
  onClick: () => void;
}
export interface ErrorOverlayPageCounterProps {
  currentCount: number;
  maxCount: number;
}
export interface ErrorOverlayControlsProps {
  children: JSX.Element;
}
export interface ErrorOverlayToggleCompiledButtonProps {
  isCompiled: boolean;
  onClick: () => void;
}
export interface ErrorOverlayResetButtonProps {
  onClick: () => void;
}
export interface ErrorOverlayContentProps {
  children: JSX.Element;
}
export interface ErrorOverlayErrorInfoProps {
  value: unknown;
}
export interface ErrorOverlayStackFramesProps {
  children: JSX.Element;
}
export interface ErrorOverlayCompiledStackFrameProps {
  content?: string;
  isConstructor?: boolean;
  isEval?: boolean;
  isNative?: boolean;
  isTopLevel?: boolean;
  columnNumber?: number;
  lineNumber?: number;
  fileName?: string;
  functionName?: string;
}
export interface ErrorOverlayOriginalStackFrameProps {
  content?: string;
  isConstructor?: boolean;
  isEval?: boolean;
  isNative?: boolean;
  isTopLevel?: boolean;
  columnNumber?: number;
  lineNumber?: number;
  fileName?: string;
  functionName?: string;
}

type Component<P> = (props: P) => JSX.Element;

export interface ErrorOverlayComponents {
  ErrorOverlayContainer: Component<ErrorOverlayContainerProps>;
  ErrorOverlayNavbar: Component<ErrorOverlayNavbarProps>;
  ErrorOverlayPagination: Component<ErrorOverlayPaginationProps>;
  ErrorOverlayPrevButton: Component<ErrorOverlayPrevButtonProps>;
  ErrorOverlayNextButton: Component<ErrorOverlayNextButtonProps>;
  ErrorOverlayPageCounter: Component<ErrorOverlayPageCounterProps>;
  ErrorOverlayControls: Component<ErrorOverlayControlsProps>;
  ErrorOverlayToggleCompiledButton: Component<ErrorOverlayToggleCompiledButtonProps>;
  ErrorOverlayResetButton: Component<ErrorOverlayResetButtonProps>;
  ErrorOverlayContent: Component<ErrorOverlayContentProps>;
  ErrorOverlayErrorInfo: Component<ErrorOverlayErrorInfoProps>;
  ErrorOverlayStackFrames: Component<ErrorOverlayStackFramesProps>;
  ErrorOverlayCompiledStackFrame: Component<ErrorOverlayCompiledStackFrameProps>;
  ErrorOverlayOriginalStackFrame: Component<ErrorOverlayOriginalStackFrameProps>;
}

interface StackFrameProps {
  instance: StackFrame;
  isCompiled: boolean;
  ErrorOverlayCompiledStackFrame: Component<ErrorOverlayCompiledStackFrameProps>;
  ErrorOverlayOriginalStackFrame: Component<ErrorOverlayOriginalStackFrameProps>;
}

function StackFrame(props: StackFrameProps): JSX.Element {
  const [data] = createResource(
    () => ({
      isCompiled: props.isCompiled,
      fileName: props.instance.fileName,
      line: props.instance.lineNumber,
      column: props.instance.columnNumber,
      functionName: props.instance.functionName,
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

  return createMemo(() => {
    const result = data();
    return createDynamic(
      () => (
        (!result || props.isCompiled)
          ? props.ErrorOverlayCompiledStackFrame
          : props.ErrorOverlayOriginalStackFrame
      ),
      {
        get isConstructor() {
          return props.instance.isConstructor;
        },
        get isEval() {
          return props.instance.isEval;
        },
        get isNative() {
          return props.instance.isNative;
        },
        get isTopLevel() {
          return props.instance.isToplevel;
        },
        get fileName() {
          return result?.source ?? props.instance.fileName;
        },
        get functionName() {
          return result?.name ?? props.instance.functionName;
        },
        get columnNumber() {
          return result?.column ?? props.instance.columnNumber;
        },
        get lineNumber() {
          return result?.line ?? props.instance.lineNumber;
        },
        get content() {
          return result?.content;
        },
      },
    );
  });
}

interface ErrorOverlayInternalProps extends ErrorOverlayComponents {
  errors: unknown[];
  resetError: () => void;
}

function ErrorOverlayInternal(props: ErrorOverlayInternalProps): JSX.Element {
  const [currentPage, setCurrentPage] = createSignal(1);
  const [viewCompiled, setViewCompiled] = createSignal(false);
  const length = createMemo(() => props.errors.length);

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

  return createDynamic(() => props.ErrorOverlayContainer, {
    get children() {
      return [
        createDynamic(() => props.ErrorOverlayNavbar, {
          get children() {
            return [
              createDynamic(() => props.ErrorOverlayPagination, {
                get children() {
                  return [
                    createDynamic(() => props.ErrorOverlayPrevButton, {
                      onClick: goPrev,
                    }),
                    createDynamic(() => props.ErrorOverlayNextButton, {
                      onClick: goNext,
                    }),
                    createDynamic(() => props.ErrorOverlayPageCounter, {
                      get currentCount() {
                        return currentPage();
                      },
                      get maxCount() {
                        return props.errors.length;
                      },
                    }),
                  ];
                },
              }),
              createDynamic(() => props.ErrorOverlayControls, {
                get children() {
                  return [
                    createDynamic(() => props.ErrorOverlayToggleCompiledButton, {
                      onClick: toggleViewCompiled,
                      get isCompiled() {
                        return viewCompiled();
                      },
                    }),
                    createDynamic(() => props.ErrorOverlayResetButton, {
                      onClick: props.resetError,
                    }),
                  ];
                },
              }),
            ];
          },
        }),
        createComponent(Show, {
          get when() {
            return props.errors[currentPage() - 1];
          },
          children: (value: unknown) => (
            createDynamic(() => props.ErrorOverlayContent, {
              get children() {
                return [
                  createDynamic(() => props.ErrorOverlayErrorInfo, {
                    value,
                  }),
                  () => {
                    if (value instanceof Error) {
                      const stackFrames = ErrorStackParser.parse(value);

                      return createDynamic(() => props.ErrorOverlayStackFrames, {
                        get children() {
                          return createComponent(For, {
                            each: stackFrames,
                            children: (stackFrame: ErrorStackParser.StackFrame) => (
                              createComponent(StackFrame, {
                                instance: stackFrame,
                                get isCompiled() {
                                  return viewCompiled();
                                },
                                get ErrorOverlayCompiledStackFrame() {
                                  return props.ErrorOverlayCompiledStackFrame;
                                },
                                get ErrorOverlayOriginalStackFrame() {
                                  return props.ErrorOverlayOriginalStackFrame;
                                },
                              })
                            ),
                          });
                        },
                      });
                    }
                    return undefined;
                  },
                ];
              },
            })
          ),
        }),
      ];
    },
  });
}

export interface ErrorOverlayProps extends ErrorOverlayComponents {
  onError?: (error: unknown) => void;
  children?: JSX.Element;
}

export default function ErrorOverlay(props: ErrorOverlayProps): JSX.Element {
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

  return [
    createComponent(ErrorBoundary, {
      fallback(err, reset) {
        batch(() => {
          setFallback(true);
          pushError(err);
        });

        return createComponent(ErrorOverlayInternal, mergeProps({
          get errors() {
            return errors();
          },
          resetError() {
            batch(() => {
              resetError();
              reset();
            });
          },
        }, omitProps(props, [
          'children',
          'onError',
        ])) as ErrorOverlayInternalProps);
      },
      get children() {
        return props.children;
      },
    }),
    createComponent(Show, {
      get when() {
        return !fallback() && errors().length;
      },
      get children() {
        return createComponent(ErrorOverlayInternal, mergeProps({
          get errors() {
            return errors();
          },
          resetError,
        }, omitProps(props, [
          'children',
          'onError',
        ])) as ErrorOverlayInternalProps);
      },
    }),
  ];
}
