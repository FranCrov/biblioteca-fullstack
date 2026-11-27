import { useId, useLayoutEffect, useRef, useState } from "react";
import type { Book } from "../types/book";

type Props = {
  book: Book;
  onClose: () => void;
  onConfirm: () => Promise<string | undefined>;
};

export function ConfirmBookDeletion({ book, onClose, onConfirm }: Props) {
  const titleId = useId();
  const warningId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const submitting = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    cancelRef.current?.focus();
    return () => dialog.close();
  }, []);

  function cancel() {
    if (!submitting.current) onClose();
  }

  async function confirm() {
    if (submitting.current) return;
    submitting.current = true;
    setIsSubmitting(true);
    setError(undefined);

    try {
      const failure = await onConfirm();
      if (failure) setError(failure);
      else onClose();
    } catch {
      setError("Could not delete the book.");
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={warningId}
      className="surface fixed inset-0 m-auto w-11/12 max-w-lg p-6 backdrop:bg-ink/50"
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
    >
      <h2 id={titleId} className="font-display text-2xl">Delete “{book.title}”?</h2>
      <p id={warningId} className="mt-3 text-ink/70">
        The book (ISBN {book.isbn}) will be permanently removed from the catalog. This cannot be undone.
      </p>
      {isSubmitting && <p className="mt-3" role="status">Deleting…</p>}
      {error && <p className="mt-3" role="alert">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button ref={cancelRef} className="btn-secondary" disabled={isSubmitting} onClick={cancel} type="button">
          Cancel
        </button>
        <button className="btn-quiet btn-danger" disabled={isSubmitting} onClick={confirm} type="button">
          Delete permanently
        </button>
      </div>
    </dialog>
  );
}
