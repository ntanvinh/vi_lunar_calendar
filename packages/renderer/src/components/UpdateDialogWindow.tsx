import React, {useEffect, useMemo, useState} from 'react';

type ViewState = {
  isLoading: boolean;
  payload: Awaited<ReturnType<typeof window.ipc.getUpdateDialogData>>;
};

export default function UpdateDialogWindow() {
  const [viewState, setViewState] = useState<ViewState>({
    isLoading: true,
    payload: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    window.ipc.getUpdateDialogData()
      .then(payload => {
        if (!mounted) {
          return;
        }
        setViewState({
          isLoading: false,
          payload,
        });
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setViewState({
          isLoading: false,
          payload: null,
        });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const releaseNotesHtml = useMemo(() => {
    if (!viewState.payload?.releaseNotesHtml) {
      return '<p>No release notes provided for this version.</p>';
    }
    return viewState.payload.releaseNotesHtml;
  }, [viewState.payload]);

  const handleAction = async (action: 'primary' | 'secondary') => {
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      await window.ipc.performUpdateDialogAction(action);
      window.close();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (viewState.isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-zinc-700 dark:bg-[#1e1e1e] dark:text-zinc-200">
        <div className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          Loading update details...
        </div>
      </div>
    );
  }

  if (!viewState.payload) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white px-4 dark:bg-[#1e1e1e]">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-300 bg-white p-6 text-zinc-800 shadow-xl dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          <div className="text-lg font-semibold">Không thể tải thông tin cập nhật</div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Vui lòng đóng cửa sổ này và kiểm tra cập nhật lại.
          </p>
          <button
            type="button"
            onClick={() => handleAction('secondary')}
            className="mt-5 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-600 dark:hover:bg-zinc-500"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const iconSrc = viewState.payload.iconDataUrl;

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-zinc-900 dark:bg-[#1e1e1e] dark:text-zinc-100">
      <div className="drag-region h-10 w-full border-b border-zinc-200/60 dark:border-zinc-800/70" />
      <div className="no-drag-region flex h-[calc(100vh-2.5rem)] flex-col px-6 pb-5 pt-4 sm:px-8">
        <div className="mb-4 flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
            {iconSrc ? (
              <img src={iconSrc} alt="App icon" className="h-9 w-9 rounded-lg" />
            ) : (
              <div className="h-7 w-7 rounded-md border-2 border-blue-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{viewState.payload.title}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {viewState.payload.heading}
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-zinc-700 dark:text-zinc-300">
              {viewState.payload.message}
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span>Hiện tại: <span className="font-medium text-zinc-800 dark:text-zinc-200">{viewState.payload.currentVersion}</span></span>
          <span className="hidden h-4 w-px bg-zinc-300 dark:bg-zinc-700 sm:block" />
          <span>Phiên bản mới: <span className="font-medium text-zinc-800 dark:text-zinc-200">{viewState.payload.latestVersion}</span></span>
        </div>

        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Release Notes</div>
        <div className="flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-full overflow-y-auto p-5">
            <article
              className="prose prose-zinc max-w-none text-sm leading-relaxed dark:prose-invert [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:bg-zinc-200 [&_code]:px-1 [&_code]:py-0.5 [&_img]:my-4 [&_img]:w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-zinc-200 [&_li]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2.5 [&_p]:text-base [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-200 [&_pre]:p-4 dark:[&_code]:bg-zinc-800 dark:[&_img]:border-zinc-800 dark:[&_pre]:bg-zinc-800"
              dangerouslySetInnerHTML={{__html: releaseNotesHtml}}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => handleAction('secondary')}
            disabled={isSubmitting}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {viewState.payload.secondaryButtonLabel}
          </button>
          <button
            type="button"
            onClick={() => handleAction('primary')}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {viewState.payload.primaryButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
