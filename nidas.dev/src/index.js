import React, { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './pages/App';
import reportWebVitals from './misc/reportWebVitals';
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
