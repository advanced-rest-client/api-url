/* eslint-disable class-methods-use-this */
import { html, LitElement } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { apiFormStyles, ApiViewModel } from '@api-components/api-forms';
import '@anypoint-web-components/anypoint-switch/anypoint-switch.js';
import '@api-components/api-forms/api-form-item.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@advanced-rest-client/arc-icons/arc-icon.js';
import elementStyles from './styles/ParamsEditor.styles.js';

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.AmfFormItem} AmfFormItem */

export const notifyModelChange = Symbol('notifyModelChange');
export const customNameInput = Symbol('customNameInput');
export const customValueInput = Symbol('customValueInput');
export const customInputHandler = Symbol('customInputHandler');
export const validateModel = Symbol('validateModel');
export const serializeModel = Symbol('serializeModel');
export const addTemplate = Symbol('addTemplate');
export const emptySelectionTemplate = Symbol('emptySelectionTemplate');
export const uriFormTemplate = Symbol('uriFormTemplate');
export const queryFormTemplate = Symbol('queryFormTemplate');
export const paramsFormTemplate = Symbol('paramsFormTemplate');
export const itemTemplate = Symbol('itemTemplate');
export const paramToggleTemplate = Symbol('paramToggleTemplate');
export const paramInputTemplate = Symbol('paramInputTemplate');
export const paramRemoveTemplate = Symbol('paramRemoveTemplate');
export const enabledHandler = Symbol('enabledHandler');
export const apiFormHandler = Symbol('apiFormHandler');
export const removeParamHandler = Symbol('removeParamHandler');
export const addCustomHandler = Symbol('addCustomHandler');
export const showOptionalTemplate = Symbol('showOptionalTemplate');
export const showOptionalHandler = Symbol('showOptionalHandler');
export const focusLastName = Symbol('focusLastName');

/**
 * An element to render query / uri parameters form from AMF schema
 */
export class ApiUrlParamsEditorElement extends ValidatableMixin(EventsTargetMixin(LitElement)) {
  get styles() {
    return [
      apiFormStyles,
      elementStyles,
    ];
  }

  static get properties() {
    return {
      /**
       * Computed query parameters model.
       *
       * Note, this element won't accept AMF data.
       */
      queryModel: { type: Array },
      /**
       * Computed URI parameters model.
       *
       * Note, this element won't accept AMF data.
       */
      pathModel: { type: Array },
      /**
       * When set, renders add custom parameter button in query parameters
       * form
       */
      allowCustom: { type: Boolean },
      /**
       * Enables compatibility with Anypoint components.
       */
      compatibility: { type: Boolean, reflect: true },
      /**
       * Enables Material Design outlined style
       */
      outlined: { type: Boolean },
      /**
       * When set the editor is in read only mode.
       */
      readOnly: { type: Boolean },
      /**
       * When set the editor disabled all controls
       */
      disabled: { type: Boolean },
      /**
       * When set the editor runs the validation logic on the element when values change
       */
      autoValidate: { type: Boolean },
      /**
       * When set the editor renders an empty message when there are no parameters ro render.
       */
      emptyMessage: { type: Boolean },
      /**
       * When set, optional params can be disabled
       */
      allowDisableParams: { type: Boolean },
      /**
       * When set, optional parameters can be hidden
       */
      allowHideOptional: { type: Boolean },
      /**
       * Shows or hides optional query params
       */
      _showOptional: { type: Boolean },
    };
  }

  /**
   * @returns {boolean} True when query parameters section should be rendered
   */
  get hasQueryParameters() {
    const { queryModel, allowCustom } = this;
    return !!allowCustom || Array.isArray(queryModel) && !!queryModel.length;
  }

  /**
   * @returns {boolean} True when path parameters section should be rendered
   */
  get hasPathParameters() {
    const { pathModel } = this;
    return Array.isArray(pathModel) && !!pathModel.length;
  }

  /**
   * @returns {Record<string, any>} Serialized value of enabled query parameters
   */
  get queryValue() {
    const { queryModel=[] } = this;
    return this[serializeModel](queryModel);
  }

  /**
   * @returns {Record<string, any>} Serialized value of enabled path parameters
   */
  get pathValue() {
    const { pathModel=[] } = this;
    return this[serializeModel](pathModel);
  }

  get _hasOptionalParams() {
    const { queryModel } = this;
    return queryModel.filter(qm => !qm.schema.required).length !== 0;
  }

