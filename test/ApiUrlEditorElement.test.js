import { fixture, assert, nextFrame, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../api-url-editor.js';
import { UrlEventTypes } from '../index.js';

/** @typedef {import('../index').ApiUrlEditorElement} ApiUrlEditorElement */

describe('ApiUrlEditorElement', () => {
  /**
   * @return {Promise<ApiUrlEditorElement>}
   */
  async function basicFixture() {
    return (fixture(html`<api-url-editor></api-url-editor>`));
  }

  /**
   * @return {Promise<ApiUrlEditorElement>}
   */
  async function requiredFixture() {
    return (fixture(html`<api-url-editor required></api-url-editor>`));
  }

  /**
   * @return {Promise<ApiUrlEditorElement>}
   */
  async function eventsFixture() {
    return (fixture(html`<api-url-editor baseUri="https://domain.com" endpointPath="/{path}"></api-url-editor>`));
  }

  /**
   * @return {Promise<ApiUrlEditorElement>}
   */
  async function valueFixture() {
    return (fixture(html`<api-url-editor value="https://domain.com/api/path"></api-url-editor>`));
  }

  /**
   * @return {Promise<ApiUrlEditorElement>}
   */
  async function invalidFixture() {
    return (fixture(html`<api-url-editor value="https://domain.com/{path}" invalid></api-url-editor>`));
  }

  const BASE_URI = 'https://{base}.domain.com';

  describe('Basic computations', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    const TEST_PATH = '/test/{path}/value/{param}';
    beforeEach(async () => {
      element = await basicFixture();
      element.baseUri = BASE_URI;
      element.endpointPath = TEST_PATH;
      await nextFrame();
    });

    it('Computes _fullUrl', () => {
      assert.equal(element._fullUri, BASE_URI + TEST_PATH);
    });

    it('_urlParams is computed', () => {
      assert.typeOf(element._urlParams, 'array');
      assert.lengthOf(element._urlParams, 3);
    });

    it('_urlParams contains all path parameters', () => {
      assert.equal(element._urlParams[0], 'base');
      assert.equal(element._urlParams[1], 'path');
      assert.equal(element._urlParams[2], 'param');
    });

    it('_urlSearchRegexp is computed', () => {
      assert.ok(element._urlSearchRegexp);
    });
  });

  describe('Array values', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    let queryModel;
    const TEST_PATH = '/path/{var}';
    beforeEach(async () => {
      element = await basicFixture();
      element.baseUri = BASE_URI;
      element.endpointPath = TEST_PATH;
      queryModel = [{
        value: 'test',
        name: 'test',
        schema: {
          required: true,
        }
      }, {
        value: ['test'],
        name: 'arrayParameter',
        schema: {
          required: true,
        }
      }];
    });

    it('Produces URL with single array value', () => {
      element.queryModel = queryModel;
      const match = element.value.match(/&arrayParameter=/g);
      assert.equal(match.length, 1);
    });

    it('Element produces URL with array values', () => {
      queryModel[1].value.push('test2');
      element.queryModel = queryModel;
      const match = element.value.match(/&arrayParameter=/g);
      assert.equal(match.length, 2);
    });
  });

  describe('Boolean values in query parameters', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    let queryModel;
    const TEST_PATH = '/path/{var}';

    beforeEach(async () => {
      element = await basicFixture();
      element.baseUri = BASE_URI;
      element.endpointPath = TEST_PATH;
      queryModel = [
        {
          value: false,
          name: 'test1',
          schema: {
            required: true,
            inputType: 'boolean',
            isBool: true
          }
        },
        {
          value: true,
          name: 'test2',
          schema: {
            required: true,
            inputType: 'boolean',
            isBool: true
          }
        }
      ];
    });

    it('includes boolean false as a query parameter in the URL', () => {
      element.queryModel = queryModel;
      const match = element.value.match(/test1=false/g);
      assert.equal(match.length, 1, 'Boolean false should be included in the URL as "test1=false"');
    });

    it('includes boolean true as a query parameter in the URL', () => {
      element.queryModel = queryModel;
      const match = element.value.match(/&test2=true/g);
      assert.equal(match.length, 1, 'Boolean true should be included in the URL as "&test2=true"');
    });
  });

  describe('Dispatches events', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    let queryModel;
    const TEST_PATH = '/path/{var}';
    beforeEach(async () => {
      element = await basicFixture();
      element.baseUri = BASE_URI;
      element.endpointPath = TEST_PATH;
      queryModel = [{
        value: 'test',
        name: 'value',
        schema: {
          required: true,
        }
      }];
    });

    it(`dispatches the ${UrlEventTypes.urlValueChange} custom event`, () => {
      const spy = sinon.stub();
      element.addEventListener(UrlEventTypes.urlValueChange, spy);
      const { inputElement } = element;
      inputElement.value = BASE_URI;
      inputElement.dispatchEvent(new Event('input'));
      assert.isTrue(spy.calledOnce);
    });

    it(`dispatches ${UrlEventTypes.urlValueChange} event when query parameter change`, () => {
      const spy = sinon.stub();
      element.addEventListener(UrlEventTypes.urlValueChange, spy);
      element.queryModel = queryModel;
      assert.isTrue(spy.calledOnce);
    });

    it('Event contains declared properties', () => {
      const spy = sinon.stub();
      element.addEventListener(UrlEventTypes.urlValueChange, spy);
      element.queryModel = queryModel;
      const { detail } = spy.args[0][0];
      assert.equal(detail.value, 'https://{base}.domain.com/path/{var}?value=test');
    });
  });

  describe('event handlers', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    function fire(url) {
      document.body.dispatchEvent(new CustomEvent(UrlEventTypes.urlValueChange, {
        bubbles: true,
        detail: {
          value: url
        }
      }));
    }

    it('updates value from the event', () => {
      const url = 'https://domain.com/';
      fire(url);
      assert.equal(element.value, url);
    });

    it('does not re-dispatch the same event', () => {
      const url = 'https://domain.com/path';
      const spy = sinon.stub();
      element.addEventListener(UrlEventTypes.urlValueChange, spy);
      fire(url);
      assert.isFalse(spy.called);
    });
  });

  describe('URL templates', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    let pathModel;
    const TEST_PATH = '/path/{+var}';
    beforeEach(async () => {
      element = await basicFixture();
      element.baseUri = BASE_URI;
      element.endpointPath = TEST_PATH;
      pathModel = {
        value: '/test and extra!',
        name: '+var',
        schema: {
          required: true,
        },
      };
    });

    it('Processes URL template with plus sign', () => {
      const item = { ...pathModel};
      item.value = 'test';
      const model = [item];
      element.pathModel = model;
      assert.equal(element.value, 'https://{base}.domain.com/path/test');
    });

    it('Encodes special characters', () => {
      const item = { ...pathModel};
      item.value = 'test and extra';
      const model = [item];
      element.pathModel = model;
      assert.equal(element.value, 'https://{base}.domain.com/path/test%20and%20extra');
    });

    it('Does not encode reserved characters', () => {
      const item = { ...pathModel};
      item.value = '/test and extra!';
      const model = [item];
      element.pathModel = model;
      assert.equal(element.value, 'https://{base}.domain.com/path//test%20and%20extra!');
    });

    it('does not encode if noAutoEncode is enabled', () => {
      const item = { ...pathModel};
      item.schema.noAutoEncode = true;
      item.name = 'base';
      item.value = '/test and extra!';
      const model = [item];
      element.pathModel = model;
      assert.equal(element.value, 'https:///test and extra!.domain.com/path/{+var}');
    })
  });

  describe('_computeUrlParams()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns null when no argument', () => {
      const result = element._computeUrlParams(undefined);
      assert.equal(result, null);
    });

    it('Returns parameter names', () => {
      const result = element._computeUrlParams('/{paramA}/{paramB}');
      assert.deepEqual(result, ['paramA', 'paramB']);
    });

    it('Returns null when no parameters', () => {
      const result = element._computeUrlParams('/paramA/paramB');
      assert.equal(result, null);
    });
  });

  describe('_computeUrlRegexp()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns null when no argument', () => {
      const result = element._computeUrlRegexp(undefined);
      assert.equal(result, null);
    });

    it('Returns RegExp', () => {
      const result = element._computeUrlRegexp('https://domain.com/api');
      assert.typeOf(result, 'regexp');
    });

    it('escapes special characters', () => {
      const result = element._computeUrlRegexp('https://domain.com/api');
      assert.equal(result.source, 'https:\\/\\/domain\\.com\\/api.*');
    });

    it('Escapes variables', () => {
      const result = element._computeUrlRegexp('/{paramA}/paramB');
      assert.equal(result.source, '\\/([a-zA-Z0-9\\$\\-_\\.~\\+!\'\\(\\)\\*\\{\\}]+)\\/paramB.*');
    });
  });

  describe('_onElementBlur()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Calls validate()', () => {
      const spy = sinon.spy(element, 'validate');
      element._onElementBlur();
      assert.isTrue(spy.called);
    });
  });

  describe('_findModelIndex()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Returns -1 when no model', () => {
      const result = element._findModelIndex('query', 'test');
      assert.equal(result, -1);
    });

    it('Returns index in model', () => {
      element.queryModel = [{ name: 't1', value: '' }, { name: 't2', value: '' }];
      const result = element._findModelIndex('t2', 'query');
      assert.equal(result, 1);
    });

    it('Returns -1 when item do not exists', () => {
      element.queryModel = [{ name: 't1', value: '' }, { name: 't2', value: '' }];
      const result = element._findModelIndex('t3', 'query');
      assert.equal(result, -1);
    });
  });

  describe('_applyQueryParamsValues()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Does nothing when no argument', () => {
      element._applyQueryParamsValues();
      assert.isUndefined(element.queryModel);
    });

    it('Updates query model values', () => {
      element.queryModel = [{ name: 't1', value: '' }, { name: 't2', value: '' }];
      element._applyQueryParamsValues({
        t1: 'test1',
        t2: 'test2'
      });
      assert.equal(element.queryModel[0].value, 'test1');
      assert.equal(element.queryModel[1].value, 'test2');
    });

    it('updates value when updating the model', () => {
      element.queryModel = [{ name: 't1', value: '' }, { name: 't2', value: '' }];
      const spy = sinon.spy(element, '_computeValue');
      element._applyQueryParamsValues({
        t1: 'test1',
        t2: 'test2'
      });
      assert.isTrue(spy.called);
    });

    it('ignores value update when parameters did not change', () => {
      element.queryModel = [{ name: 't1', value: 'test1' }, { name: 't2', value: 'test2' }];
      const spy = sinon.spy(element, '_computeValue');
      element._applyQueryParamsValues({
        t1: 'test1',
        t2: 'test2'
      });
      assert.isFalse(spy.called);
    });

    it('Ignores non-existing items', () => {
      element.queryModel = [{ name: 't1', value: undefined }, { name: 't2', value: undefined }];
      element._applyQueryParamsValues({
        t0: 'test1',
        t2: 'test2'
      });
      assert.isUndefined(element.queryModel[0].value);
      assert.equal(element.queryModel[1].value, 'test2');
    });
  });

  describe('_applyUriValues()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Does nothing when empty arguments ', () => {
      element._applyUriValues([], []);
      assert.isUndefined(element.pathModel);
    });

    it('Updates query model values', () => {
      element.pathModel = [{ name: 't1', value: '' }, { name: 't2', value: '' }];
      element._applyUriValues(['test1', 'test2'], ['t1', 't2']);
      assert.equal(element.pathModel[0].value, 'test1');
      assert.equal(element.pathModel[1].value, 'test2');
    });

    it('Ignores non-existing items', () => {
      element.pathModel = [{ name: 't1', value: undefined }, { name: 't2', value: undefined }];
      element._applyUriValues(['test1', 'test2'], ['t0', 't2']);
      assert.isUndefined(element.pathModel[0].value);
      assert.equal(element.pathModel[1].value, 'test2');
    });
  });

  describe('_applyQueryParamToObject()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Does nothing when no param argument', () => {
      const obj = /** @type Record<string, string|string[]> */ ({});
      element._applyQueryParamToObject(undefined, obj);
      assert.lengthOf(Object.keys(obj), 0);
    });

    it('Does nothing when no obj argument', () => {
      element._applyQueryParamToObject('a=b', undefined);
      // for test coverage, also, no error
    });

    it('Does nothing when no param is not a string', () => {
      const obj = /** @type Record<string, string|string[]> */ ({});
      // @ts-ignore
      element._applyQueryParamToObject(false, obj);
      assert.lengthOf(Object.keys(obj), 0);
    });

    it('Adds parameter to the object', () => {
      const obj = /** @type Record<string, string|string[]> */ ({});
      element._applyQueryParamToObject('a=b', obj);
      assert.lengthOf(Object.keys(obj), 1);
      assert.equal(obj.a, 'b');
    });

    it('Creates array value', () => {
      const obj = /** @type Record<string, string|string[]> */ ({
        a: 'b'
      });
      element._applyQueryParamToObject('a=c', obj);
      assert.deepEqual(obj.a, ['b', 'c']);
    });

    it('Appends to existing array', () => {
      const obj = {
        a: ['b', 'd']
      };
      element._applyQueryParamToObject('a=c', obj);
      assert.deepEqual(obj.a, ['b', 'd', 'c']);
    });
  });

  describe('_computeFullUrl()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('return default string', () => {
      const result = element._computeFullUrl(undefined, undefined);
      assert.equal(result, '/');
    });

    it('Adds slash to the beginning', () => {
      const result = element._computeFullUrl(null, 'test');
      assert.equal(result, '/test');
    });

    it('Creates full URL', () => {
      const result = element._computeFullUrl('https://domain.com', 'test');
      assert.equal(result, 'https://domain.com/test');
    });

    it('Removed trailing slash', () => {
      const result = element._computeFullUrl('https://domain.com/', 'test');
      assert.equal(result, 'https://domain.com/test');
    });
  });

  describe('_getValidity()', () => {
    describe('Not required field', () => {
      let input;
      beforeEach(async () => {
        input = await basicFixture();
      });

      it('Valid when not required end empty value', () => {
        input.value = '';
        const result = input._getValidity();
        assert.isTrue(result);
      });

      it('Valid when value is undefined', () => {
        input.value = undefined;
        const result = input._getValidity();
        assert.isTrue(result);
      });

      it('Invalid for variables', () => {
        input.value = '{test}';
        const result = input._getValidity();
        assert.isFalse(result);
      });

      // Demo page marks this as invalid, test doesn't
      // not sure why is that...
      it('Invalid for invalid URL value', async () => {
        input.value = 'some value not URL';
        await nextFrame();
        const result = input._getValidity();
        assert.isFalse(result);
      });
    });

    describe('Required field', () => {
      let input;
      beforeEach(async () => {
        input = await requiredFixture();
      });

      it('Invalid when empty value', async () => {
        input.value = '';
        await nextFrame();
        const result = input._getValidity();
        assert.isFalse(result);
      });

      it('Valid when value is undefined', () => {
        input.value = undefined;
        const result = input._getValidity();
        assert.isTrue(result);
      });
    });
  });

  describe('Auto validation', () => {
    let input;
    beforeEach(async () => {
      input = await basicFixture();
    });

    it('Valid for valid value', async () => {
      input.value = 'https://domain.com?a=b&param=value#1232344';
      await nextFrame();
      assert.isFalse(input.invalid);
    });

    it('Invalid for variables', async () => {
      input.value = 'https://domain.com?{a}=b&param=value#1232344';
      await nextFrame();
      assert.isTrue(input.invalid);
    });

    // Demo page marks this as invalid, test doesn't
    // not sure why is that...
    it.skip('Invalid when changing value back to empty string', async () => {
      input.value = 'https://domain.com';
      await nextFrame();
      assert.isFalse(input.invalid, 'initially valid');
      input.value = '';
      await nextFrame();
      assert.isTrue(input.invalid, 'invalid after the change');
    });

    it.skip('Invalid for invalid URL value', async () => {
      input.value = 'some value not URL';
      await nextFrame();
      assert.isTrue(input.invalid);
    });
  });

  describe('Validation with query events', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    const invalidUrl = 'https://domain.com/{path}/?{param}=value';
    const uriModel = {
      name: 'path',
      value: '',
      schema: {
        apiType: 'string',
        required: true,
      },
    };
    const queryModel = {
      name: 'param',
      value: '',
      schema: {
        description: '',
        required: true,
        apiType: 'string',
      },
    };

    beforeEach(async () => {
      element = await eventsFixture();
      element.queryModel = [{ ...queryModel}];
      element.pathModel = [{ ...uriModel}];
      element.value = invalidUrl;
    });

    it('Invalid by default', () => {
      const valid = element.validate();
      assert.isFalse(valid);
    });

    it('Valid after uri param update', async () => {
      element.pathModel[0].value = 'test';
      element.pathModel = [...element.pathModel];
      const valid = element.validate();
      assert.isTrue(valid);
    });
  });

  describe('onchange', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Getter returns previously registered handler', () => {
      assert.isUndefined(element.onchange);
      const f = () => {};
      element.onchange = f;
      assert.isTrue(element.onchange === f);
    });

    it('Calls registered function', () => {
      let called = false;
      const f = () => {
        called = true;
      };
      element.onchange = f;
      element._notifyChange();
      element.onchange = null;
      assert.isTrue(called);
    });

    it('Unregisteres old function', () => {
      let called1 = false;
      let called2 = false;
      const f1 = () => {
        called1 = true;
      };
      const f2 = () => {
        called2 = true;
      };
      element.onchange = f1;
      element.onchange = f2;
      element._notifyChange();
      element.onchange = null;
      assert.isFalse(called1);
      assert.isTrue(called2);
    });
  });

  describe('updating uri model', () => {
    const base = 'https://{host}:{port}/{version}';
    const endpoint = '/api/path/{+id}?a=b';
    let pathModel;
    let element = /** @type ApiUrlEditorElement */ (null);
    let target;
    beforeEach(async () => {
      element = await basicFixture();
      pathModel = [{
        name: 'host',
        value: '',
        schema: {
          required: true,
          apiType: 'string',
        },
      }, {
        name: 'port',
        value: '',
        schema: {
          required: true,
          apiType: 'number',
        },
      }, {
        name: 'version',
        value: '',
        schema: {
          required: true,
          apiType: 'string',
        },
      }, {
        name: '+id',
        value: '',
        schema: {
          required: true,
          apiType: 'string',
        },
      }];
      element.pathModel = pathModel;
      element.baseUri = base;
      element.endpointPath = endpoint;
      element.value = base + endpoint;
      await nextFrame();
      target = element.inputElement;
    });

    it('updates value for host part', async () => {
      const url = base.replace('{host}', 'api');
      target.value = url + endpoint;
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(pathModel[0].value, 'api');
      assert.equal(pathModel[1].value, '');
      assert.equal(pathModel[2].value, '');
      assert.equal(pathModel[3].value, '');
    });

    it('updates value for port part', async () => {
      const url = base.replace('{port}', '8080');
      target.value = url + endpoint;
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(pathModel[1].value, '8080');
      assert.equal(pathModel[2].value, '');
      assert.equal(pathModel[3].value, '');
    });

    it('updates value for version part', async () => {
      const url = base.replace('{version}', 'v1');
      target.value = url + endpoint;
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(pathModel[2].value, 'v1');
      assert.equal(pathModel[3].value, '');
    });

    it('updates value for +id part', async () => {
      const url = endpoint.replace('{+id}', '1234567');
      target.value = base + url;
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(pathModel[3].value, '1234567');
    });

    it('replaces path model with equal items', () => {
      const url = base.replace('{host}', 'api');
      target.value = url + endpoint;
      target.dispatchEvent(new CustomEvent('input'));
      assert.isFalse(pathModel === element.pathModel);
      assert.deepEqual(pathModel, element.pathModel);
    });

    it('ignores model change when no new parameters', () => {
      target.dispatchEvent(new CustomEvent('input'));
      assert.isTrue(pathModel === element.pathModel);
    });

    it('ignores model change when value is the same', () => {
      element.pathModel[0].value = 'api';
      const url = base.replace('{host}', 'api');
      target.value = url + endpoint;
      target.dispatchEvent(new CustomEvent('input'));
      assert.isTrue(pathModel === element.pathModel);
    });
  });

  describe('updating query model', () => {
    const base = 'https://api.domain.com';
    const endpoint = '/api?page=&limit=';
    let queryModel;
    let element = /** @type ApiUrlEditorElement */ (null);
    let target;
    beforeEach(async () => {
      element = await basicFixture();
      queryModel = [{
        name: 'page',
        value: '',
        schema: {
          required: true,
          apiType: 'number',
        },
      }, {
        name: 'limit',
        value: '',
        schema: {
          required: true,
          apiType: 'number',
        },
      }];
      element.queryModel = queryModel;
      element.baseUri = base;
      element.endpointPath = endpoint;
      element.value = base + endpoint;
      await nextFrame();
      target = element.inputElement;
    });

    it('updates value for page part', async () => {
      target.value = `${base}/api?page=12&limit`;
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(queryModel[0].value, '12');
      assert.equal(queryModel[1].value, '');
    });

    it('updates value for limit part', async () => {
      target.value = `${base}/api?page=&limit=100`;
      target.dispatchEvent(new CustomEvent('input'));
      assert.equal(queryModel[0].value, '');
      assert.equal(queryModel[1].value, '100');
    });

    it('replaces path model with equal items', () => {
      target.value = `${base}/api?page=12&limit`;
      target.dispatchEvent(new CustomEvent('input'));
      // assert.isFalse(queryModel === element.queryModel);
      assert.deepEqual(queryModel, element.queryModel);
    });

    it('ignores model change when no new parameters', () => {
      target.dispatchEvent(new CustomEvent('input'));
      assert.isTrue(queryModel === element.queryModel);
    });
  });

  describe('_wwwFormUrlEncodePiece()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('returns empty string when no input', () => {
      const result = element._wwwFormUrlEncodePiece(undefined, false);
      assert.equal(result, '');
    });

    it('normalizes spaces to %20', () => {
      const result = element._wwwFormUrlEncodePiece('test value', false);
      assert.equal(result, 'test%20value');
    });

    it('normalizes spaces to + with replacePlus', () => {
      const result = element._wwwFormUrlEncodePiece('test value', true);
      assert.equal(result, 'test+value');
    });

    it('returns string containing 0 value', () => {
      const result = element._wwwFormUrlEncodePiece(0, true);
      assert.equal(result, '0');
    });
  });

  describe('_wwwFormUrlEncode()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('returns empty string when no input', () => {
      const result = element._wwwFormUrlEncode(undefined);
      assert.equal(result, '');
    });

    it('returns normalized query string values', () => {
      const params = [{
        name: 'test key',
        value: 'test value'
      }];
      const result = element._wwwFormUrlEncode(params);
      assert.equal(result, 'test+key=test+value');
    });

    it('concatenates params', () => {
      const params = [{
        name: 'test key',
        value: 'test value'
      }, {
        name: 'a',
        value: 'b c'
      }];
      const result = element._wwwFormUrlEncode(params);
      assert.equal(result, 'test+key=test+value&a=b+c');
    });
  });

  describe('a11y', () => {
    it('is accessible without a value', async () => {
      const element = await basicFixture();
      await assert.isAccessible(element);
    });

    it('is accessible with a value', async () => {
      const element = await valueFixture();
      await assert.isAccessible(element);
    });

    it('is accessible when invalid', async () => {
      const element = await invalidFixture();
      await assert.isAccessible(element);
    });
  });

  describe('_applyUriParams()', () => {
    let element = /** @type ApiUrlEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('Does nothing when empty model ', () => {
      const url = element._applyUriParams("/flights/{id}", undefined);
      assert.equal(url, '/flights/{id}');
    });

    it('Replaces template with empty value ', () => {
      const schema = {required: true, isFile: false, isUnion: false, readOnly: false, apiType: 'string'}
      const model = [{enabled: true, name: "id", schema, value: ''}]
      const url = element._applyUriParams("/flights/{id}", model);
      assert.equal(url, '/flights/');
    });
  });


});
