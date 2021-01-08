import { ApiViewModel } from '@api-components/api-forms';
import { AmfHelperMixin } from '@api-components/amf-helper-mixin';

/** @typedef {import('@advanced-rest-client/arc-types').FormTypes.AmfFormItem} AmfFormItem */
/** @typedef {import('./types').ApiUrlModelInit} ApiUrlModelInit */
/** @typedef {import('./types').ApiUrlModelReadResult} ApiUrlModelReadResult */

/**
 * A class to generate view model for the URL editors
 */
export class ApiUrlDataModel extends AmfHelperMixin(Object) {
  /**
   * @param {any=} amf The current AMF model. Update the model (when changed) by setting the `amf` property.
   */
  constructor(amf) {
    super();
    /** 
     * Computed value of server definition from the AMF model.
     * @type {any}
     */
    this.server = undefined;
    /** 
     * Computed model of the API operation.
     * @type {any}
     */
    this.operation = undefined;
    /** 
     * The list of supported protocols.
     * Required to compute base URI in some cases.
     *
     * This value is computed when AMF model change.
     * @type {string[]}
     */
    this.protocols = undefined;
    /** 
     * API version name.
     * Computed when AMF model change
     * 
     * @type {string}
     */
    this.version = undefined;
    /** 
     * The `@id` property of selected endpoint and method to compute the data models for.
     * 
     * @type {string}
     */
    this.selected = undefined;
    /** 
     * The property to set to override AMF's model base URI information.
     * When this property is set, the `endpointUri` property is recalculated.
     * 
     * @type {string}
     */
    this.apiUri = undefined;

    this.amf = amf;
  }

  /**
   * A handy function to set properties in bulk and read the result in an object.
   * It has the same effect as setting each property separately and then reading the values from the getters.
   *  
   * @param {ApiUrlModelInit=} opts When set it overrides all properties defined in the `ApiUrlModelInit` interface 
   * and computes the new model values. Otherwise it does not set anything and just returns the current values.
   * You need to set other properties by using their setters. They are not included here as they are computed by default
   * and the setters allow to override the default values.
   * @returns {ApiUrlModelReadResult}
   */
  getModel(opts) {
    if (opts) {
      this.apiUri = opts.apiUri;
      this.selected = opts.selected;
      this.server = opts.server;
    }

    this._computeModelEndpointModel();
    this._computeMethodAmf();

    const apiParameters = this._computeApiParameters(this.server, this.version);
    const apiBaseUri = this._computeApiBaseUri(this.server, this.version, this.protocols, this.apiUri);
    const endpointUri = this._computeEndpointUri(this.server, this.endpoint, this.apiUri, this.version);
    const pathModel = this._computePathModel(this.endpoint, this.operation, apiParameters);
    const queryModel = this._computeQueryModel(this.operation);
    const endpointPath = this._computeEndpointPath(this.endpoint);

    return {
      apiParameters,
      queryModel,
      pathModel,
      endpointUri,
      endpointPath,
      apiBaseUri,
    };
  }
  
  /**
   * overrides AmfHelperMixin.__amfChanged
   * @param {any} amf 
   */
  __amfChanged(amf) {
    this._computeModelEndpointModel();
    this._computeMethodAmf();
    this._amfChanged(amf);
  }

  /**
   * Computes values for `server`, `version`, and `protocol` properties if the
   * model is a web api model.
   * @param {any} model The AMF model.
   */
  _amfChanged(model) {
    let api = model;
    if (Array.isArray(api)) {
      [api] = api;
    }
    if (!api || !this._hasType(api, this.ns.aml.vocabularies.document.Document)) {
      return;
    }
    const version = this._computeApiVersion(api);
    const protocols = this._computeProtocols(api);
    this.protocols = protocols;
    this.version = version;
  }

  /**
   * Computes `apiBaseUri` property when `amf` change.
   *
   * @param {any} server Server definition model
   * @param {string=} version API version number
   * @param {string[]=} protocols List of supported protocols.
   * @param {string=} apiUri A uri to override APIs base uri
   * @returns {string|undefined}
   */
  _computeApiBaseUri(server, version, protocols, apiUri) {
    let uri = this._getBaseUri(apiUri, server, protocols);
    if (!uri) {
      return undefined;
    }
    if (version && uri.indexOf('{version}') !== -1) {
      uri = uri.replace('{version}', version);
    }
    const lastIndex = uri.length - 1;
    if (uri[lastIndex] === '/') {
      uri = uri.substr(0, lastIndex);
    }
    return uri;
  }

  /**
   * Computes uri parameters list for API base.
   * If `version` is set it eliminates it from the variables if it's set.
   *
   * @param {any} server The `http://raml.org/vocabularies/http#server` object
   * @param {string=} version API version number
   * @return {AmfFormItem[]} A view model.
   */
  _computeApiParameters(server, version) {
    if (!server) {
      return [];
    }
    const variables = this._computeServerVariables(server);
    if (!variables || !variables.length) {
      return [];
    }
    if (version) {
      const index = variables.findIndex((item) => this._getValue(item, this.ns.aml.vocabularies.core.name) === 'version');
      if (index > -1) {
        variables.splice(index, 1);
      }
    }
    const gen = new ApiViewModel({ amf: this.amf });
    let model = gen.computeViewModel(variables);
    if (model && model.length) {
      model = Array.from(model);
    } else {
      model = undefined;
    }
    return model;
  }

