import { assert, fixture, html } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import { ApiUrlDataModel } from '../index.js';
import '../api-url-editor.js';
import '../api-url-params-editor.js';

/** @typedef {import('../src/types').ApiUrlModelReadResult} ApiUrlModelReadResult */

describe('Integration', () => {
  describe('APIC-689', () => {
    const apiFile = 'APIC-689';

    /**
     * @param {any} amf
     * @param {ApiUrlModelReadResult} info
     * @returns {Promise<HTMLElement>}
     */
    async function basicFixture(amf, info) {
      const { apiBaseUri, endpointPath, pathModel, queryModel } = info;
      return fixture(html`
      <div>
        <api-url-editor
          required
          .amf="${amf}"
          .baseUri="${apiBaseUri}"
          .endpointPath="${endpointPath}"
          .queryModel="${queryModel}"
          .pathModel="${pathModel}"
        ></api-url-editor>

        <api-url-params-editor
          .queryModel="${queryModel}"
          .pathModel="${pathModel}"
        ></api-url-params-editor>
      </div>
      `);
    }

    [
      ['full data model', false],
      ['compact data model', true]
    ].forEach((args) => {
      const label = /** @type string */ (args[0]);
      const compact = /** @type boolean */ (args[1]);

      describe(label, () => {
        let factory = /** @type ApiUrlDataModel */ (null);
        let amf;

        before(async () => {
          amf = await AmfLoader.load(compact, apiFile);
          factory = new ApiUrlDataModel(amf);
        });

        it('does not set URL query param for an optional enum', async () => {
          const method = AmfLoader.lookupOperation(amf, '/test', 'get');
          const methodId = method['@id'];
          factory.selected = methodId;
          const info = factory.getModel();
          const container = await basicFixture(amf, info);
          const urlEditor = container.querySelector('api-url-editor');
          assert.equal(urlEditor.value, '/test', 'param value is not set');
        });

        it('selects empty enum value', async () => {
          const method = AmfLoader.lookupOperation(amf, '/test', 'get');
          const methodId = method['@id'];
          factory.selected = methodId;
          const info = factory.getModel();
          const container = await basicFixture(amf, info);
          const editor = container.querySelector('api-url-params-editor');
          const input = editor.shadowRoot.querySelector('api-form-item');
          assert.equal(input.value, '', 'enum input value is empty');
          const item = input.shadowRoot.querySelector('anypoint-item');
          assert.equal(item.getAttribute('data-value'), '', 'has selected empty item');
        });

        it('does set URL query param for a required enum', async () => {
          const method = AmfLoader.lookupOperation(amf, '/test', 'post');
          const methodId = method['@id'];
          factory.selected = methodId;
          const info = factory.getModel();
          const container = await basicFixture(amf, info);
          const urlEditor = container.querySelector('api-url-editor');
          assert.equal(urlEditor.value, '/test?param1=A', 'param value is set');
        });

        it('selects first enum value', async () => {
          const method = AmfLoader.lookupOperation(amf, '/test', 'post');
          const methodId = method['@id'];
          factory.selected = methodId;
          const info = factory.getModel();
          const container = await basicFixture(amf, info);
          const editor = container.querySelector('api-url-params-editor');
          const input = editor.shadowRoot.querySelector('api-form-item');
          assert.equal(input.value, 'A', 'enum input value is set');
          const item = input.shadowRoot.querySelector('anypoint-item');
          assert.equal(item.getAttribute('data-value'), 'A', 'has selected first item');
        });
      });
    });
  });
});
