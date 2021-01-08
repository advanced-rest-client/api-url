import { assert } from '@open-wc/testing';
import { AmfLoader } from './amf-loader.js';
import { ApiUrlDataModel } from '../index.js';

describe('ApiUrlDataModel', () => {
  describe('SE-12752', () => {
    const apiFile = 'SE-12752';

    [
      ['full data model', false],
      ['compact data model', true]
    ].forEach(([label, compact]) => {
      describe(String(label), () => {
        let amf;

        before(async () => {
          amf = await AmfLoader.load(/** @type boolean */ (compact), apiFile);
        });

        it('computes query model for NodeShape', async () => {
          const method = AmfLoader.lookupOperation(amf, '/test', 'get');
          const methodId = method['@id'];
          const instance = new ApiUrlDataModel(amf);
          instance.selected = methodId;
          const info = instance.getModel();
          const result = info.queryModel;
          assert.typeOf(result, 'array', 'queryModel is an array');
          assert.lengthOf(result, 2, 'queryModel has 2 elements');
        });

        it('computes query model for ScalarShape', async () => {
          const method = AmfLoader.lookupOperation(amf, '/scalar', 'get');
          const methodId = method['@id'];
          const instance = new ApiUrlDataModel(amf);
          instance.selected = methodId;
          const info = instance.getModel();
          const result = info.queryModel;
          assert.typeOf(result, 'array', 'queryModel is an array');
          assert.lengthOf(result, 1, 'queryModel has 1 element');
        });

        // TODO: add support for ArrayShape and UnionShape.
        // This is quite complex as:
        // - should complex shapes be considered in the array shape? What
        // sense does it have with query parameters?
        // - how to process unions? This probably should be set as a property
        // of the element to generate model for a specific union type.
      });
    });
  });
});
