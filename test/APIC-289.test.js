import { assert } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import { ApiUrlDataModel } from '../index.js';

describe('ApiUrlDataModel', () => {
  describe('APIC-289', () => {
    const apiFile = 'APIC-289';

    [
      ['full data model', false],
      ['compact data model', true]
    ].forEach(([label, compact]) => {
      describe(String(label), () => {
        let instance = /** @type ApiUrlDataModel */ (null);
        let amf;
        let methodId;

        before(async () => {
          amf = await AmfLoader.load(/** @type boolean */ (compact), apiFile);
        });

        beforeEach(async () => {
          const method = AmfLoader.lookupOperation(amf, '/organization', 'get');
          methodId = method['@id'];
          instance = new ApiUrlDataModel(amf);
        });

        it('computes pathModel', () => {
          instance.selected = methodId;
          const info = instance.getModel();
          const result = info.queryModel;
          assert.typeOf(result, 'array', 'pathModel is an array');
          assert.lengthOf(result, 1, 'pathModel has no elements');
        });

        it('has OAS property name', () => {
          instance.selected = methodId;
          const info = instance.getModel();
          const result = info.queryModel;
          assert.equal(result[0].name, 'foo');
        });
      });
    });
  });
});
