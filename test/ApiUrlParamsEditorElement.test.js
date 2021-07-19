import { assert, aTimeout, fixture, html, nextFrame } from '@open-wc/testing'
import sinon from 'sinon'
import '../api-url-params-editor.js'

/** @typedef {import('../index').ApiUrlParamsEditorElement} ApiUrlParamsEditorElement */
/** @typedef {import('@api-components/api-forms').ApiFormItemElement} ApiFormItem */

describe('ApiUrlParamsEditorElement', () => {
  /**
   * @return {Promise<ApiUrlParamsEditorElement>} 
   */
  async function basicFixture() {
    return fixture(html `
      <api-url-params-editor></api-url-params-editor>
    `);
  }

  /**
   * @return {Promise<ApiUrlParamsEditorElement>} 
   */
  async function customFixture() {
    return fixture(html`<api-url-params-editor allowCustom></api-url-params-editor>`);
  }

  /**
   * @return {Promise<ApiUrlParamsEditorElement>} 
   */
  async function emptyFixture() {
    return fixture(html`<api-url-params-editor emptyMessage></api-url-params-editor>`);
  }

  /**
   * @return {Promise<ApiUrlParamsEditorElement>} 
   */
   async function disableParamsFixture() {
    return fixture(html`<api-url-params-editor allowDisableParams></api-url-params-editor>`);
  }

  /**
   * @return {Promise<ApiUrlParamsEditorElement>} 
   */
   async function hideOptionalFixture() {
    return fixture(html`<api-url-params-editor allowHideOptional></api-url-params-editor>`);
  }

  describe('#hasQueryParameters', () => {
    let element = /** @type ApiUrlParamsEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('is true when has the model', () => {
      const model = [{ name: 'x', value: '', schema: {} }];
      element.queryModel = model;
      assert.isTrue(element.hasQueryParameters);
    });
    
    it('is true when allowCustom is set', () => {
      element.allowCustom = true;
      assert.isTrue(element.hasQueryParameters);
    });

    it('is false when empty model', () => {
      element.queryModel = [];
      assert.isFalse(element.hasQueryParameters);
    });

    it('is false when no model', () => {
      element.queryModel = undefined;
      assert.isFalse(element.hasQueryParameters);
    });
  });

  describe('#hasPathParameters', () => {
    let element = /** @type ApiUrlParamsEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('is true when has the model', () => {
      const model = [{ name: 'x', value: '', schema: {} }];
      element.pathModel = model;
      assert.isTrue(element.hasPathParameters);
    });

    it('is false when empty model', () => {
      element.pathModel = [];
      assert.isFalse(element.hasPathParameters);
    });

    it('is false when no model', () => {
      element.pathModel = undefined;
      assert.isFalse(element.hasPathParameters);
    });
  });

  describe('#queryValue', () => {
    let element = /** @type ApiUrlParamsEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('returns empty object when no model', () => {
      assert.deepEqual(element.queryValue, {});
    });
    
    it('returns the values', () => {
      const model = [{ name: 'x', value: 'y', schema: {} }];
      element.queryModel = model;
      assert.deepEqual(element.queryValue, { x: 'y' });
    });

    it('ignores not required and empty items', () => {
      const model = [{ name: 'x', value: '', schema: {} }];
      element.queryModel = model;
      assert.deepEqual(element.queryValue, { });
    });

    it('has required and empty items', () => {
      const model = [{ name: 'x', value: '', schema: { required: true } }];
      element.queryModel = model;
      assert.deepEqual(element.queryValue, { x: '' });
    });

    it('ignores disabled values', () => {
      const model = [{ name: 'x', value: 'y', enabled: false }];
      element.queryModel = model;
      assert.deepEqual(element.queryValue, {});
    });
  });

  describe('#pathValue', () => {
    let element = /** @type ApiUrlParamsEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('returns empty object when no model', () => {
      assert.deepEqual(element.pathValue, {});
    });
    
    it('returns the values', () => {
      const model = [{ name: 'x', value: 'y', schema: {} }];
      element.pathModel = model;
      assert.deepEqual(element.pathValue, { x: 'y' });
    });

    it('ignores not required and empty items', () => {
      const model = [{ name: 'x', value: '', schema: {} }];
      element.pathModel = model;
      assert.deepEqual(element.pathValue, { });
    });

    it('has required and empty items', () => {
      const model = [{ name: 'x', value: '', schema: { required: true } }];
      element.pathModel = model;
      assert.deepEqual(element.pathValue, { x: '' });
    });

    it('ignores disabled values', () => {
      const model = [{ name: 'x', value: 'y', enabled: false }];
      element.pathModel = model;
      assert.deepEqual(element.pathValue, {});
    });
  });

  describe('Validation', () => {
    let element = /** @type ApiUrlParamsEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
    });

    it('does not passes validation when required without value: uri parameters', async () => {
      element.pathModel = [{
        name: 'z',
        value: '',
        enabled: true,
        schema: { 
          required: true,
        }
      }];
      await nextFrame();

      const result = element.validate();
      assert.isFalse(result);
    });

    it('passes validation when required with value: uri parameters', async () => {
      element.pathModel = [{
        name: 'test-name',
        value: 'test-value',
        enabled: true,
        schema: {
          required: true,
        }
      }];
      await nextFrame();

      const result = element.validate();
      assert.isTrue(result);
    });

    it('does not passes validation when required without value: query parameters', async () => {
      element.queryModel = [{
        name: 'z',
        value: '',
        enabled: true,
        schema: { 
          required: true,
        }
      }];
      await nextFrame();

      const result = element.validate();
      assert.isFalse(result);
    });

    it('passes validation when required with value: query parameters', async () => {
      element.queryModel = [{
        name: 'test-name',
        value: 'test-value',
        enabled: true,
        schema: {
          required: true,
        }
      }];
      await nextFrame();

      const result = element.validate();
      assert.isTrue(result);
    });

    it('does not passes validation when required query parameters', async () => {
      element.queryModel = [{
        name: 'z',
        value: '',
        enabled: true, 
        schema: { 
          required: true,
        }
      }];
      await nextFrame();
      await aTimeout(0);

      const result = element.validate();
      assert.isFalse(result);
    });
  });

  describe('custom parameters', () => {
    let element = /** @type ApiUrlParamsEditorElement */ (null);
    beforeEach(async () => {
      element = await customFixture();
    });

    it('renders the add button', () => {
      const node = element.shadowRoot.querySelector('.add-param');
      assert.ok(node);
    });

    it('add a query parameter', () => {
      const button = /** @type HTMLElement */ (element.shadowRoot.querySelector('.add-param'));
      button.click();
      assert.lengthOf(element.queryModel, 1);
    });

    it('sets `isCustom` property', () => {
      const button = /** @type HTMLElement */ (element.shadowRoot.querySelector('.add-param'));
      button.click();
      assert.isTrue(element.queryModel[0].schema.isCustom);
    });

    it('changes the name property', async () => {
      element.addCustom();
      await nextFrame();
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.param-name'));
      input.value = 'test';
      input.dispatchEvent(new Event('input'));
      assert.equal(element.queryModel[0].name, 'test');
    });

    it('notifies model change when name changes', async () => {
      element.addCustom();
      await nextFrame();
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.param-name'));
      input.value = 'test';
      const spy = sinon.spy();
      element.addEventListener('querymodelchange', spy);
      input.dispatchEvent(new Event('input'));
      assert.isTrue(spy.called);
    });

    it('changes the value property', async () => {
      element.addCustom();
      await nextFrame();
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.param-value'));
      input.value = 'test-value';
      input.dispatchEvent(new Event('input'));
      assert.equal(element.queryModel[0].value, 'test-value');
    });

    it('notifies model change when name changes', async () => {
      element.addCustom();
      await nextFrame();
      const input = /** @type HTMLInputElement */ (element.shadowRoot.querySelector('.param-value'));
      input.value = 'test-value';
      const spy = sinon.spy();
      element.addEventListener('querymodelchange', spy);
      input.dispatchEvent(new Event('input'));
      assert.isTrue(spy.called);
    });

    it('notifies model change when disabling an item', async () => {
      element.addCustom();
      await nextFrame();
      const input = /** @type HTMLElement */ (element.shadowRoot.querySelector('.param-switch'));
      const spy = sinon.spy();
      element.addEventListener('querymodelchange', spy);
      input.click();
      assert.isTrue(spy.called);
    });

    it('removes an item from the model', async () => {
      element.addCustom();
      await nextFrame();
      const input = /** @type HTMLElement */ (element.shadowRoot.querySelector('.remove-param'));
      input.click();
      assert.deepEqual(element.queryModel, []);
    });

    it('notifies model change when removing an item', async () => {
      element.addCustom();
      await nextFrame();
      const input = /** @type HTMLElement */ (element.shadowRoot.querySelector('.remove-param'));
      const spy = sinon.spy();
      element.addEventListener('querymodelchange', spy);
      input.click();
      assert.isTrue(spy.called);
    });
  });

  describe('AMF model changes', () => {
    let element = /** @type ApiUrlParamsEditorElement */ (null);
    beforeEach(async () => {
      element = await basicFixture();
      const model = [{ name: 'x', value: 'y', schema: {} }];
      element.queryModel = model;
      await nextFrame();
    });

    it('updates the name', () => {
      const node = element.shadowRoot.querySelector('api-form-item');
      node.value = 'other';
      node.dispatchEvent(new Event('change'));
      assert.equal(element.queryModel[0].value, 'other');
    });

    it('notifies model change when removing an item', () => {
      const node = element.shadowRoot.querySelector('api-form-item');
      node.value = 'other';
      const spy = sinon.spy();
      element.addEventListener('querymodelchange', spy);
      node.dispatchEvent(new Event('change'));
      assert.isTrue(spy.called);
    });
  });

  describe('#emptyMessage', () => {
    let element = /** @type ApiUrlParamsEditorElement */ (null);
    beforeEach(async () => {
      element = await emptyFixture();
    });

    it('renders the empty message', () => {
      const node = element.shadowRoot.querySelector('.empty-message');
      assert.ok(node);
    });

    it('does not render the empty message when the query model', async () => {
      element.queryModel = [{
        name: 'i1',
        value: 'test',
      }];
      await nextFrame();
      const node = element.shadowRoot.querySelector('.empty-message');
      assert.notOk(node);
    });

    it('does not render the empty message when the path model', async () => {
      element.pathModel = [{
        name: 'i1',
        value: 'test',
      }];
      await nextFrame();
      const node = element.shadowRoot.querySelector('.empty-message');
      assert.notOk(node);
    });

    it('does not render the empty message when custom allowed', async () => {
      element.allowCustom = true;
      await nextFrame();
      const node = element.shadowRoot.querySelector('.empty-message');
      assert.notOk(node);
    });
  });

  describe('allowDisableParams', () => {
    let element = /** @type ApiUrlParamsEditorElement */ (null);

    beforeEach(async () => {
      element = await disableParamsFixture();
    });

    it('should show the enable/disable switch', async () => {
      const model = [{ name: 'x', value: 'y', schema: {} }];
      element.queryModel = model;
      await nextFrame();
      assert.exists(element.shadowRoot.querySelector('.params-list anypoint-switch'));
    });

    it('should show the enable/disable switch for required param', async () => {
      const model = [{ name: 'x', value: 'y', schema: { required: true } }];
      element.queryModel = model;
      await nextFrame();
      assert.exists(element.shadowRoot.querySelector('.params-list anypoint-switch'));
    });
  });

  describe('allowHideOptional', () => {
    let element = /** @type ApiUrlParamsEditorElement */ (null);

    beforeEach(async () => {
      element = await hideOptionalFixture();
    });

    it('should render the show/hide switch', async () => {
      const model = [{ name: 'x', value: 'y', schema: {} }];
      element.queryModel = model;
      await nextFrame();
      const switchElem = element.shadowRoot.querySelector('anypoint-switch');
      assert.exists(switchElem);
      assert.equal(switchElem.getAttribute('title'), 'Show optional parameters');
      assert.isFalse(switchElem.disabled);
    });

    it('should render optional params when switch is on', async () => {
      const model = [{ name: 'x', value: 'y', schema: {} }];
      element.queryModel = model;
      await nextFrame();
      assert.isNotEmpty(element.shadowRoot.querySelectorAll('.params-list .form-row.form-item'));
    });

    it('should hide optional params when switch is off', async () => {
      const model = [{ name: 'x', value: 'y', schema: {} }];
      element.queryModel = model;
      await nextFrame();
      element.shadowRoot.querySelector('anypoint-switch').click();
      await nextFrame();
      const formItem = /** @type ApiFormItem */ (element.shadowRoot.querySelector('.params-list .form-row.form-item'));
      assert.isTrue(formItem.hidden);
    });

    it('should not hide required params when switch is off', async () => {
      const model = [{ name: 'x', value: 'y', schema: { required: true } }];
      element.queryModel = model;
      await nextFrame();
      const formItem = /** @type ApiFormItem */ (element.shadowRoot.querySelector('.params-list .form-row.form-item'));
      assert.isFalse(formItem.hidden);
    });

    it('should render switch disabled if there are no optional params', async () => {
      const model = [{ name: 'x', value: 'y', schema: { required: true } }];
      element.queryModel = model;
      await nextFrame();
      assert.isTrue(element.shadowRoot.querySelector('anypoint-switch').disabled);
    });

    it('toggles show optional when adding a new parameter', async () => {
      const model = [{ name: 'x', value: 'y', schema: {} }];
      element.queryModel = model;
      element.allowCustom = true;
      await nextFrame();
      element.shadowRoot.querySelector('anypoint-switch').click();
      await nextFrame();

      const button = /** @type HTMLElement */ (element.shadowRoot.querySelector('.add-param'));
      button.click();

      element.addCustom();
      await nextFrame();

      assert.isTrue(element._showOptional);
    });
  });

  describe('a11y', () => {
    it('is accessible for uri parameters form', async () => {
      const element = await basicFixture();
      element.pathModel = [{
        name: 'i1',
        value: 'test',
        enabled: false,
        schema: {
          required: true,
          inputLabel: 'test'
        }
      }];
      await nextFrame();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });

    it('is accessible for query parameters form', async () => {
      const element = await basicFixture();
      element.queryModel = [{
        name: 'i1',
        value: 'test',
        enabled: false,
        schema: {
          required: true,
          inputLabel: 'test'
        }
      }];
      await nextFrame();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });

    it('is accessible for custom parameters', async () => {
      const element = await basicFixture();
      element.allowCustom = true;
      await nextFrame();
      await assert.isAccessible(element, {
        ignoredRules: ['color-contrast']
      });
    });
  });
});
