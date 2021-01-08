import { TemplateResult, CSSResult, LitElement } from 'lit-element';
import { ValidatableMixin } from '@anypoint-web-components/validatable-mixin/validatable-mixin.js';
import { EventsTargetMixin } from '@advanced-rest-client/events-target-mixin/events-target-mixin.js';
import { AnypointInput } from '@anypoint-web-components/anypoint-input';
import { AmfFormItem } from '@advanced-rest-client/arc-types/src/forms/FormTypes';

export declare interface ParamsObject {
  name: string;
  value: string;
}

/**
 * `api-url-editor`
 * An AMF powered url editor for the HTTP request editor.
 *
 * The element is regular input element that is adjusted to work with URL
 * data.
 * It supports validation for URL values that may contain variables.
 */
export declare class ApiUrlEditorElement extends EventsTargetMixin(ValidatableMixin(LitElement)) {
  get styles(): CSSResult;

  /**
   * @return A reference to the input element.
   */
  get inputElement(): AnypointInput;

  /**
   * When set the input label won't float when focused/has input
   * @attribute
   */
  noLabelFloat: boolean;
  /**
   * Renders input element disabled.
   * @attribute
   */
  disabled: boolean;
  /**
   * When set the input is marked as required input.
   * @attribute
   */
  required: boolean;
  /**
   * Makes the input element read only.
   * @attribute
   */
  readOnly: boolean;
  /**
   * A value produced by this editor - the URL.
   * @attribute
   */
  value: string;
  /**
   * Value or RAML's base URI property.
   *
   * Note, the element doesn't check if `baseUri` is relative or not.
   * Hosting application have to take care of that.
   * @attribute
   */
  baseUri: string;
  /**
   * Currently selected endpoint relative URI.
   * It is available in RAML definition.
   * @attribute
   */
  endpointPath: string;
  /**
   * Computed value, sum of `baseUri` and `endpointPath`
   */
  _fullUri: string;
  /**
   * The query properties model.
   * Use `api-url-data-model` to compute model for the view.
   */
  queryModel: AmfFormItem[];
  /**
   * The URI properties model.
   * Use `api-url-data-model` to compute model for the view.
   */
  pathModel: AmfFormItem[];
  /**
   * Computed, ordered list of URL variables in the URI string.
   */
  _urlParams: string[];
  /**
   * Computed regexp for the current `_fullUri` value to search for the
   * URI parameters.
   */
  _urlSearchRegexp: RegExp;
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
   * AMF model used to compute view model.
   */
  amf: any;

  onvalue: EventListener;

  constructor();

  firstUpdated(): void;

  connectedCallback(): void;

  disconnectedCallback(): void;

  _attachListeners(node: EventTarget): void;

  _detachListeners(node: EventTarget): void;

  _focusHandler(): void;

  /**
   * Registers an event handler for given type
   * @param eventType Event type (name)
   * @param value The handler to register
   */
  _registerCallback(eventType: string, value: EventListener): void;

  /**
   * Computes endpoint's full URI with (possibly) variables in it.
   *
   * @param baseUri API base URI
   * @param endpointPath Endpoint relative URI to `baseUri`
   * @return A full URI for the endpoint.
   */
  _computeFullUrl(baseUri: string, endpointPath: string): string

  /**
   * Computes url value from current `baseUri` and query/uri models.
   *
   * @param queryModel Query parameters model
   * @param pathModel Uri parameters model.
   * @param uri Current endpoint uri.
   */
  _computeValue(queryModel: AmfFormItem[], pathModel: AmfFormItem[], uri: string): Promise<void>;
  
  /**
   * Creates a map of serialized values from a model.
   * It is a replacement for `iron-form` serialize function which
   * can't be used here because this function is called before local DOM
   * is ready and therefore form is not set.
   *
   * @param model Model to compute.
   * @return Map of serialized values.
   */
  _formValuesFromModel(model: AmfFormItem[]): Map<string, string>;
  
