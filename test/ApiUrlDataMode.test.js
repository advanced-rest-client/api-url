/* eslint-disable prefer-destructuring */
import { assert } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import { ApiUrlDataModel } from '../index.js';

describe('ApiUrlDataModel', () => {
  [
    ['Full data model', false],
    ['Compact data model', true]
  ].forEach(([label, compact]) => {
    describe(`${label}`, () => {
      const API_HOST = 'http://api.{instance}.domain.com:8254/v1';

      describe('Base computations', () => {
        let instance = /** @type ApiUrlDataModel */ (null);
        let amf;
        let endpointId;
        let methodId;
        let server;

        before(async () => {
          amf = await AmfLoader.load(/** @type boolean */(compact));
        });

        beforeEach(async () => {
          const endpoint = AmfLoader.lookupEndpoint(amf, '/test-parameters/{feature}');
          endpointId = endpoint['@id'];
          const method = AmfLoader.lookupOperation(amf, '/test-parameters/{feature}', 'get');
          methodId = method['@id'];
          [server] = AmfLoader.lookupServers(amf, endpointId, methodId);
          instance = new ApiUrlDataModel(amf);
          instance.server = server;
        });

        it('Computes apiBaseUri', () => {
          const result = instance.getModel();
          assert.equal(result.apiBaseUri, API_HOST);
        });

        it('Computes api uri parameters', () => {
          const result = instance.getModel();
          assert.typeOf(result.apiParameters, 'array');
          assert.lengthOf(result.apiParameters, 1);
        });

        it('server is computed', () => {
          const key = instance._getAmfKey(instance.ns.aml.vocabularies.apiContract.Server);
          assert.typeOf(instance.server, 'object');
          assert.equal(instance.server['@type'][0], key);
        });

        it('protocols is computed', () => {
          assert.typeOf(instance.protocols, 'array');
          assert.deepEqual(instance.protocols, ['HTTP', 'HTTPS']);
        });

        it('version is computed', () => {
          assert.equal(instance.version, 'v1');
        });

        it('queryModel is empty', () => {
          const result = instance.getModel();
          assert.deepEqual(result.queryModel, []);
        });

        it('pathModel is empty', () => {
          const result = instance.getModel();
          assert.deepEqual(result.pathModel, []);
        });

        it('endpointUri is computed', () => {
          const result = instance.getModel();
          assert.equal(result.endpointUri, API_HOST);
        });

        it('endpointPath is undefined', () => {
          const result = instance.getModel();
          assert.isUndefined(result.endpointPath);
        });

        it('endpoint is undefined', () => {
          assert.isUndefined(instance.endpoint);
        });

        it('method is undefined', () => {
          assert.isUndefined(instance.operation);
        });
      });

      describe('#apiUri', () => {
        let instance = /** @type ApiUrlDataModel */ (null);
        let amf;
        let endpointId;
        let methodId;
        const apiUri = 'https://other.domain.com/endpoint';

        before(async () => {
          amf = await AmfLoader.load(/** @type boolean */(compact));
        });

        beforeEach(async () => {
          instance = new ApiUrlDataModel(amf);
          instance.apiUri = 'https://test.domain.com/api/';
          const webApi = instance._computeWebApi(amf);
          const endpoint = instance._computeEndpointByPath(webApi, '/test-parameters/{feature}');
          endpointId = endpoint['@id'];
          const method = instance._computeOperations(webApi, endpointId)[0];
          methodId = method['@id'];
          instance.selected = methodId;
        });

        it('computes apiBaseUri', () => {
          const result = instance.getModel();
          assert.equal(result.apiBaseUri, 'https://test.domain.com/api');
        });

        it('computes endpointUri', () => {
          const result = instance.getModel();
          assert.equal(result.endpointUri, 'https://test.domain.com/api/test-parameters/{feature}');
        });

        it('changes apiBaseUri when apiUri property change', () => {
          instance.apiUri = apiUri;
          const result = instance.getModel();
          assert.equal(result.apiBaseUri, apiUri);
        });

        it('changes endpointUri when apiUri property change', () => {
          instance.apiUri = apiUri;
          const result = instance.getModel();
          assert.equal(result.endpointUri, 'https://other.domain.com/endpoint/test-parameters/{feature}');
        });

        it('renders element with attributes values', async () => {
          instance = new ApiUrlDataModel(amf);
          instance.apiUri = apiUri;
          instance.selected = methodId;

          const result = instance.getModel();
          assert.equal(result.apiBaseUri, apiUri);
          assert.equal(result.endpointUri, 'https://other.domain.com/endpoint/test-parameters/{feature}');
        });
      });

      describe('Endpoint only computations', () => {
        let instance = /** @type ApiUrlDataModel */ (null);
        let amf;
        let server

        before(async () => {
          amf = await AmfLoader.load(/** @type boolean */(compact));
        });

        let endpointId;
        beforeEach(async () => {
          const endpoint = AmfLoader.lookupEndpoint(amf, '/test-parameters/{feature}');
          endpointId = endpoint['@id'];
          [server] = AmfLoader.lookupServers(amf, endpointId);
          instance = new ApiUrlDataModel(amf);
          instance.server = server;
        });

        it('Computes endpointUri for an endpoint', () => {
          instance.selected = endpointId;
          const info = instance.getModel();
          assert.equal(info.endpointUri, `${API_HOST  }/test-parameters/{feature}`);
        });

        it('Computes endpointPath for an endpoint', () => {
          instance.selected = endpointId;
          const info = instance.getModel();
          assert.equal(info.endpointPath, '/test-parameters/{feature}');
        });

        it('Computes pathModel', () => {
          instance.selected = endpointId;
          const info = instance.getModel();
          const result = info.pathModel;
          assert.typeOf(result, 'array', 'pathModel is an array');
        });

        it('pathModel contains base api uri parameters', () => {
          instance.selected = endpointId;
          const info = instance.getModel();
          const result = info.pathModel;
          assert.deepEqual(result[0], info.apiParameters[0]);
        });

        it('pathModel contains endpoint uri parameters', () => {
          instance.selected = endpointId;
          const info = instance.getModel();
          const result = info.pathModel;
          assert.equal(result[1].name, 'feature');
        });

        it('method is undefined', () => {
          instance.selected = endpointId;
          assert.isUndefined(instance.operation);
        });

        it('queryModel is empty', () => {
          instance.selected = endpointId;
          const info = instance.getModel();
          assert.deepEqual(info.queryModel, []);
        });
      });

      describe('Method computations', () => {
        let instance = /** @type ApiUrlDataModel */ (null);
        let amf;
        let server;

        before(async () => {
          amf = await AmfLoader.load(/** @type boolean */(compact));
        });

        let endpointId;
        let methodId;
        beforeEach(async () => {
          const endpoint = AmfLoader.lookupEndpoint(amf, '/test-parameters/{feature}');
          endpointId = endpoint['@id'];
          const method = AmfLoader.lookupOperation(amf, '/test-parameters/{feature}', 'get');
          methodId = method['@id'];
          [server] = AmfLoader.lookupServers(amf, endpointId, methodId);
          instance = new ApiUrlDataModel(amf);
          instance.server = server;
        });

        it('Computes endpointUri for an endpoint', () => {
          instance.selected = methodId;
          const info = instance.getModel();
          assert.equal(info.endpointUri, `${API_HOST  }/test-parameters/{feature}`);
        });

        it('Computes endpointPath for an endpoint', () => {
          instance.selected = methodId;
          const info = instance.getModel();
          assert.equal(info.endpointPath, '/test-parameters/{feature}');
        });

        it('Computes pathModel', () => {
          instance.selected = methodId;
          const info = instance.getModel();
          const result = info.pathModel;
          assert.typeOf(result, 'array', 'result is an array');
          assert.lengthOf(result, 2, 'result has 2 items');
          assert.equal(result[1].name, 'feature');
        });

        it('Computes queryModel', () => {
          instance.selected = methodId;
          const info = instance.getModel();
          const result = info.queryModel;
          assert.typeOf(result, 'array', 'result is an array');
          assert.lengthOf(result, 3, 'result has 3 items');
        });

        it('method is computed', () => {
          const key = instance._getAmfKey(instance.ns.aml.vocabularies.apiContract.Operation);
          instance.selected = methodId;
          instance.getModel();
          assert.typeOf(instance.operation, 'object');
          assert.equal(instance.operation['@type'][0], key);
        });

        it('pathModel is set when promise resolves', () => {
          instance.selected = methodId;
          const info = instance.getModel();
          assert.typeOf(info.pathModel, 'array');
          assert.lengthOf(info.pathModel, 2);
        });
      });

      describe('_computeQueryModel()', () => {
        let method;
        let instance = /** @type ApiUrlDataModel */ (null);
        let amf;

        before(async () => {
          amf = await AmfLoader.load(/** @type boolean */(compact));
        });

        beforeEach(async () => {
          instance = new ApiUrlDataModel(amf);
          const webApi = instance._computeWebApi(amf);
          const endpoint = instance._computeEndpointByPath(webApi, '/test-parameters/{feature}');
          const endpointId = endpoint['@id'];
          [method] = instance._computeOperations(webApi, endpointId);
        });

        it('Returns empty array when no model', () => {
          const result = instance._computeQueryModel();
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 0);
        });

        it('Returns empty array when invalid model', () => {
          const result = instance._computeQueryModel({});
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 0);
        });

        it('Returns query parameters model', () => {
          const result = instance._computeQueryModel(method);
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 3);
        });
      });
    });
  });

  [
    ['full data model', false, 'petstore'],
    ['compact data model', true, 'petstore']
  ].forEach(([label, compact, file]) => {
    describe(`OAS ${label}`, () => {
      describe('Base computations', () => {
        let instance = /** @type ApiUrlDataModel */ (null);
        let amf;
        let endpointId;
        let methodId;
        let server;

        before(async () => {
          amf = await AmfLoader.load(/** @type boolean */(compact), /** @type string */(file));
        });

        beforeEach(async () => {
          const endpoint = AmfLoader.lookupEndpoint(amf, '/pets/{id}');
          endpointId = endpoint['@id'];
          const method = AmfLoader.lookupOperation(amf, '/pets/{id}', 'get');
          methodId = method['@id'];
          [server] = AmfLoader.lookupServers(amf, endpointId, methodId);
          instance = new ApiUrlDataModel(amf);
          instance.server = server;
        });

        it('Computes apiBaseUri', () => {
          const info = instance.getModel();
          assert.equal(info.apiBaseUri,
            'https://qax.anypoint.mulesoft.com/mocking/api/v1/links/784699fb-6f73-474f-8c7a-96d2384539e7/api');
        });

        it('Computes api uri parameters', () => {
          const info = instance.getModel();
          const result = info.apiParameters;
          assert.typeOf(result, 'array');
          assert.lengthOf(result, 0);
        });

        it('server is computed', () => {
          const key = instance._getAmfKey(instance.ns.aml.vocabularies.apiContract.Server);
          assert.typeOf(instance.server, 'object');
          assert.equal(instance.server['@type'][0], key);
        });

        it('protocols is computed', () => {
          assert.typeOf(instance.protocols, 'array');
          assert.deepEqual(instance.protocols, ['http']);
        });

        it('version is computed', () => {
          assert.equal(instance.version, '4.1.0');
        });

        it('queryModel is undefined', () => {
          const info = instance.getModel();
          assert.deepEqual(info.queryModel, []);
        });

        it('pathModel is undefined', () => {
          const info = instance.getModel();
          assert.deepEqual(info.pathModel, []);
        });

        it('endpointUri is computed', () => {
          const info = instance.getModel();
          assert.equal(info.endpointUri,
            'https://qax.anypoint.mulesoft.com/mocking/api/v1/links/784699fb-6f73-474f-8c7a-96d2384539e7/api');
        });

        it('endpointPath is undefined', () => {
          const info = instance.getModel();
          assert.isUndefined(info.endpointPath);
        });

        it('endpoint is undefined', () => {
          assert.isUndefined(instance.endpoint);
        });

        it('method is undefined', () => {
          assert.isUndefined(instance.operation);
        });
      });

      describe('URI parameters computation', () => {
        let instance = /** @type ApiUrlDataModel */ (null);
        let amf;

        before(async () => {
          amf = await AmfLoader.load(/** @type boolean */(compact), /** @type string */(file));
        });

        let webApi;
        beforeEach(async () => {
          instance = new ApiUrlDataModel(amf);
          webApi = instance._computeWebApi(amf);
        });

        it('pathModel is empty for an endpoint', () => {
          const endpoint = instance._computeEndpointByPath(webApi, '/pets/{id}');
          instance.selected = endpoint['@id'];
          const info = instance.getModel();
          const result = info.pathModel;
          assert.typeOf(result, 'array', 'pathModel is an array');
          assert.lengthOf(result, 0, 'pathModel has no elements');
        });

        it('pathModel is set for a method', () => {
          const endpoint = instance._computeEndpointByPath(webApi, '/pets/{id}');
          const method = instance._computeOperations(webApi, endpoint['@id'])[0];
          instance.selected = method['@id'];
          const info = instance.getModel();
          const result = info.pathModel;
          assert.typeOf(result, 'array', 'pathModel is an array');
          assert.lengthOf(result, 1, 'pathModel has 1 element');
        });

        it('pathModel is empty when no parameters', () => {
          const endpoint = instance._computeEndpointByPath(webApi, '/pets');
          const method = instance._computeOperations(webApi, endpoint['@id'])[0];
          instance.selected = method['@id'];
          const info = instance.getModel();
          const result = info.pathModel;
          assert.typeOf(result, 'array', 'pathModel is an array');
          assert.lengthOf(result, 0, 'pathModel has no elements');
        });
      });

      describe('_uriParamsFromMethod()', () => {
        let instance = /** @type ApiUrlDataModel */ (null);
        let amf;
        before(async () => {
          amf = await AmfLoader.load(/** @type boolean */(compact), /** @type string */(file));
        });

        let webApi;
        beforeEach(async () => {
          instance = new ApiUrlDataModel(amf);  
          webApi = instance._computeWebApi(amf);
        });

        it('Returns undefined when no argument', () => {
          const result = instance._uriParamsFromMethod();
          assert.isUndefined(result);
        });

        it('Returns undefined when no request model', () => {
          const result = instance._uriParamsFromMethod({});
          assert.isUndefined(result);
        });

        it('Returns undefined when method has no parameters', () => {
          const endpoint = instance._computeEndpointByPath(webApi, '/pets');
          const method = instance._computeOperations(webApi, endpoint['@id'])[0];
          const result = instance._uriParamsFromMethod(method);
          assert.isUndefined(result);
        });

        it('Computes parameters for a method', () => {
          const endpoint = instance._computeEndpointByPath(webApi, '/pets/{id}');
          const method = instance._computeOperations(webApi, endpoint['@id'])[0];
          const result = instance._uriParamsFromMethod(method);
          assert.typeOf(result, 'array');
        });
      });
    });
  });

  describe('Partial model', () => {
    let instance = /** @type ApiUrlDataModel */ (null);
    let amf;

    before(async () => {
      amf = await AmfLoader.load(false, 'partial-model/endpoint');
    });

    beforeEach(async () => {
      instance = new ApiUrlDataModel(amf);
      instance.selected = '#69';
    });

    it('server is undefined', () => {
      assert.isUndefined(instance.server);
    });

    it('server can be set', async () => {
      const summary = await AmfLoader.load(false, 'partial-model/summary');
      instance.server = instance._computeServer(summary);
      const info = instance.getModel();
      assert.typeOf(info.queryModel, 'array');
      assert.lengthOf(info.queryModel, 7);
    });

    it('apiBaseUri is computed from server property', async () => {
      const summary = await AmfLoader.load(false, 'partial-model/summary');
      instance.amf = summary;
      instance.server = instance._computeServer(summary);
      const info = instance.getModel();
      assert.equal(info.apiBaseUri, 'http://petstore.swagger.io/v2');
    });

    it('endpointUri is computed from server property', async () => {
      const summary = await AmfLoader.load(false, 'partial-model/summary');
      instance.server = instance._computeServer(summary);
      const info = instance.getModel();
      assert.equal(info.endpointUri, 'http://petstore.swagger.io/v2/api/user');
    });
  });

  describe('multi server', () => {
    let amf;
    let endpointId;
    let methodId;
    let servers;

    before(async () => {
      amf = await AmfLoader.load(true, 'multi-server');
    });

    beforeEach(async () => {
      const endpoint = AmfLoader.lookupEndpoint(amf, '/default');
      endpointId = endpoint['@id'];
      const method = AmfLoader.lookupOperation(amf, '/default', 'get');
      methodId = method['@id'];
      servers = AmfLoader.lookupServers(amf, endpointId, methodId);
    });

    it('computes values for a server', async () => {
      const instance = new ApiUrlDataModel(amf);
      [instance.server] = servers;
      instance.selected = methodId;

      const info = instance.getModel();
      assert.equal(info.endpointUri, 'https://{customerId}.saas-app.com:{port}/v2/default');
      assert.lengthOf(info.apiParameters, 2, 'has 2 api parameters');
      assert.lengthOf(info.pathModel, 2, 'has 2 path parameters');
      assert.lengthOf(info.queryModel, 1, 'has a single parameters');
    });

    it('changes a server', async () => {
      const instance = new ApiUrlDataModel(amf);
      [instance.server] = servers;
      instance.selected = methodId;
      instance.getModel();
      instance.server = servers[1];
      
      const info = instance.getModel();
      assert.equal(info.endpointUri, 'https://{region}.api.cognitive.microsoft.com/default');
      assert.lengthOf(info.apiParameters, 1, 'has 1 api parameter');
      assert.lengthOf(info.pathModel, 1, 'has 1 path parameter');
      assert.lengthOf(info.queryModel, 1, 'has a single parameters');
    });
  });

  describe('clearCache()', () => {
    let instance = /** @type ApiUrlDataModel */ (null);
    let amf;
    let endpointId;
    let methodId;

    before(async () => {
      amf = await AmfLoader.load();
    });

    beforeEach(async () => {
      instance = new ApiUrlDataModel(amf);
      const webApi = instance._computeWebApi(amf);
      const endpoint = instance._computeEndpointByPath(webApi, '/people');
      endpointId = endpoint['@id'];
      const [method] = instance._computeOperations(webApi, endpointId);
      methodId = method['@id'];
    });

    it('respects cached values', () => {
      instance.selected = methodId;

      const info = instance.getModel();
      const result = info.queryModel;
      const value = 'test-value';
      result[0].value = value;
      instance.selected = null;
      instance.selected = methodId;
      assert.equal(instance.getModel().queryModel[0].value, value);
    });

    it('clears the cache', () => {
      instance.selected = methodId;

      const info = instance.getModel();
      const result = info.queryModel;
      const value = 'test-value';
      result[0].value = value;
      instance.clearCache();
      instance.selected = null;
      instance.selected = methodId;
      assert.isUndefined(instance.getModel().queryModel[0].value);
    });
  });
});
