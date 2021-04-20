import { html } from 'lit-html';
import { ApiDemoPage } from '@advanced-rest-client/arc-demo-helper';
import '@advanced-rest-client/arc-demo-helper/arc-interactive-demo.js';
import '@anypoint-web-components/anypoint-styles/colors.js';
import '@anypoint-web-components/anypoint-checkbox/anypoint-checkbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@api-components/api-server-selector/api-server-selector.js';
import { ApiUrlDataModel } from '../index.js';
import '../api-url-editor.js';
import '../api-url-params-editor.js';

class ApiDemo extends ApiDemoPage {
  constructor() {
    super();

    this.initObservableProperties([
      'readonly', 'disabled', 'outlined', 'compatibility',
      'baseUri', 'endpointPath', 'queryModel', 'pathModel', 'selectedShape', 'selectedType',
      'mainNoLabelFloat', 'serverValue', 'serverType',
      'allowCustomBaseUri', 'autoValidate', 'allowCustom', 'emptyMessage', 'urlValue',
      'allowHideOptional', 'allowDisableParams',
    ]);

    this.componentName = 'api-url-editor';
    this.demoStates = ['Filled', 'Outlined', 'Anypoint'];
    this.serverValue = null;
    this.serverType = null;
    this.allowCustomBaseUri = false;
    this.readonly = false;
    this.disabled = false;
    this.mainNoLabelFloat = false;
    this.autoValidate = false;
    this.allowCustom = false;
    this.emptyMessage = false;
    this.urlValue = '';
    this.allowHideOptional = false;
    this.allowDisableParams = false;

    this.modelFactory = new ApiUrlDataModel();

    this._mainDemoStateHandler = this._mainDemoStateHandler.bind(this);
    this._toggleMainOption = this._toggleMainOption.bind(this);
    this._mainValueChanged = this._mainValueChanged.bind(this);
    this._serverHandler = this._serverHandler.bind(this);
    this._pathModelChange = this._pathModelChange.bind(this);
    this._queryModelChange = this._queryModelChange.bind(this);
  }

  get dataModelBaseUri() {
    const { serverValue, serverType } = this;
    if (serverType === 'custom') {
      return serverValue;
    }
    return null;
  }

  _updateServer() {
    const { selectedShape: methodId, selectedEndpointId: endpointId, serverValue, serverType } = this;
    if (serverType !== 'server') {
      console.log('Not a "server" server', serverType);
      this.modelFactory.server = undefined;
      return;
    }
    const servers = this._getServers({ endpointId, methodId });
    if (servers) {
      const server = servers.find((srv) => this._getServerUri(srv) === serverValue);
      if (this.modelFactory.server === server) {
        return;
      }
      console.log('Found server:', server);
      this.modelFactory.server = server;
    } else {
      this.modelFactory.server = undefined;
    }
    this.readModelData();
  }

  /**
   * @param {Object} server Server definition.
   * @return {String|undefined} Value for server's base URI
   */
  _getServerUri(server) {
    const key = this._getAmfKey(this.ns.aml.vocabularies.core.urlTemplate);
    return /** @type string */ (this._getValue(server, key));
  }

  _navChanged(e) {
    const { selected, type, endpointId } = e.detail;
    if (type === 'method') {
      this.selectedShape = selected;
      this.selectedType = type;
      this.selectedEndpointId = endpointId;
      this.modelFactory.selected = selected;
    } else {
      this.selectedShape = undefined;
      this.selectedType = undefined;
      this.selectedEndpointId = undefined;
      this.modelFactory.selected = undefined;
    }
    this._updateServer();
    this.readModelData();
  }

  _mainDemoStateHandler(e) {
    const state = e.detail.value;
    this.outlined = state === 1;
    this.compatibility = state === 2;
    this._updateCompatibility();
  }

  /**
   * overrides AmfHelperMixin.__amfChanged
   * @param {any} amf 
   */
  __amfChanged(amf) {
    if (!this.modelFactory) {
      return;
    }
    this.modelFactory.amf = amf;
    this.readModelData();
  }

  readModelData() {
    const result = this.modelFactory.getModel();
    this.baseUri = result.apiBaseUri;
    this.endpointPath = result.endpointPath;
    this.pathModel = result.pathModel;
    this.queryModel = result.queryModel;
  }

  _mainValueChanged(e) {
    this.urlValue = e.target.value;
    console.log('Demo URL value', this.urlValue);
  }

  /**
   * Handler for the `apiserverchanged` dispatched from the server selector.
   * @param {CustomEvent} e
   */
  _serverHandler(e) {
    const { value, type } = e.detail;
    this.serverType = type;
    this.serverValue = value;
    console.log('Server changed: ', type, value);
    this.modelFactory.apiUri = this.dataModelBaseUri;
    this._updateServer();
  }

