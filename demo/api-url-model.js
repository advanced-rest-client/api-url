import { html } from 'lit-html';
import { ApiDemoPage } from '@advanced-rest-client/arc-demo-helper';
import '@api-components/api-server-selector/api-server-selector.js';
import { ApiUrlDataModel } from '../index.js';

class ApiDemo extends ApiDemoPage {
  constructor() {
    super();
    this.initObservableProperties([
      'apiBasePrams',
      'endpointUri',
      'apiBaseUri',
      'pathModel',
      'queryModel',
      'selectedShape',
      'serverUri',
      'serverType',
      'allowCustomServers',
      'server',
    ]);
    this.componentName = 'ApiUrlDataModel';
    this.factory = new ApiUrlDataModel();

    this._serverChangeHandler = this._serverChangeHandler.bind(this);

    this.endpointsOpened = true;
    this.serverUri = undefined;
    this.serverType = undefined;
    this.allowCustomServers = false;
  }

  /**
   * overrides AmfHelperMixin.__amfChanged
   * @param {any} amf 
   */
  __amfChanged(amf) {
    if (!this.factory) {
      return;
    }
    this.factory.amf = amf;
    this.readData();
  }

  _navChanged(e) {
    const { selected, type, endpointId } = e.detail;
    this.selectedType = type;
    if (type === 'method') {
      this.methodId = selected;
      this.endpointId = endpointId;
      this.setData(selected);
    } else {
      this.hasData = false;
    }
  }

  setData(selected) {
    this.selectedShape = selected;
    this.factory.selected = selected;
    this.hasData = true;
    this.readData();
  }

  _apiListTemplate() {
    return [
      ['demo-api', 'ARC demo api'],
      ['multi-server', 'Multiple servers'],
      ['loan-microservice', 'Loan microservice (OAS)'],
      ['petstore', 'Petstore (OAS)'],
      ['APIC-298', 'OAS param names'],
      ['APIC-289', 'OAS param names (2)'],
      ['SE-12752', 'Query string support'],
    ].map(([file, label]) => html`
    <anypoint-item data-src="${file}-compact.json">${label} - compact model</anypoint-item>
    <anypoint-item data-src="${file}.json">${label}</anypoint-item>
    `);
  }

  _serverChangeHandler(e) {
    const { value, type } = e.detail;
    this.serverType = type;
    this.serverUri = value;
    this.server = this._findServerByValue(value);
    this.factory.server = this.server;
    this.readData();
  }

  readData() {
    const result = this.factory.getModel();
    this.apiParameters = result.apiParameters;
    this.endpointUri = result.endpointUri;
    this.apiBaseUri = result.apiBaseUri;
    this.pathModel = result.pathModel;
    this.queryModel = result.queryModel;
  }

  /**
   * @param {String} value Server's base URI
   * @return {Object|undefined} An element associated with the base URI or
   * undefined if not found.
   */
  _findServerByValue(value) {
    const { methodId, endpointId } = this;
    const servers = this._getServers({ endpointId, methodId });
    if (!servers) {
      return undefined;
    }
    return servers.find((server) => this._getServerUri(server) === value);
  }

  /**
   * @param {Object} server Server definition.
   * @return {String|undefined} Value for server's base URI
   */
  _getServerUri(server) {
    const key = this._getAmfKey(this.ns.aml.vocabularies.core.urlTemplate);
    return /** @type string */ (this._getValue(server, key));
  }

  contentTemplate() {
    return html`
    ${this._serverSelectorTemplate()}
    
    ${this.hasData ?
      html`<section class="content">
        <div class="log">
          <h3>Output</h3>
          <output><label>Current API base URI: </label>${this.apiBaseUri}</output>
          <output><label>Endpoint URI: </label>${this.endpointUri}</output>
          <output>
            <label>API base parameters</label>
            ${this._paramsList(this.apiParameters)}
          </output>
          <output>
            <label>Selected path view model</label>
            ${this._paramsList(this.pathModel)}
          </output>
          <output>
            <label>Selected path query model</label>
            ${this._paramsList(this.queryModel)}
          </output>
        </div>
      </section>` :
      html`<p>Select a HTTP method in the navigation to see the demo.</p>`}
    `;
  }

  _serverSelectorTemplate() {
    const { amf, serverUri, serverType, allowCustomServers } = this;
    return html`
    <api-server-selector
      ?allowCustom="${allowCustomServers}"
      .amf="${amf}"
      .value="${serverUri}"
      .type="${serverType}"
      autoSelect
      .selectedShape="${this.selectedShape}"
      .selectedShapeType="${this.selectedType}"
      @apiserverchanged="${this._serverChangeHandler}"
    >
      <slot name="custom-base-uri" slot="custom-base-uri"></slot>
    </api-server-selector>`;
  }

  _paramsList(model) {
    if (!model || !model.length) {
      return html`<i>Nothing to render here, yet.</i>`;
    }
    return model.map((item) => this._paramItem(item));
  }

  _paramItem(model) {
    const { name } = model;
    return html`
    <details>
      <summary>${name}</summary>
      <div class="formatted">${JSON.stringify(model, null, 1)}</div>
    </details>`;
  }
}
const instance = new ApiDemo();
instance.render();
