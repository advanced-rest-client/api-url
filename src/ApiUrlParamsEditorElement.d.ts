import { TemplateResult, LitElement, CSSResult } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin';
import { AmfFormItem } from '@advanced-rest-client/arc-types/src/forms/FormTypes';

export declare const notifyModelChange: unique symbol;
export declare const customNameInput: unique symbol;
export declare const customValueInput: unique symbol;
export declare const customInputHandler: unique symbol;
export declare const validateModel: unique symbol;
export declare const serializeModel: unique symbol;
export declare const addTemplate: unique symbol;
export declare const emptySelectionTemplate: unique symbol;
export declare const uriFormTemplate: unique symbol;
export declare const queryFormTemplate: unique symbol;
export declare const paramsFormTemplate: unique symbol;
export declare const itemTemplate: unique symbol;
export declare const paramToggleTemplate: unique symbol;
export declare const paramInputTemplate: unique symbol;
export declare const paramRemoveTemplate: unique symbol;
export declare const enabledHandler: unique symbol;
export declare const apiFormHandler: unique symbol;
export declare const removeParamHandler: unique symbol;
export declare const addCustomHandler: unique symbol;
export declare const showOptionalTemplate: unique symbol;
export declare const showOptionalHandler: unique symbol;

/**
 * An element to render query / uri parameters form from AMF schema
 * 
 * @event pathmodelchange
 * @event querymodelchange
 */
export class ApiUrlParamsEditorElement extends ValidatableMixin(EventsTargetMixin(LitElement)) {
  get styles(): CSSResult;

  /**
   * Computed query parameters model.
   *
   * Note, this element won't accept AMF data.
   */
  queryModel: AmfFormItem[];
  /**
   * Computed URI parameters model.
   *
   * Note, this element won't accept AMF data.
   */
  pathModel: AmfFormItem[];
  /**
   * When set, renders add custom parameter button in query parameters form
   * @attribute
   */
  allowCustom: boolean;
  /**
   * Enables compatibility with Anypoint components.
   * @attribute
   */
  compatibility: boolean;
  /**
   * Enables Material Design outlined style
   * @attribute
   */
  outlined: boolean;
  /**
   * When set the editor is in read only mode.
   * @attribute
   */
  readOnly: boolean;
  /**
   * When set the editor disabled all controls
   * @attribute
   */
  disabled: boolean;
  /**
   * When set the editor runs the validation logic on the element when values change
   * @attribute
   */
  autoValidate: boolean;
  /**
   * When set the editor renders an empty message when there are no parameters ro render.
   * @attribute
   */
  emptyMessage: boolean;
  /**
   * When set, optional params can be disabled
   * @attribute
   */
  allowDisableParams: boolean;
  /**
   * When set, optional parameters can be hidden
   * @attribute
   */
  allowHideOptional: boolean;
  /**
   * Shows or hides optional query params
   */
  _showOptional: boolean;

  /**
   * @returns {boolean} True when query parameters section should be rendered
   */
  get hasQueryParameters(): boolean;

  /**
   * @returns {boolean} True when path parameters section should be rendered
   */
  get hasPathParameters(): boolean;

  /**
   * @returns Serialized value of enabled query parameters
   */
  get queryValue(): Record<string, any>;

  /**
   * @returns Serialized value of enabled path parameters
   */
  get pathValue(): Record<string, any>;

  constructor();

  updated(changedProperties: Map<string | number | symbol, unknown>): void;

  /**
   * Overridden from ValidatableMixin. Will set the `invalid`
   * attribute automatically, which should be used for styling.
   */
  _getValidity(): boolean;

  /**
   * Validates the URI parameters
   */
  validateUriParams(): boolean;

  /**
   * Validates the query parameters
   */
  validateQueryParams(): boolean;

  /**
   * Determines whether query param should be filtered
   */
  _shouldFilterQueryParam(queryModel: AmfFormItem): boolean;

  [validateModel](model: AmfFormItem[]): boolean;

  [enabledHandler](e: CustomEvent): void;

  [apiFormHandler](e: Event): void;

  [removeParamHandler](e: Event): void;

  [customInputHandler](e: Event): void;

  [showOptionalHandler](e: Event): void

  /**
   * Updates the `value` from the current model and dispatches the value change event
   */
  [notifyModelChange](type: string): void;

  [addCustomHandler](): void;

  /**
   * Adds empty custom property to the list.
   */
  addCustom(): void;

  /**
   * @param model The model items to validate
   * @returns Serialized value of the model.
   */
  [serializeModel](model: AmfFormItem[]): Record<string, any>;
  
  render(): TemplateResult;
  
  /**
   * @return The template for the empty message when no model is assigned.
   */
  [emptySelectionTemplate](): TemplateResult|string;

  /**
   * @return The template for the URI parameters form
   */
  [uriFormTemplate](): TemplateResult|string;

  /**
   * @return The template for the query parameters form
   */
  [queryFormTemplate](): TemplateResult|string;

  /**
   * @return Template for the parameters list
   */
  [paramsFormTemplate](model: AmfFormItem[], type: string): TemplateResult;

  [itemTemplate](item: AmfFormItem, index: number, type: string): TemplateResult;

  /**
   * @return Template for the parameter name input
   */
  [paramToggleTemplate](item: AmfFormItem, index: number, type: string): TemplateResult|string;

  /**
   * @return Template for the parameter input
   */
  [paramInputTemplate](item: AmfFormItem, index: number, type: string): TemplateResult;

  /**
   * @return Template for the parameter name input
   */
  [paramRemoveTemplate](item: AmfFormItem, index: number, type: string): TemplateResult|string;

  /**
   * @returns a template for the empty list view
   */
  [addTemplate](): TemplateResult|string;

  /**
   * @return The template for the custom parameter name input
   */
  [customNameInput](item: AmfFormItem, index: number, type: string): TemplateResult;

  /**
   * @return The template for the custom parameter value input
   */
  [customValueInput](item: AmfFormItem, index: number, type: string): TemplateResult;

  /**
   * Renders the switch to hide optional parameters if it is enabled
   */
  [showOptionalTemplate](): TemplateResult;
}
