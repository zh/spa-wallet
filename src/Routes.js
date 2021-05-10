import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import Pages from './Pages';

const Routes = () => {
  return (
    <HashRouter>
      <Switch>
        <Route exact path="/" component={Pages.Home} />
      </Switch>
    </HashRouter>
  );
};

export default Routes;
