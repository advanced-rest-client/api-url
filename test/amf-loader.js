import { AmfHelperMixin } from '@api-components/amf-helper-mixin/amf-helper-mixin.js';
import { LitElement } from 'lit-element';

export const AmfLoader = {};

class HelperElement extends AmfHelperMixin(LitElement) {}
window.customElements.define('helper-element', HelperElement);

const helper = new HelperElement();

AmfLoader.load = async (compact=false, fileName='demo-api') => {
  const suffix = compact ? '-compact' : '';
  const file = `${fileName}${suffix}.json`;
  const url = `${window.location.protocol}//${window.location.host}/demo/${file}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Unable to download API data model');
  }
  return response.json();
};

AmfLoader.lookupServers = (model, endpointId, methodId) => {
  helper.amf = model;
  return helper._getServers({ endpointId, methodId });
};

AmfLoader.lookupEndpoint = (model, endpoint) => {
  helper.amf = model;
  const webApi = helper._computeWebApi(model);
  return helper._computeEndpointByPath(webApi, endpoint);
};

AmfLoader.lookupOperation = (model, endpoint, operation) => {
  const endPoint = AmfLoader.lookupEndpoint(model, endpoint);
  const opKey = helper._getAmfKey(helper.ns.aml.vocabularies.apiContract.supportedOperation);
  const ops = helper._ensureArray(endPoint[opKey]);
  return ops.find((item) => helper._getValue(item, helper.ns.aml.vocabularies.apiContract.method) === operation);
};
