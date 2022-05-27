import {
  batch,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  JSX,
  onCleanup,
  onError,
  Show,
} from 'solid-js';
import {
  Dynamic,
} from 'solid-js/web';
import ErrorStackParser from 'error-stack-parser';
import {
  omitProps,
} from 'solid-use';
import getSourceMap from './get-source-map';

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
    return (
      <Dynamic
        component={(
          (!result || props.isCompiled)
            ? props.ErrorOverlayCompiledStackFrame
            : props.ErrorOverlayOriginalStackFrame
        )}
        isConstructor={props.instance.isConstructor}
        isEval={props.instance.isEval}
        isNative={props.instance.isNative}
        isTopLevel={props.instance.isToplevel}
        fileName={result?.source ?? props.instance.fileName}
        functionName={result?.name ?? props.instance.functionName}
        columnNumber={result?.column ?? props.instance.columnNumber}
        lineNumber={result?.line ?? props.instance.lineNumber}
        content={result?.content}
      />
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

  function goPrev() {
    setCurrentPage((c) => {
      if (c > 1) {
        return c - 1;
      }
      return props.errors.length;
    });
  }
  function goNext() {
    setCurrentPage((c) => {
      if (c < props.errors.length) {
        return c + 1;
      }
      return 1;
    });
  }
  function toggleViewCompiled() {
    setViewCompiled((c) => !c);
  }

  return (
    <Dynamic component={props.ErrorOverlayContainer}>
      <Dynamic component={props.ErrorOverlayNavbar}>
        <Dynamic component={props.ErrorOverlayPagination}>
          <Dynamic
            component={props.ErrorOverlayPrevButton}
            onClick={goPrev}
          />
          <Dynamic
            component={props.ErrorOverlayNextButton}
            onClick={goNext}
          />
          <Dynamic
            component={props.ErrorOverlayPageCounter}
            currentCount={currentPage()}
            maxCount={props.errors.length}
          />
        </Dynamic>
        <Dynamic component={props.ErrorOverlayControls}>
          <Dynamic
            component={props.ErrorOverlayToggleCompiledButton}
            onClick={toggleViewCompiled}
            isCompiled={viewCompiled()}
          />
          <Dynamic
            component={props.ErrorOverlayResetButton}
            onClick={props.resetError}
          />
        </Dynamic>
      </Dynamic>
      <Show when={props.errors[currentPage() - 1]}>
        {(value: unknown) => (
          <Dynamic component={props.ErrorOverlayContent}>
            <Dynamic
              component={props.ErrorOverlayErrorInfo}
              value={value}
            />
            {() => {
              if (value instanceof Error) {
                const stackFrames = ErrorStackParser.parse(value);

                return createMemo(() => (
                  <Dynamic component={props.ErrorOverlayStackFrames}>
                    <For each={stackFrames}>
                      {(stackFrame) => (
                        <StackFrame
                          instance={stackFrame}
                          isCompiled={viewCompiled()}
                          ErrorOverlayCompiledStackFrame={props.ErrorOverlayCompiledStackFrame}
                          ErrorOverlayOriginalStackFrame={props.ErrorOverlayOriginalStackFrame}
                        />
                      )}
                    </For>
                  </Dynamic>
                ));
              }
              return undefined;
            }}
          </Dynamic>
        )}
      </Show>
    </Dynamic>
  );
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

  return (
    <>
      <ErrorBoundary
        fallback={(err, reset) => {
          batch(() => {
            setFallback(true);
            pushError(err);
          });
          return (
            <ErrorOverlayInternal
              errors={errors()}
              resetError={() => {
                batch(() => {
                  resetError();
                  reset();
                });
              }}
              {...omitProps(props, [
                'children',
                'onError',
              ])}
            />
          );
        }}
      >
        {props.children}
      </ErrorBoundary>
      <Show when={!fallback() && errors().length}>
        <ErrorOverlayInternal
          errors={errors()}
          resetError={resetError}
          {...omitProps(props, [
            'children',
            'onError',
          ])}
        />
      </Show>
    </>
  );
}
