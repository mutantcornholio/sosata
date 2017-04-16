import React from 'react';
import ReactDOM from 'react-dom';
import createBrowserHistory from 'history/createBrowserHistory'
import injectTapEventPlugin from 'react-tap-event-plugin';
import {
    BrowserRouter as Router,
    Route
} from 'react-router-dom'

import LastFMCloser from "./components/LastFMCloser/LastFMCloser";
import App from './components/App';
import './index.css';

const history = createBrowserHistory();

injectTapEventPlugin();

ReactDOM.render(
    <Router history={history}>
        <div>
            <Route exact path="/" component={App}/>
            <Route path="/view/:view" component={App}/>
            <Route path="/LastFMCloser" component={LastFMCloser}/>
        </div>
    </Router>,
    document.getElementById('root')
);