  /**
   * Computes combined list of path parameters from server definition
   * (RAML's base URI) and current path variables.
   * @param {any} endpoint Endpoint model
   * @param {any} method Method model
   * @param {AmfFormItem[]=} apiParameters Current value of API parameters
   * @return {AmfFormItem[]|undefined}
   */
  _computePathModel(endpoint, method, apiParameters) {
    if (!endpoint) {
      return [];
    }
    let params = this._computeQueryParameters(endpoint);
    if (!params || !params.length) {
      params = this._uriParamsFromMethod(method);
      if (!params) {
        return apiParameters;
      }
    }
    const gen = new ApiViewModel({ amf: this.amf });
    let model = gen.computeViewModel(params);
    if (!model) {
      model = [];
    }
    if (apiParameters && apiParameters[0]) {
      model = Array.from(apiParameters).concat(model);
    }
    return model;
  }

  /**
   * Finds URI parameters in method definition.
   * @param {any} method Method model
   * @return {any[]|undefined}
   */
  _uriParamsFromMethod(method) {
    if (!method) {
      return undefined;
    }
    const request = this._computeExpects(method);
    if (!request) {
      return undefined;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.apiContract.uriParameter);
    const params = this._ensureArray(request[key]);
    return params && params.length ? params : undefined;
  }

  /**
   * Computes value for `queryModel` property.
   *
   * @param {any} method Supported operation model
   * @return {AmfFormItem[]}
   */
  _computeQueryModel(method) {
    if (!method) {
      return [];
    }
    const request = this._computeExpects(method);
    if (!request) {
      return [];
    }
    const params = this._computeQueryParameters(request);
    if (!params) {
      return [];
    }
    const gen = new ApiViewModel({ amf: this.amf });
    let data = gen.computeViewModel(params);
    if (data && data.length) {
      data = Array.from(data);
    } else {
      data = [];
    }
    return data;
  }

  /**
   * Computes list of query parameters to be rendered in the query parameters table.
   *
   * The parameters document can pass a type definition for query parameters
   * or a list of properties to be rendered without the parent type definition.
   *
   * @param {any} scheme Model for Expects shape of AMF model.
   * @return {any} Either list of properties or a type definition for a queryString property of RAML's
   */
  _computeQueryParameters(scheme) {
    if (!scheme) {
      return undefined;
    }
    const pKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.parameter);
    let result = this._ensureArray(scheme[pKey]);
    if (result) {
      return result;
    }
    const qKey = this._getAmfKey(this.ns.aml.vocabularies.apiContract.queryString);
    result = this._ensureArray(scheme[qKey]);
    if (result) {
      result = /** @type any */ (this._resolve(result[0]));
    }
    return result;
  }

  /**
   * Computes endpoint's path value
   * @param {any} endpoint Endpoint model
   * @return {string}
   */
  _computeEndpointPath(endpoint) {
    return /** @type string */ (this._getValue(endpoint, this.ns.raml.vocabularies.apiContract.path));
  }

  /**
   * Computes value of endpoint model.
   *
   * The selection (id) can be for endpoint or for a method.
   * This tries endpoint first and then method.
   *
   * The operation result is set on `[privateEndpoint]` property.
   */
  _computeModelEndpointModel() {
    const { selected } = this;
    let { amf } = this;
    if (!amf) {
      this.endpoint = undefined;
      return;
    }
    if (Array.isArray(amf)) {
      [amf] = amf;
    }
    if (this._hasType(amf, this.ns.raml.vocabularies.apiContract.EndPoint)) {
      this.endpoint = amf;
      return;
    }
    const webApi = this._computeWebApi(amf);
    if (!webApi || !selected) {
      this.endpoint = undefined;
      return;
    }
    let model = this._computeEndpointModel(webApi, selected);
    if (model) {
      this.endpoint = model;
      return;
    }
    model = this._computeMethodModel(webApi, selected);
    if (!model) {
      this.endpoint = undefined;
      return;
    }
    const result = this._computeMethodEndpoint(webApi, model['@id']);
    this.endpoint = result;
  }

  _computeMethodAmf() {
    const { selected } = this;
    let { amf } = this;
    if (!amf || !selected) {
      this.operation = undefined;
      return;
    }
    if (Array.isArray(amf)) {
      [amf] = amf;
    }
    if (this._hasType(amf, this.ns.aml.vocabularies.document.Document)) {
      const webApi = this._computeWebApi(amf);
      const model = this._computeMethodModel(webApi, selected);
      this.operation = model;
      return;
    }
    const key = this._getAmfKey(this.ns.aml.vocabularies.apiContract.supportedOperation);
    const methods = this._ensureArray(amf[key]);
    if (!methods) {
      this.operation = undefined;
      return;
    }
    this.operation = methods.find((op) => op['@id'] === selected);
  }

  /**
   * Clears the cache in the view model transformer.
   */
  clearCache() {
    // @todo(Pawel): This should be a static property
    const gen = new ApiViewModel({ amf: this.amf });
    gen.clearCache();
  }
}
