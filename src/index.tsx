import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { Provider } from "react-redux";
import configureStore from "./store";

import { initApi, initInterceptors } from "axios-config";

import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./keycloak";

import i18n from "./i18n";
import { NinjaErrorBoundary } from "./ninja-error-boundary";

import "./index.scss";

initApi();
i18n.init();

ReactDOM.render(
  <React.StrictMode>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{ onLoad: "login-required" }}
      LoadingComponent={<span>Loading...</span>}
      isLoadingCheck={(keycloak) => {
        if (keycloak.authenticated) {
          initInterceptors(() => {
            return new Promise<string>((resolve, reject) => {
              if (keycloak.token) {
                keycloak
                  .updateToken(5)
                  .then(() => resolve(keycloak.token!))
                  .catch(() => reject("Failed to refresh token"));
              } else {
                keycloak.login();
                reject("Not logged in");
              }
            });
          });

          const kcLocale = (keycloak.tokenParsed as any)["locale"];
          if (kcLocale) {
            i18n.changeLanguage(kcLocale);
          }
        }

        return !keycloak.authenticated;
      }}
    >
      <Provider store={configureStore()}>
        <NinjaErrorBoundary>
          <App />
        </NinjaErrorBoundary>
      </Provider>
    </ReactKeycloakProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
