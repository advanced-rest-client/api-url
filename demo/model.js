
const generator = require('@api-components/api-model-generator');

/** @typedef {import('@api-components/api-model-generator/types').ApiConfiguration} ApiConfiguration */

/** @type Map<string, ApiConfiguration> */
const files = new Map();

files.set('demo-api/demo-api.raml', { type: 'RAML 1.0' });
files.set('loan-ms/loan-microservice.json', { type: 'OAS 2.0', mime: 'application/json' });
files.set('petstore/petstore.json', { type: 'OAS 2.0', mime: 'application/json' });
files.set('APIC-298/APIC-298.json', { type: 'OAS 2.0', mime: 'application/json' });
files.set('APIC-289/APIC-289.yaml', { type: 'OAS 2.0', mime: 'application/yaml' });
files.set('SE-12752/SE-12752.raml', { type: 'RAML 1.0' });
files.set('multi-server/multi-server.yaml', { type: 'OAS 3.0', mime: 'application/yaml' });
files.set('APIC-689/APIC-689.raml', { type: 'RAML 1.0' });

generator.generate(files);
