import { css } from 'lit-element';

export default css`
:host {
  display: block;
  margin: 8px 12px;
}

.empty-message {
  font-style: var(--no-info-message-font-style, italic);
  font-size: var(--no-info-message-font-size, 16px);
  color: var(--no-info-message-color, rgba(0, 0, 0, 0.74));
}

[hidden] {
  display: none !important;
}

.form-row {
  display: flex;
  align-items: center;
  flex: 1;
}

.params-list {
  margin: 12px 0;
}

.param-switch {
  margin: 0px 8px 0px 0px;
}

anypoint-input {
  margin: 0;
}

api-form-item {
  flex: 1;
  margin: 10px 0;
}

.form-row {
  min-height: 48px;
}

.param-value {
  flex: 1;
}

.param-name {
  margin-right: 4px;
}
`;
