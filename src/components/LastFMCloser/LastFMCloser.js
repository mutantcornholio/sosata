import React, { Component } from 'react';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import {RaisedButton} from "material-ui";
import lightBaseTheme from "material-ui/styles/baseThemes/lightBaseTheme";

export let views = {
    library: 'library',
    playlist: 'playlist',
    settings: 'settings'
};

import {Scrobbler} from '../../modules/scrobbler/scrobbler';
import {parseQuery} from '../../helpers/parseQuery';

class LastFMCloser extends Component {
    render() {
        const query = parseQuery(this.props.location.search);

        const closeButton = (
            <RaisedButton primary={true} label="close this window" onTouchTap={() => {window.close();}}/>
        );

        if (query.token && query.token.length) {
            new Scrobbler().connect(query.token);

            return (
                <MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
                    <div style={{padding: '15px'}}>
                        <h1>Success!</h1><br />

                        Last.fm account is connected. You can&nbsp;
                        {closeButton}
                        &nbsp;now.
                    </div>
                </MuiThemeProvider>
            );
        } else {
            return (
                <MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
                    <div style={{padding: '15px'}}>
                        <h1>Oh no!</h1><br />

                        Something went wrong! You can probably&nbsp;
                        {closeButton}
                        &nbsp;and try again.
                    </div>
                </MuiThemeProvider>
            );
        }
    }
}

export default LastFMCloser;