  constructor() {
    super();

    this.readOnly = false;
    this.disabled = false;
    this.compatibility = false;
    this.outlined = false;
    this.allowCustom = false;
    this.autoValidate = false;
    this.emptyMessage = false;
    this.allowHideOptional = false;
    this.allowDisableParams = false;
    this._showOptional = true;
    /** 
     * @type {AmfFormItem[]}
     */
    this.queryModel = undefined;
    /** 
     * @type {AmfFormItem[]}
     */
    this.pathModel = undefined;
  }

  /**
   * @param {Map<string | number | symbol, unknown>} changedProperties
   */
  updated(changedProperties) {
    super.updated(changedProperties);
    if (this.autoValidate) {
      this.validate();
    }
  }

  /**
   * Overridden from ValidatableMixin. Will set the `invalid`
   * attribute automatically, which should be used for styling.
   * @return {boolean}
   */
  _getValidity() {
    if (!this.validateUriParams()) {
      return false;
    }
    if (!this.validateQueryParams()) {
      return false;
    }
    return true;
  }

  /**
   * Validates the URI parameters
   * @returns {boolean}
   */
  validateUriParams() {
    return this[validateModel](this.pathModel);
  }

  /**
   * Validates the query parameters
   * @returns {boolean}
   */
  validateQueryParams() {
    return this[validateModel](this.queryModel);
  }

  /**
   * @param {AmfFormItem[]} model The model items to validate
   * @returns {boolean} True when the model items are valid
   */
  [validateModel](model) {
    if (!Array.isArray(model)) {
      return true;
    }
    const item = model.some((entry) => {
      const { name, value, schema={} } = entry;
      if (!schema.required) {
        return false;
      }
      if (!name) {
        return false;
      }
      if (Array.isArray(value)) {
        return !value.length;
      }
      return !value;
    });
    return !item;
  }

  /**
   * @param {CustomEvent} e
   */
  [enabledHandler](e) {
    const node = /** @type HTMLElement */ (e.target);
    const index = Number(node.dataset.index);
    const { type } = node.dataset;
    const item = /** @type AmfFormItem */ (this[type][index]);
    item.enabled = e.detail.value;
    this[notifyModelChange](type);
  }

  /**
   * @param {Event} e
   */
  [apiFormHandler](e) {
    const node = /** @type HTMLInputElement */ (e.target);
    const index = Number(node.dataset.index);
    const { type } = node.dataset;
    const item = /** @type AmfFormItem */ (this[type][index]);
    item.value = node.value;
    this[notifyModelChange](type);
  }

  /**
   * @param {Event} e
   */
  [removeParamHandler](e) {
    const node = /** @type HTMLElement */ (e.currentTarget);
    const index = Number(node.dataset.index);
    const { type } = node.dataset;
    this[type].splice(index, 1);
    this[notifyModelChange](type);
    this.requestUpdate();
  }

  /**
   * @param {Event} e
   */
  [customInputHandler](e) {
    const node = /** @type HTMLInputElement */ (e.target);
    const index = Number(node.dataset.index);
    const { type, property } = node.dataset;
    const { value } = node;
    const item = /** @type AmfFormItem */ (this[type][index]);
    const old = item[property];
    if (old === value) {
      return;
    }
    item[property] = value;
    this[notifyModelChange](type);
  }

  /**
   * Set the `_showOptional` property when the switch changes
   * @param {CustomEvent<{ value: boolean }>} e 
   */
  [showOptionalHandler](e) {
    this._showOptional = e.detail.value;
  }

  /**
   * Updates the `value` from the current model and dispatches the value change event
   * @param {string} type
   */
  [notifyModelChange](type) {
    const eventType = `${type.toLowerCase()}change`;
    this.dispatchEvent(new CustomEvent(eventType));
  }

  [addCustomHandler]() {
    if (!this.allowCustom) {
      return;
    }
    this.addCustom();
    this[notifyModelChange]('queryModel');
  }

  /**
   * Focuses on the last param name filed
   */
   [focusLastName]() {
    const row = this.shadowRoot.querySelector('.params-list > :last-child');
    if (!row) {
      return;
    }
    try {
      const node = row.querySelector('.param-name');
      // @ts-ignore
      node.focus();
    } catch (e) {
      // ...
    }
  }

