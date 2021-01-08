import { AmfHelperMixin } from '@api-components/amf-helper-mixin';
import { AmfFormItem } from '@advanced-rest-client/arc-types/src/forms/FormTypes';
import { ApiUrlModelReadResult, ApiUrlModelInit } from './types';

/**
 * A class to generate view model for the URL editors
 */
export declare class ApiUrlDataModel extends AmfHelperMixin(Object) {
  amf: any;
  /** 
   * Computed value of server definition from the AMF model.
   */
  server: any;
  /** 
   * Computed model of the API operation.
   */
  operation: any;
  /** 
   * The list of supported protocols.
   * Required to compute base URI in some cases.
   *
   * This value is computed when AMF model change.
   */
  protocols: string[];
  /** 
   * API version name.
   * Computed when AMF model change
   */
  version: string;
  /** 
   * The `@id` property of selected endpoint and method to compute the data models for.
   */
  selected: string;
  /** 
   * The property to set to override AMF's model base URI information.
   * When this property is set, the `endpointUri` property is recalculated.
   */
  apiUri: string;
  /**
   * @param amf The current AMF model. Update the model (when changed) by setting the `amf` property.
   */
  constructor(amf?: any);

  /**
   * A handy function to set properties in bulk and read the result in an object.
   * It has the same effect as setting each property separately and then reading the values from the getters.
   *  
   * @param opts When set it overrides all properties defined in the `ApiUrlModelInit` interface 
   * and computes the new model values. Otherwise it does not set anything and just returns the current values.
   * You need to set other properties by using their setters. They are not included here as they are computed by default
   * and the setters allow to override the default values.
   */
  getModel(opts?: ApiUrlModelInit): ApiUrlModelReadResult;
  
  /**
   * overrides AmfHelperMixin.__amfChanged
   */
  __amfChanged(amf: any): void;

  /**
   * Computes values for `server`, `version`, and `protocol` properties if the
   * model is a web api model.
   * @param model The AMF model.
   */
  _amfChanged(model: any): void;

  /**
   * Computes `apiBaseUri` property when `amf` change.
   *
   * @param server Server definition model
   * @param version API version number
   * @param protocols List of supported protocols.
   * @param apiUri A uri to override APIs base uri
   */
  _computeApiBaseUri(server: any, version?: string, protocols?: string[], apiUri?: string): string|undefined;

  /**
   * Computes uri parameters list for API base.
   * If `version` is set it eliminates it from the variables if it's set.
   *
   * @param server The `http://raml.org/vocabularies/http#server` object
   * @param version API version number
   * @returns A view model.
   */
  _computeApiParameters(server: any, version?: string): AmfFormItem[];

  /**
   * Computes combined list of path parameters from server definition
   * (RAML's base URI) and current path variables.
   * @param endpoint Endpoint model
   * @param method Method model
   * @param apiParameters Current value of API parameters
   */
  _computePathModel(endpoint: any, method: any, apiParameters): AmfFormItem[]|undefined;

  /**
   * Finds URI parameters in method definition.
   * @param method Method model
   */
  _uriParamsFromMethod(method: any): any[]|undefined;

  /**
   * Computes value for `queryModel` property.
   *
   * @param method Supported operation model
   */
  _computeQueryModel(method: any): AmfFormItem[];

  /**
   * Computes list of query parameters to be rendered in the query parameters table.
   *
   * The parameters document can pass a type definition for query parameters
   * or a list of properties to be rendered without the parent type definition.
   *
   * @param scheme Model for Expects shape of AMF model.
   * @returns Either list of properties or a type definition for a queryString property of RAML's
   */
  _computeQueryParameters(scheme: any): any;

  /**
   * Computes endpoint's path value
   * @param endpoint The endpoint model
   */
  _computeEndpointPath(endpoint: any): string;

  /**
   * Computes value of endpoint model.
   *
   * The selection (id) can be for endpoint or for a method.
   * This tries endpoint first and then method.
   *
   * The operation result is set on `[privateEndpoint]` property.
   */
  _computeModelEndpointModel(): void;

  _computeMethodAmf(): void;

  /**
   * Clears the cache in the view model transformer.
   */
  clearCache(): void;
}
