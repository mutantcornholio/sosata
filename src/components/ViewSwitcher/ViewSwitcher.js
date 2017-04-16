import React, { Component } from 'react';
import './ViewSwitcher.css';
import FlatButton from 'material-ui/FlatButton';
import {views} from '../App.js';
import {Link} from 'react-router-dom';


class ViewSwitcher extends Component {
    render() {
        return (
            <div className="ViewSwitcher">
                <Link to={`/view/${views.playlist}`}>
                    <FlatButton
                        label="Playlist"
                        primary={this.props.currentView === views.playlist}/>
                </Link>
                <Link to={`/view/${views.library}`}>
                    <FlatButton
                        label="Library"
                        primary={this.props.currentView === views.library}/>
                </Link>
                <Link to={`/view/${views.settings}`}>
                    <FlatButton
                        label="Settings"
                        primary={this.props.currentView === views.settings}/>
                </Link>
            </div>
        );
    }
}

export default ViewSwitcher;