  /**
   * Adds empty custom property to the list.
   */
  addCustom() {
    const defaults = /** @type AmfFormItem */ ({
      name: '',
      value: '',
      enabled: true,
      schema: {
        isCustom: true,
      },
    });
    const worker = new ApiViewModel();
    const item = worker.buildProperty(defaults);
    const model = this.queryModel || [];
    this.queryModel = [...model, item];
    if (this.allowHideOptional && !this._showOptional) {
      this._showOptional = true;
    }

    setTimeout(() => this[focusLastName]());
  }

  /**
   * @param {AmfFormItem[]} model The model items to validate
   * @returns {Record<string, any>} Serialized value of the model.
   */
  [serializeModel](model) {
    const result = /** @type Record<string, string> */ ({});
    model.forEach((item) => {
      const { enabled, schema } = item;
      if (enabled === false) {
        return;
      }
      if (!schema.required && !item.value) {
        return;
      }
      result[item.name] = item.value;
    });
    return result;
  }
  
  render() {
    return html`<style>${this.styles}</style>
    ${this[emptySelectionTemplate]()}
    ${this[uriFormTemplate]()}
    ${this[queryFormTemplate]()}
    `;
  }
  
  /**
   * @return {TemplateResult|string} The template for the empty message when no model is assigned.
   */
  [emptySelectionTemplate]() {
    if (!this.emptyMessage) {
      return '';
    }
    const { hasPathParameters, hasQueryParameters } = this;
    if (hasPathParameters || hasQueryParameters) {
      return '';
    }
    return html`
    <section class="empty-message">
      <p>This endpoint doesn't declare query or URI parameters.</p>
    </section>`;
  }

  /**
   * @return {TemplateResult|string} The template for the URI parameters form
   */
  [uriFormTemplate]() {
    const { pathModel, hasPathParameters } = this;
    if (!hasPathParameters) {
      return '';
    }
    return html`
    <div role="heading" aria-level="1" class="form-title">URI parameters</div>
    ${this[paramsFormTemplate](pathModel, 'pathModel')}
    `;
  }

  /**
   * @return {TemplateResult|string} The template for the query parameters form
   */
  [queryFormTemplate]() {
    const { queryModel=[], hasQueryParameters } = this;
    if (!hasQueryParameters) {
      return '';
    }
    return html`
    <div role="heading" aria-level="1" class="form-title">Query parameters</div>
    ${this[showOptionalTemplate]()}
    ${this[paramsFormTemplate](queryModel, 'queryModel')}
    ${this[addTemplate]()}
    `;
  }

  _hasRequiredParams(model) {
    return model && model.find(item => item.schema && item.schema.required) !== undefined;
  }

  /**
   * @param {AmfFormItem[]} model
   * @param {string} type
   * @return {TemplateResult} Template for the parameters list
   */
  [paramsFormTemplate](model, type) {
    const noRequiredParams = !this._hasRequiredParams(model)
    return html`
    <div class="params-list">
      <div class="required-params" ?hidden=${noRequiredParams}>* Required field</div>
      ${model.map((item, index) => this[itemTemplate](item, index, type))}
    </div>
    `;
  }

  /**
   * Renders the switch to hide optional parameters if it is enabled
   * @return {TemplateResult}
   */
  [showOptionalTemplate]() {
    const { allowHideOptional, _showOptional, compatibility } = this;
    if (!allowHideOptional) {
      return html``;
    }
    return html`<anypoint-switch
      .checked="${_showOptional}"
      @checked-changed="${this[showOptionalHandler]}"
      title="Show optional parameters"
      aria-label="Toggle optional parameters visibility"
      class="param-switch"
      ?compatibility="${compatibility}"
      ?disabled=${!this._hasOptionalParams}
    >
      Show optional parameters
    </anypoint-switch>`;
  }

  /**
   * @param {AmfFormItem} item
   * @param {number} index
   * @param {string} type
   */
  [itemTemplate](item, index, type) {
    const { allowHideOptional, _showOptional: showOptional } = this;
    const hidden = allowHideOptional && !showOptional  && !item.schema.required;
    return html`
    <div class="form-row form-item" ?hidden=${hidden} data-form-item="${item.name}">
      ${this[paramToggleTemplate](item, index, type)}
      ${this[paramInputTemplate](item, index, type)}
      ${this[paramRemoveTemplate](item, index, type)}
    </div>
    `;
  }

