/* eslint-disable react/function-component-definition */
/* eslint-disable react/no-unstable-nested-components */
import {
  Component,
  createEffect, createSignal, JSX, Show,
} from 'solid-js';
import * as shiki from 'shiki';
import { getHighlighter } from 'shiki';
import {
  ErrorOverlay,
  StackFrameState,
  ErrorOverlayStackFrames,
  ErrorOverlayStackFramesContent,
} from 'solid-error-overlay';

shiki.setCDN('https://unpkg.com/shiki/');

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

function ArrowRightIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  );
}

let HIGHLIGHTER: shiki.Highlighter;

async function loadHighlighter() {
  if (!HIGHLIGHTER) {
    HIGHLIGHTER = await getHighlighter({
      theme: 'dark-plus',
      langs: ['js', 'ts', 'jsx', 'tsx'],
    });
  }
  return HIGHLIGHTER;
}

interface ErrorOverlayCodeViewProps {
  fileName: string
  content: string
  line: number
}

function ErrorOverlayCodeView(props: ErrorOverlayCodeViewProps): JSX.Element | null {
  const lines = () => props.content.split('\n').map((item, index) => ({
    index: index + 1,
    line: item,
  }));

  const minLine = () => Math.max(props.line - 5, 0);
  const maxLine = () => Math.min(props.line + 4, lines().length - 1);

  let ref: HTMLDivElement | undefined;

  async function updateCode(value: string) {
    if (ref) {
      const highlighter = await loadHighlighter();
      const lang = props.fileName.split(/[#?]/)[0].split('.').pop()?.trim() as shiki.Lang;
      await highlighter.loadLanguage(lang);
      const result = highlighter.codeToHtml(value, {
        theme: 'dark-plus',
        lang,
      });
      ref.innerHTML = result;

      ref.querySelectorAll('span[class="line"]').forEach((el, index) => {
        if (index === 4) {
          // eslint-disable-next-line no-param-reassign
          el.innerHTML = `<mark style="background-color:#aaaaaa80">${el.innerHTML}</mark>`;
        }
      });
    }
  }

  createEffect(async () => {
    await updateCode(
      lines()
        .slice(minLine(), maxLine())
        .map((item) => item.line)
        .join('\n'),
    );
  });

  return <div ref={ref} class="overflow-auto" />;
}

function ArrowLeftIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

function RefreshIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function ViewCompiledIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function ViewOriginalIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  );
}

const BUTTON = classNames(
  'rounded-full transition duration-150',
  'focus:outline-none focus-visible:ring focus-visible:ring-opacity-75',
  'focus-visible:ring-gray-900',
  // Background
  'bg-gray-50 hover:bg-gray-200 active:bg-gray-100',
  // Foreground
  'text-gray-900 hover:text-gray-700 active:text-gray-800',
);

function Main(): JSX.Element {
  const [renderError, setRenderError] = createSignal();

  createEffect(() => {
    if (renderError()) {
      throw renderError();
    }
  });

  function throwGlobalError() {
    throw new Error('This is a global error!');
  }
  function throwRenderError() {
    setRenderError(new Error('This is a render error!'));
  }

  return (
    <div class="flex flex-col items-center justify-center space-y-2 text-white p-2 rounded-lg bg-gray-900 bg-opacity-10">
      <button
        type="button"
        onClick={throwGlobalError}
        class="p-2 rounded-lg bg-gray-900 bg-opacity-10"
      >
        Click to throw global error!
      </button>
      <button
        type="button"
        onClick={throwRenderError}
        class="p-2 rounded-lg bg-gray-900 bg-opacity-10"
      >
        Click to throw render error!
      </button>
    </div>
  );
}

const CompiledStackFrame: Component<StackFrameState> = (props) => (
  <div class="flex flex-col whitespace-nowrap">
    <Show when={props.functionName}>
      <span>
        {'at '}
        <span class="text-lg font-semibold">{props.functionName}</span>
      </span>
    </Show>
    <div class="rounded-lg bg-gray-900 divide-y divide-gray-50">
      {props.fileName && (
      <a href={props.fileName} class="m-1 text-gray-50 text-sm font-mono">
        {props.fileName}
        {props.lineNumber && `:${props.lineNumber}`}
        {props.columnNumber && `:${props.columnNumber}`}
      </a>
      )}
      {() => {
        if (props.content && props.lineNumber && props.fileName) {
          return (
            <ErrorOverlayCodeView
              fileName={props.fileName}
              content={props.content}
              line={props.lineNumber}
            />
          );
        }
        return undefined;
      }}
    </div>
  </div>
);

