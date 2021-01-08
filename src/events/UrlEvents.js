export const UrlEventTypes = {
  urlValueChange: 'urlvaluechange',
};

/**
 * @param {EventTarget} target
 * @param {string} value
 */
export function urlChangeAction(target, value) {
  const e = new CustomEvent(UrlEventTypes.urlValueChange, {
    bubbles: true,
    composed: true,
    cancelable: false,
    detail: {
      value,
    }
  });
  target.dispatchEvent(e);
}