  /**
   * @param {AmfFormItem} item
   * @param {number} index
   * @param {string} type
   * @return {TemplateResult|string} Template for the parameter name input
   */
  [paramToggleTemplate](item, index, type) {
    const { allowDisableParams } = this;
    const { schema={} } = item;
    if (!schema.isCustom && !allowDisableParams) {
      return '';
    }
    const { compatibility, readOnly, disabled } = this;
    return html`
    <anypoint-switch
      data-index="${index}"
      data-type="${type}"
      .checked="${item.enabled}"
      @checked-changed="${this[enabledHandler]}"
      title="Enable / disable parameter"
      aria-label="Toggle query parameter"
      class="param-switch"
      ?disabled="${readOnly||disabled}"
      ?compatibility="${compatibility}"
    ></anypoint-switch>
    `;
  }

  /**
   * @param {AmfFormItem} item
   * @param {number} index
   * @param {string} type
   * @return {TemplateResult} Template for the parameter input
   */
  [paramInputTemplate](item, index, type) {
    const { schema={} } = item;
    if (schema.isCustom) {
      return html`
        ${this[customNameInput](item, index, type)}
        ${this[customValueInput](item, index, type)}
      `;
    }
    return html`
    <api-form-item
      data-index="${index}"
      data-type="${type}"
      .name="${item.name}"
      .value="${item.value}"
      @change="${this[apiFormHandler]}"
      .model="${item}"
      ?required="${schema.required}"
      .readOnly="${this.readOnly || schema.readOnly}"
      ?disabled="${this.disabled}"
      ?outlined="${this.outlined}"
      ?compatibility="${this.compatibility}"
    ></api-form-item>
    `;
  }

  /**
   * @param {AmfFormItem} item
   * @param {number} index
   * @param {string} type
   * @return {TemplateResult|string} Template for the parameter name input
   */
  [paramRemoveTemplate](item, index, type) {
    const { schema={} } = item;
    if (!schema.isCustom) {
      return '';
    }
    const { compatibility, readOnly, disabled } = this;
    return html`
    <anypoint-icon-button
      data-index="${index}"
      data-type="${type}"
      @click="${this[removeParamHandler]}"
      title="Remove this parameter"
      aria-label="Remove query parameter"
      ?disabled="${readOnly||disabled}"
      ?compatibility="${compatibility}"
      class="remove-param"
    >
      <arc-icon icon="removeCircleOutline" aria-hidden="true"></arc-icon>
    </anypoint-icon-button>
    `;
  }

  /**
   * @returns {TemplateResult|string} a template for the empty list view
   */
  [addTemplate]() {
    if (!this.allowCustom) {
      return '';
    }
    const { compatibility, readOnly, disabled } = this;
    return html`
    <div class="form-actions">
      <anypoint-button
        emphasis="low"
        @click="${this[addCustomHandler]}"
        class="add-param"
        ?compatibility="${compatibility}"
        ?disabled="${readOnly||disabled}"
        aria-label="Add query parameter"
      >
        <arc-icon icon="addCircleOutline" aria-hidden="true"></arc-icon> Add
      </anypoint-button>
    </div>
    `;
  }

  /**
   * @param {AmfFormItem} item
   * @param {number} index
   * @param {string} type
   * @return {TemplateResult} The template for the custom parameter name input
   */
  [customNameInput](item, index, type) {
    const { compatibility, outlined, readOnly } = this;
    return html`
    <anypoint-input
      autoValidate
      .value="${item.name}"
      data-property="name"
      data-type="${type}"
      data-index="${index}"
      class="param-name"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      ?readOnly="${readOnly}"
      pattern="\\S*"
      @input="${this[customInputHandler]}"
      noLabelFloat
    >
      <label slot="label">Param name</label>
    </anypoint-input>
    `;
  }

  /**
   * @param {AmfFormItem} item
   * @param {number} index
   * @param {string} type
   * @return {TemplateResult} The template for the custom parameter value input
   */
  [customValueInput](item, index, type) {
    const { compatibility, outlined, readOnly } = this;
    return html`
    <anypoint-input
      .value="${item.value}"
      data-property="value"
      data-type="${type}"
      data-index="${index}"
      class="param-value"
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      ?readOnly="${readOnly}"
      @input="${this[customInputHandler]}"
      noLabelFloat
    >
      <label slot="label">Param value</label>
    </anypoint-input>
    `;
  }

  _shouldFilterQueryParam(/** @type {AmfFormItem} */ queryModel) {
    const { allowHideOptional, _showOptional: showOptional } = this;
    if (!allowHideOptional || showOptional) {
      return true;
    }
    return (queryModel.schema || {}).required;
  }
}