const OriginalStackFrame: Component<StackFrameState> = (props) => (
  <div class="flex flex-col whitespace-nowrap">
    <Show when={props.functionName}>
      <span>
        {'at '}
        <span class="text-lg font-semibold">{props.functionName}</span>
      </span>
    </Show>
    <div class="rounded-lg overflow-hidden bg-gray-900 divide-y divide-gray-50">
      {() => {
        if (!props.fileName) {
          return undefined;
        }
        const line = props.lineNumber ? `:${props.lineNumber}` : '';
        const column = props.columnNumber ? `:${props.columnNumber}` : '';
        const filePath = `${props.fileName}${line}${column}`;
        if (filePath.startsWith('.')) {
          return <span class="m-1 text-gray-50 text-sm font-mono">{filePath}</span>;
        }
        return (
          <a href={`vscode://file/${filePath}`} class="m-1 text-gray-50 text-sm font-mono">
            {filePath}
          </a>
        );
      }}
      {() => {
        if (props.content && props.lineNumber && props.fileName) {
          return (
            <ErrorOverlayCodeView
              fileName={props.fileName}
              content={props.content}
              line={props.lineNumber}
            />
          );
        }
        return undefined;
      }}
    </div>
  </div>
);

export default function App(): JSX.Element {
  return (
    <ErrorOverlay render={(props) => (
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <div class="min-h-screen px-4 flex items-center justify-center">
          <div class="fixed inset-0 bg-gray-900 bg-opacity-50" />
          <span class="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>
          <div class="inline-block z-50 max-w-screen-md overflow-hidden p-4 space-y-2 my-8 text-left align-middle bg-gray-50 shadow-xl rounded-2xl">
            <div class="flex items-center justify-between">
              <div class="flex items-center justify-center space-x-2">
                <button type="button" class={BUTTON} onClick={props.goPrev}>
                  <span class="sr-only">Prev</span>
                  <ArrowLeftIcon class="w-8 h-8 p-1" />
                </button>
                <button type="button" class={BUTTON} onClick={props.goNext}>
                  <span class="sr-only">Prev</span>
                  <ArrowRightIcon class="w-8 h-8 p-1" />
                </button>
                <span class="text-lg font-mono font-semibold">
                  <span>{props.currentCount}</span>
                  {' of '}
                  <span>{props.maxCount}</span>
                </span>
              </div>
              <div class="flex items-center justify-center space-x-2">
                <button type="button" class={BUTTON} onClick={props.toggleViewCompiled}>
                  <span class="sr-only">
                    {props.isCompiled ? 'View Original Source' : 'View Compiled Source '}
                  </span>
                  {props.isCompiled ? (
                    <ViewOriginalIcon class="w-8 h-8 p-1" />
                  ) : (
                    <ViewCompiledIcon class="w-8 h-8 p-1" />
                  )}
                </button>
                <button type="button" class={BUTTON} onClick={props.resetError}>
                  <span class="sr-only">Reset</span>
                  <RefreshIcon class="w-8 h-8 p-1" />
                </button>
              </div>
            </div>
            <div class="flex flex-col space-y-1">
              {() => {
                if (props.error instanceof Error) {
                  return (
                    <span class="text-xl font-mono text-red-500 pt-1">
                      <span class="font-bold">{props.error.name}</span>
                      {': '}
                      <span class="font-semibold">{props.error.message}</span>
                    </span>
                  );
                }
                return <span>{String(props.error)}</span>;
              }}
              <ErrorOverlayStackFramesContent>
                <div class="flex flex-col">
                  <ErrorOverlayStackFrames>
                    {(frameProps) => (
                      <Show
                        when={props.isCompiled}
                        fallback={<OriginalStackFrame {...frameProps} />}
                      >
                        <CompiledStackFrame {...frameProps} />
                      </Show>
                    )}
                  </ErrorOverlayStackFrames>
                </div>
              </ErrorOverlayStackFramesContent>
            </div>
          </div>
        </div>
      </div>
    )}
    >
      <Main />
    </ErrorOverlay>
  );
}
