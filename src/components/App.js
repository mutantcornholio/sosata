import React, { Component } from 'react';

import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import Playlist from './Playlist/Playlist.js';
import Library from './Library/Library.js';
import Settings from './Settings/Settings.js';
import ViewSwitcher from './ViewSwitcher/ViewSwitcher.js';
import Playback from './Playback/Playback.js';

import Player from '../modules/player';

import './App.css';


export let views = {
    library: 'library',
    playlist: 'playlist',
    settings: 'settings'
};

class App extends Component {
    player;
    constructor() {
        super();

        this.player = new Player();
    }

    render() {
        const view = this.props.match.params.view || views.library;

        return (
            <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
                <div className="App">

                    <div className="App-header">
                        <h2>Player</h2>
                    </div>

                    <div className="App-view">
                        <Library
                            player={this.player}
                            hidden={view !== views.library}/>

                        <Playlist
                            player={this.player}
                            hidden={view !== views.playlist}/>

                        <Settings
                            player={this.player}
                            hidden={view !== views.settings}/>
                    </div>

                    <div className="Playback-container">
                        <Playback player={this.player} />
                    </div>

                    <div className="ViewSwitcher-container">
                        <ViewSwitcher currentView={view} />
                    </div>

                </div>
            </MuiThemeProvider>

        );
    }
}

export default App;
