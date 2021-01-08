import { assert } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import { ApiUrlDataModel } from '../index.js';

describe('ApiUrlDataModel', () => {
  describe('APIC-298', () => {
    const apiFile = 'APIC-298';

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
          const method = AmfLoader.lookupOperation(amf, '/prescreens/{id}', 'get');
          methodId = method['@id'];
          instance = new ApiUrlDataModel(amf);
          instance.selected = methodId;
        });

        it('computes pathModel', () => {
          const info = instance.getModel();
          const result = info.pathModel;
          assert.typeOf(result, 'array', 'pathModel is an array');
          assert.lengthOf(result, 1, 'pathModel has no elements');
        });

        it('has OAS property name', () => {
          const info = instance.getModel();
          const result = info.pathModel;
          assert.equal(result[0].name, 'id');
        });
      });
    });
  });
});
