import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';

import './Playback.css';

class Playback extends Component {
    render() {
        return (
            <div className="Playback">
                <FlatButton
                    label="Prev"
                    onTouchTap={() => {this.props.player.prev()}} />
                <FlatButton
                    label="Toggle"
                    onTouchTap={() => {this.props.player.toggle()}} />
                <FlatButton
                    label="Next"
                    onTouchTap={() => {this.props.player.next()}} />
            </div>
        );
    }
}

export default Playback;
