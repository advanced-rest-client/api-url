/* eslint-disable prefer-destructuring */
/* eslint-disable arrow-body-style */
/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
import { html, css, LitElement } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import { UrlEventTypes, urlChangeAction } from './events/UrlEvents.js';

 /** @typedef {import('@anypoint-web-components/anypoint-input/index.js').AnypointInput} AnypointInput */
 /** @typedef {import('lit-html').TemplateResult} TemplateResult */
 /** @typedef {import('@advanced-rest-client/arc-types').FormTypes.AmfFormItem} AmfFormItem */
 /** @typedef {import('./ApiUrlEditorElement').ParamsObject} ParamsObject */

/**
 * `api-url-editor`
 * An AMF powered url editor for the HTTP request editor.
 *
 * The element is regular input element that is adjusted to work with URL
 * data.
 * It supports validation for URL values that may contain variables.
 */
export class ApiUrlEditorElement extends EventsTargetMixin(ValidatableMixin(LitElement)) {
  get styles() {
    return css`:host {
      display: flex;
    }

    anypoint-input {
      flex: 1;
    }`;
  }

  /**
   * @return {AnypointInput} A reference to the input element.
   */
  get inputElement() {
    return this.shadowRoot.querySelector('anypoint-input');
  }

  static get properties() {
    return {
      /**
       * When set the input label won't float when focused/has input
       */
      noLabelFloat: { type: Boolean },
      /**
       * Renders input element disabled.
       */
      disabled: { type: Boolean },
      /**
       * When set the input is marked as required input.
       */
      required: { type: Boolean },
      /**
       * Makes the input element read only.
       */
      readOnly: { type: Boolean },
      /**
       * A value produced by this editor - the URL.
       */
      value: { type: String },
      /**
       * Value or RAML's base URI property.
       *
       * Note, the element doesn't check if `baseUri` is relative or not.
       * Hosting application have to take care of that.
       */
      baseUri: { type: String },
      /**
       * Currently selected endpoint relative URI.
       * It is available in RAML definition.
       */
      endpointPath: { type: String },
      /**
       * Computed value, sum of `baseUri` and `endpointPath`
       */
      _fullUri: { type: String },
      /**
       * The query properties model.
       * Use `api-url-data-model` to compute model for the view.
       */
      queryModel: { type: Array },
      /**
       * The URI properties model.
       * Use `api-url-data-model` to compute model for the view.
       */
      pathModel: { type: Array },
      /**
       * Computed, ordered list of URL variables in the URI string.
       */
      _urlParams: { type: Array },
      /**
       * Computed regexp for the current `_fullUri` value to search for the
       * URI parameters.
       */
      _urlSearchRegexp: { type: RegExp },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean },

      /**
       * AMF model used to compute view model.
       */
      amf: { type: Object },
    };
  }

  get value() {
    return this._value;
  }

  set value(value) {
    const old = this._value;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._value = value;
    this.requestUpdate('value', old);
    this._onValueChanged();
  }

  get baseUri() {
    return this._baseUri;
  }

  set baseUri(value) {
    const old = this._baseUri;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._baseUri = value;
    this._fullUri = this._computeFullUrl(value, this.endpointPath);
  }

  get endpointPath() {
    return this._endpointPath;
  }

  set endpointPath(value) {
    const old = this._endpointPath;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._endpointPath = value;
    this._fullUri = this._computeFullUrl(this.baseUri, value);
  }

  get _fullUri() {
    return this.__fullUri;
  }

  set _fullUri(value) {
    const old = this.__fullUri;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this.__fullUri = value;
    this._urlParams = this._computeUrlParams(value);
    this._urlSearchRegexp = this._computeUrlRegexp(value);
    this._computeValue(this.queryModel, this.pathModel, value);
  }

  get queryModel() {
    return this._queryModel;
  }

  set queryModel(value) {
    const old = this._queryModel;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._queryModel = value;
    this._computeValue(value, this.pathModel, this._fullUri);
  }

  get pathModel() {
    return this._pathModel;
  }

  set pathModel(value) {
    const old = this._pathModel;
    /* istanbul ignore if  */
    if (old === value) {
      return;
    }
    this._pathModel = value;
    this._computeValue(this.queryModel, value, this._fullUri);
  }

  /**
   * @return {EventListener} Previously registered handler for `value-changed` event
   */
  get onchange() {
    return this._onchange;
  }

  /**
   * Registers a callback function for `value-changed` event
   * @param {EventListener} value A callback to register. Pass `null` or `undefined`
   * to clear the listener.
   */
  set onchange(value) {
    if (this._onchange) {
      this.removeEventListener('change', this._onchange);
    }
    if (typeof value !== 'function') {
      this._onchange = null;
      return;
    }
    this._onchange = value;
    this.addEventListener('change', value);
  }

  constructor() {
    super();
    this._extValueChangedHandler = this._extValueChangedHandler.bind(this);
    this._focusHandler = this._focusHandler.bind(this);

    this.noLabelFloat = false;
    this.disabled = false;
    this.readOnly = false;
    this.invalid = false;
    this.outlined = false;
    this.compatibility = false;
    this.required = false;
    this.amf = undefined;
  }

  firstUpdated() {
    this._elementReady = true;
    // If there's an initial input, validate it.
    if (this.value) {
      this.validate();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('focus', this._focusHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('focus', this._focusHandler);
  }

  /**
   * @param {EventTarget} node
   */
  _attachListeners(node) {
    node.addEventListener(UrlEventTypes.urlValueChange, this._extValueChangedHandler);
  }

  /**
   * @param {EventTarget} node
   */
  _detachListeners(node) {
    node.removeEventListener(UrlEventTypes.urlValueChange, this._extValueChangedHandler);
  }

  _focusHandler() {
    const node = this.inputElement;
    if (node) {
      node.inputElement.focus();
    }
  }

  /**
   * Computes endpoint's full URI with (possibly) variables in it.
   *
   * @param {string} baseUri API base URI
   * @param {string} endpointPath Endpoint relative URI to `baseUri`
   * @return {string} A full URI for the endpoint.
   */
  _computeFullUrl(baseUri, endpointPath) {
    if (!endpointPath) {
      endpointPath = '/';
    }
    if (endpointPath[0] !== '/') {
      endpointPath = `/${  endpointPath}`;
    }
    if (!baseUri) {
      return endpointPath;
    }
    if (baseUri[baseUri.length - 1] === '/') {
      baseUri = baseUri.substr(0, baseUri.length - 1);
    }
    return baseUri + endpointPath;
  }

  /**
   * Computes url value from current `baseUri` and query/uri models.
   *
   * @param {AmfFormItem[]} queryModel Query parameters model
   * @param {AmfFormItem[]} pathModel Uri parameters model.
   * @param {string=} uri Current endpoint uri.
   */
  async _computeValue(queryModel, pathModel, uri) {
    if (!uri) {
      this.value = '';
      urlChangeAction(this, '');
      return;
    }
    uri = this._applyUriParams(uri, pathModel);
    uri = this._applyQueryParams(uri, queryModel);
    if (uri === this.value) {
      return;
    }
    this.value = uri;
    urlChangeAction(this, uri);
    this._notifyChange();
    await this.updateComplete;
    this.validate();
  }

  /**
   * Creates a map of serialized values from a model.
   * It is a replacement for `iron-form` serialize function which
   * can't be used here because this function is called before local DOM
   * is ready and therefore form is not set.
   *
   * @param {AmfFormItem[]} model Model to compute.
   * @return {Map} Map of serialized values.
   */
  _formValuesFromModel(model) {
    const result = new Map();
    if (!model || !model.length) {
      return result;
    }
    model.forEach((item) => {
      const value = this._valueFormModelItem(item);
      if (value !== undefined) {
        result.set(item.name, value);
      }
    });
    return result;
  }

  /**
   * Extracts value from the model item.
   * If the item is required it is always returned (even if it is an empty string).
   * If value is not required and not present then it returns `undefined`.
   * Ensures boolean values are correctly preserved.
   *
   * @param {AmfFormItem} item Model item
   * @return {string} Model value
   */
  _valueFormModelItem(item) {
    if (item.schema && item.enabled === false) {
      return undefined;
    }

    const { schema = {} } = item;
    let { value } = item;

    if (schema.isBool) {
      return value === false ? "false" : "true";
    }

    if (!value && schema.required) {
      if (value !== 0 && value !== false && value !== null) {
        value = '';
      }
    } else if (!schema.required) {
      if (!value && value !== 0 && value !== false && value !== null) {
        value = undefined;
      }
    }

    return value;
  }

  /**
   * Applies URI parameters to the URL.
   *
   * @param {string} url An URL to apply the params to
   * @param {AmfFormItem[]} model Uri parameters model.
   * @return {string} The URL.
   */
  _applyUriParams(url, model) {
    if (!model) {
      return url;
    }
    const uriParams = this._formValuesFromModel(model);
    const entries = Array.from(uriParams.entries());
    for (let i = 0; i < entries.length; i++) {
      // eslint-disable-next-line prefer-const
      let [name, value] = entries[i];
      if (value === null || value === undefined) {
        continue;
      }
      value = String(value);
      const { schema={} } = model[i];
      if (!schema.noAutoEncode) {
        if (name[0] === '+' || name[0] === '#') {
          value = encodeURI(value);
        } else {
          value = this._wwwFormUrlEncodePiece(value, false);
        }
      }
      const re = this._createUrlReplaceRegex(name);
      url = url.replace(re, value);
    }
    return url;
  }

  /**
   * Creates a RegExp object to replace template variable from the base string
   * @param {string} name Name of the parameter to be replaced
   * @return {RegExp}
   */
  _createUrlReplaceRegex(name) {
    if (name[0] === '+' || name[0] === '#') {
      name = `\\${name}`;
    }
    return new RegExp(`{${name}}`);
  }

  /**
   * Applies query parameters to the URL.
   * Query parameters that are not required by the API spec and don't have value
   * are removed from the URL. Parameters that are required and don't have
   * value are set to the URL but with empty value.
   *
   * @param {string} url An URL to apply the params to
   * @param {AmfFormItem[]} model Query parameters model.
   * @return {string} The URL.
   */
  _applyQueryParams(url, model) {
    if (!model) {
      return url;
    }
    const params = this._formValuesFromModel(model);
    const items = this._computeQueryItems(params);
    const stringParams = this._wwwFormUrlEncode(items);
    if (!stringParams) {
      return url;
    }
    url += (url.indexOf('?') === -1) ? '?' : '&';
    url += stringParams;
    return url;
  }

  /**
   * Computes query parameters list of items containing `name` and `value`
   * properties to use to build query string.
   *
   * This function may change the `params` map.
   *
   * @param {Map} params Map of query model properties.
   * @return {ParamsObject[]} List of query parameters.
   */
  _computeQueryItems(params) {
    const items = [];
    for (const [name, value] of params) {
      if (value === undefined) {
        continue;
      }
      let isArray = false;
      if (value instanceof Array) {
        isArray = true;
        if (!value.length || (value.length === 1 && !value[0])) {
          continue;
        }
      }
      if (isArray) {
        for (let i = 0, len = value.length; i < len; i++) {
          if (value || value === 0 || value === false) {
            items.push({
              name,
              value: value[i]
            });
          }
        }
      } else {
        items.push({
          name,
          value,
        });
      }
    }
    return items;
  }

  /**
   * @param {ParamsObject[]} object The list of objects to encode as x-www-form-urlencoded string.
   * Each entry should have `name` and `value` properties.
   * @returns {string}
   */
  _wwwFormUrlEncode(object) {
    if (!object || !object.length) {
      return '';
    }
    const pieces = object.map((item) => {
      return `${this._wwwFormUrlEncodePiece(item.name, true)}=${this._wwwFormUrlEncodePiece(item.value, true)}`;
    });
    return pieces.join('&');
  }

  /**
   * @param {string|number} value A key or value to encode as x-www-form-urlencoded.
   * @param {boolean} replacePlus When set it replaces `%20` with `+`.
   * @returns {string}
   */
  _wwwFormUrlEncodePiece(value, replacePlus) {
    // Spec says to normalize newlines to \r\n and replace %20 spaces with +.
    // jQuery does this as well, so this is likely to be widely compatible.
    if (typeof value !== 'number' && !value) {
      return '';
    }
    let result = encodeURIComponent(value.toString().replace(/\r?\n/g, '\r\n'));
    if (replacePlus) {
      result = result.replace(/%20/g, '+');
    }
    return result;
  }

  /**
   * Updates URI / query parameters model from user input.
   *
   * @param {Event} e Input event
   */
  __userInputHandler(e) {
    const { value } = /** @type {HTMLInputElement} */ (e.target);
    let matches;
    const uriParams = this._urlParams;
    const uriRegexp = this._urlSearchRegexp;
    if (uriParams && uriRegexp) {
      matches = value.match(uriRegexp);
      if (matches) {
        matches.shift();
        this._applyUriValues(matches, uriParams);
      }
    }
    const matchesNew = value.match(/[^&?]*?=[^&?]*/g);
    if (matchesNew) {
      const params = /** @type Record<string, string|string[]> */ ({});
      matchesNew.forEach((item) => this._applyQueryParamToObject(item, params));
      this._applyQueryParamsValues(params);
    }

    this.value = value;
    urlChangeAction(this, value);
    this._notifyChange();
  }

  /**
   * Applies query parameter values to an object.
   * Repeated parameters will have array value instead of string value.
   *
   * @param {string} param Query parameter value as string. Eg `name=value`
   * @param {Record<string, string|string[]>} obj Target for values
   */
  _applyQueryParamToObject(param, obj) {
    if (!param || !obj || typeof param !== 'string') {
      return;
    }
    const parts = param.split('=');
    const name = parts[0];
    if (name in obj) {
      if (!Array.isArray(obj[name])) {
        obj[name] = [/** @type string */(obj[name])];
      }
      /** @type string[] */(obj[name]).push(parts[1]);
    } else {
      obj[name] = parts[1];
    }
  }

  /**
   * Applies values from the `values` array to the uri parameters which names are in the `names` array.
   * Both lists are ordered list of parameters.
   *
   * @param {string[]} values Values for the parameters
   * @param {string[]} names List of variables names (uri parameters).
   */
  _applyUriValues(values, names) {
    let changed = false;
    for (let i = 0, len = names.length; i < len; i++) {
      const value = values[i];
      if (value && value[0] === '{') {
        // This is still a variable
        continue;
      }
      const name = names[i];
      const index = this._findModelIndex(name, 'path');
      if (index !== -1) {
        if (this.pathModel[index].value !== value) {
          this.pathModel[index].value = value;
          changed = true;
        }
      }
    }
    if (changed) {
      this.pathModel = [...this.pathModel];
      this.dispatchEvent(new CustomEvent('pathmodelchange'));
    }
  }

  /**
   * Applies query parameters values to the render list.
   *
   * @param {Record<string, string|string[]>} map A map where keys are names of the parameters in the
   * `queryModel` list
   */
  _applyQueryParamsValues(map) {
    if (!map) {
      return;
    }
    const keys = Object.keys(map);
    let changed = false;
    keys.forEach((key) => {
      const value = map[key];
      if (value && value[0] === '{') {
        // This is still a variable
        return;
      }
      const index = this._findModelIndex(key, 'query');
      if (index !== -1) {
        if (this.queryModel[index].value !== value) {
          this.queryModel[index].value = value;
          changed = true;
        }
      }
    });
    if (changed) {
      this.queryModel = [...this.queryModel];
      this.dispatchEvent(new CustomEvent('querymodelchange'));
    }
  }

  _notifyChange() {
    this.dispatchEvent(new Event('change'));
  }

  _findModelIndex(name, type) {
    const model = this[`${type}Model`];
    if (!model) {
      return -1;
    }
    return model.findIndex((item) => item.name === name);
  }

  /**
   * A handler that is called on input
   */
  _onValueChanged() {
    this.validate();
  }

  _onElementBlur() {
    this.validate();
  }

  /**
   * A handler for the `url-value-changed` event.
   * If this element is not the source of the event then it will update the `value` property.
   * It's to be used besides the Polymer's data binding system.
   *
   * @param {CustomEvent} e
   */
  _extValueChangedHandler(e) {
    if (e.composedPath()[0] === this) {
      return;
    }
    this.value = e.detail.value;
    this._notifyChange();
  }

  _getValidity() {
    const value = this.value;
    if (value === undefined) {
      return true;
    }
    if (!this.required && !value) {
      return true;
    }
    if (!value && this.required) {
      return false;
    }
    if (!value) {
      return true;
    }
    if (typeof value !== 'string') {
      return false;
    }
    if (value.indexOf('{') !== -1 && value.indexOf('}') !== -1) {
      return false;
    }
    if (!this.shadowRoot) {
      return true;
    }
    const { inputElement } = this;
    if (inputElement) {
      return inputElement.validate();
    }
    return true;
  }

  /**
   * Creates a regular expression from the `_fullUri` to match the
   * parameters in the `value` url.
   *
   * @param {string} url Endpoint's absolute URL with (possibly) parameters.
   * @return {RegExp} A RegExp that can be used to search for parameters values.
   */
  _computeUrlRegexp(url) {
    if (!url) {
      return null;
    }
    url = url.replace('?', '\\?');
    url = url.replace(/(\.|\/)/g, '\\$1');
    url = url.replace(/{[\w\\+]+}/g, '([a-zA-Z0-9\\$\\-_\\.~\\+!\'\\(\\)\\*\\{\\}]+)');
    url += '.*';
    return new RegExp(url);
  }

  /**
   * Computes ordered list of parameters applied to the `_fullUri`.
   * For example the URL: `http://{environment}.domain.com/{apiVersion}/`
   *
   * will be mapped to
   * ```
   * [
   *   "environment",
   *   "apiVersion"
   * ]
   * ```
   *
   * @param {string} url The URL to test for the parameters.
   * @return {string[]|null} An ordered list of parameters or null if none found.
   */
  _computeUrlParams(url) {
    if (!url) {
      return null;
    }
    let paramsNames = url.match(/\{[\w\\+]+\}/g);
    if (paramsNames) {
      paramsNames = paramsNames.map((item) => item.substr(1, item.length - 2));
    }
    return paramsNames;
  }

  /**
   * @return {TemplateResult} Main template result.
   */
  render() {
    const {
      noLabelFloat,
      disabled,
      readOnly,
      invalid,
      outlined,
      compatibility,
      value,
      required
    } = this;
    return html`
    <style>${this.styles}</style>
    <anypoint-input
      ?nolabelfloat="${noLabelFloat}"
      ?disabled="${disabled}"
      ?readonly="${readOnly}"
      ?invalid="${invalid}"
      ?outlined="${outlined}"
      ?compatibility="${compatibility}"
      ?required="${required}"
      invalidMessage="The URL is invalid"
      type="url"
      .value="${value}"
      @blur="${this._onElementBlur}"
      @input="${this.__userInputHandler}">
      <label slot="label">Request URL</label>
    </anypoint-input>`;
  }
}