  _pathModelChange(e) {
    this.pathModel = [...e.target.pathModel];
    console.log('Updated path model', e.target.pathModel);
  }

  _queryModelChange(e) {
    this.queryModel = [...e.target.queryModel];
    console.log('Updated query model', e.target.queryModel);
  }

  _apiListTemplate() {
    return [
      ['demo-api', 'Demo API'],
      ['multi-server', 'Multiple servers'],
    ].map(([file, label]) => html`
      <anypoint-item data-src="${file}-compact.json">${label} - compact model</anypoint-item>
      <anypoint-item data-src="${file}.json">${label}</anypoint-item>
      `);
  }

  _demoTemplate() {
    const {
      readonly,
      disabled,
      demoStates,
      darkThemeActive,
      outlined,
      compatibility,
      baseUri,
      endpointPath,
      queryModel,
      pathModel,
      mainNoLabelFloat,
      amf,
      autoValidate,
      allowCustom,
      emptyMessage,
      urlValue,
      allowHideOptional,
      allowDisableParams,
    } = this;
    return html`
    <section class="documentation-section">
      <h3>Interactive demo</h3>

      ${this._serverSelectorTemplate()}

      <arc-interactive-demo
        .states="${demoStates}"
        @state-changed="${this._mainDemoStateHandler}"
        ?dark="${darkThemeActive}"
      >

        <div class="editors" slot="content">
          <api-url-editor
            @change="${this._mainValueChanged}"
            @pathmodelchange="${this._pathModelChange}"
            @querymodelchange="${this._queryModelChange}"
            ?readonly="${readonly}"
            ?disabled="${disabled}"
            ?outlined="${outlined}"
            ?compatibility="${compatibility}"
            ?noLabelFloat="${mainNoLabelFloat}"
            required
            .amf="${amf}"
            .baseUri="${baseUri}"
            .endpointPath="${endpointPath}"
            .queryModel="${queryModel}"
            .pathModel="${pathModel}"
          ></api-url-editor>

          <api-url-params-editor
            ?readonly="${readonly}"
            ?disabled="${disabled}"
            ?outlined="${outlined}"
            ?compatibility="${compatibility}"
            .queryModel="${queryModel}"
            .pathModel="${pathModel}"
            ?allowCustom="${allowCustom}"
            ?autoValidate="${autoValidate}"
            ?emptyMessage="${emptyMessage}"
            ?allowHideOptional="${allowHideOptional}"
            ?allowDisableParams="${allowDisableParams}"
            @pathmodelchange="${this._pathModelChange}"
            @querymodelchange="${this._queryModelChange}"
          ></api-url-params-editor>
        </div>

        <label slot="options" id="mainOptionsLabel">Options</label>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="readonly"
          @change="${this._toggleMainOption}"
          >Read only</anypoint-checkbox
        >
        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="disabled"
          @change="${this._toggleMainOption}"
        >Disabled</anypoint-checkbox>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="mainNoLabelFloat"
          @change="${this._toggleMainOption}"
        >No label float</anypoint-checkbox>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="allowCustomBaseUri"
          @change="${this._toggleMainOption}"
        >Allow server custom URI</anypoint-checkbox>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="allowCustom"
          @change="${this._toggleMainOption}"
        >Allow custom params</anypoint-checkbox>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="autoValidate"
          @change="${this._toggleMainOption}"
        >Auto validate</anypoint-checkbox>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="emptyMessage"
          @change="${this._toggleMainOption}"
        >Render empty message</anypoint-checkbox>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="allowHideOptional"
          @change="${this._toggleMainOption}"
        >Allow hide optional</anypoint-checkbox>

        <anypoint-checkbox
          aria-describedby="mainOptionsLabel"
          slot="options"
          name="allowDisableParams"
          @change="${this._toggleMainOption}"
        >Allow disable params</anypoint-checkbox>
      </arc-interactive-demo>

      ${urlValue ? html`<p>Produced value: ${urlValue}</p>` : ''}
    </section>`;
  }

  /**
   * @return {object} A template for the server selector
   */
  _serverSelectorTemplate() {
    const {
      amf,
      allowCustomBaseUri,
      outlined,
      compatibility,
      serverType,
      serverValue,
    } = this;
    return html`
    <api-server-selector
      ?allowCustom="${allowCustomBaseUri}"
      .amf="${amf}"
      .value="${serverValue}"
      .type="${serverType}"
      .selectedShape="${this.selectedShape}"
      .selectedShapeType="${this.selectedType}"
      autoSelect
      ?compatibility="${compatibility}"
      ?outlined="${outlined}"
      @apiserverchanged="${this._serverHandler}"
    ></api-server-selector>`;
  }

  contentTemplate() {
    return html`
      <h2 class="centered main">API URL editor</h2>
      ${this._demoTemplate()}
      `;
  }
}
const instance = new ApiDemo();
instance.render();