  /**
   * Extracts value from the model item.
   * If the item is required it is always returned (even  if it is empty string).
   * If value is not required and not present then it returns `undefined`.
   *
   * @param item Model item
   * @return Model value
   */
  _valueFormModelItem(item: AmfFormItem): string

  /**
   * Applies URI parameters to the URL.
   *
   * @param url An URL to apply the params to
   * @param model Uri parameters model.
   * @return The URL.
   */
  _applyUriParams(url: string, model: AmfFormItem[]): string

  /**
   * Creates a RegExp object to replace template variable from the base string
   * @param name Name of the parameter to be replaced
   * @return {RegExp}
   */
  _createUrlReplaceRegex(name: string): RegExp;
  
  /**
   * Applies query parameters to the URL.
   * Query parameters that are not required by the API spec and don't have value
   * are removed from the URL. Parameters that are required and don't have
   * value are set to the URL but with empty value.
   *
   * @param url An URL to apply the params to
   * @param model Query parameters model.
   * @return The URL.
   */
  _applyQueryParams(url: string, model: AmfFormItem[]): string

  /**
   * Computes query parameters list of items containing `name` and `value`
   * properties to use to build query string.
   *
   * This function may change the `params` map.
   *
   * @param params Map of query model properties.
   * @return List of query parameters.
   */
  _computeQueryItems(params: Map<string, string>): ParamsObject[];

  /**
   * @param object The list of objects to encode as x-www-form-urlencoded string. 
   * Each entry should have `name` and `value` properties.
   */
  _wwwFormUrlEncode(object: ParamsObject[]): string
  
  /**
   * @param str A key or value to encode as x-www-form-urlencoded.
   * @param replacePlus When set it replaces `%20` with `+`.
   */
  _wwwFormUrlEncodePiece(str: string, replacePlus: boolean): string;

  /**
   * Updates URI / query parameters model from user input.
   *
   * @param e Input event
   */
  __userInputHandler(e: Event): void;

  /**
   * Applies query parameter values to an object.
   * Repeated parameters will have array value instead of string value.
   *
   * @param param Query parameter value as string. Eg `name=value`
   * @param obj Target for values
   */
  _applyQueryParamToObject(param: string, obj: any): void;
  
  /**
   * Applies values from the `values` array to the uri parameters which names are in the `names` array.
   * Both lists are ordered list of parameters.
   *
   * @param values Values for the parameters
   * @param names List of variables names (uri parameters).
   */
  _applyUriValues(values: string[], names: string[]): void;

  _notifyPathModel(value: AmfFormItem[]): void;

  /**
   * Applies query parameters values to the render list.
   *
   * @param map A map where keys are names of the parameters in the `queryModel` list
   */
  _applyQueryParamsValues(map: any): void;

  /**
   * Dispatches `querymodelchange` custom event.
   * @param value
   */
  _notifyQueryModel(value: AmfFormItem): void;

  _findModelIndex(name: string, type: string): number;

  /**
   * A handler that is called on input
   */
  _onValueChanged(): void;

  _onElementBlur(): void;

  /**
   * A handler for the `url-value-changed` event.
   * If this element is not the source of the event then it will update the `value` property.
   */
  _extValueChangedHandler(e: CustomEvent): void;

  _getValidity(): boolean;

  /**
   * Creates a regular expression from the `_fullUri` to match the
   * parameters in the `value` url.
   *
   * @param url Endpoint's absolute URL with (possibly) parameters.
   * @return {RegExp} A RegExp that can be used to search for parameters values.
   */
  _computeUrlRegexp(url: string): RegExp;

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
   * @param url The URL to test for the parameters.
   * @return {Array|null} An ordered list of parameters or null if none found.
   */
  _computeUrlParams(url: string): string[];

  /**
   * Creates a view model for a property that has not been originally in
   * the URL model (e.g. custom query parameter)
   *
   * @param name Parameter name
   * @param value Parameter value
   * @returns View model
   */
  _buildPropertyItem(name: string, value: string): AmfFormItem;

  /**
   * @return Main template result.
   */
  render(): TemplateResult;
}
