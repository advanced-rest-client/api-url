import { AmfFormItem } from "@advanced-rest-client/arc-types/src/forms/FormTypes";

export declare interface ApiUrlModelInit {
  /**
   * A property to set to override AMF's model base URI information.
   */
  apiUri?: string;
  /**
   * The `@id` property of selected endpoint and method to compute the data models for.
   */
  selected?: string;
  /**
   * Computed value of server definition from the AMF model.
   */
  server?: any;
}

export declare interface ApiUrlModelReadResult {
  apiParameters: AmfFormItem[];
  queryModel: AmfFormItem[];
  pathModel: AmfFormItem[];
  endpointUri: string;
  endpointPath: string;
  apiBaseUri: string;
}
