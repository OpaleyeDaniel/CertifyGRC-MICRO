export function setReadOnlyInteractiveState(root: HTMLElement, readOnly: boolean) {
  const elements = root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement>(
    "input, textarea, select, button"
  );

  elements.forEach((el) => {
    // Most form controls support `.disabled`. Buttons do as well.
    el.disabled = readOnly;
  });
}

