import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import config from '../../config.js'

import './Settings.css';

class Settings extends Component {
    render() {
        const isConnected = this.props.player.scrobbler.isConnected;

        return (
            <MuiThemeProvider>
            <div hidden={this.props.hidden} className="settingsView">
                <div className="lastfmConnector">
                    <span>Last.fm</span>
                    <RaisedButton
                        label={isConnected ? "Connected" : "Not connected"}
                        secondary={!isConnected}
                        disabled={isConnected}
                        style={{width: '180px'}}
                        onTouchTap={() => {
                            window.open(
                                `http://www.last.fm/api/auth/?api_key=${config.lastfm.apiKey}` +
                                `&cb=${document.location.protocol}//${document.location.host}/LastFMCloser`,
                                '_blank');
                        }}/>
                </div>
            </div>
            </MuiThemeProvider>
        );
    }
}

export default Settings;
