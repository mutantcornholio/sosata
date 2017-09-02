import React, { Component } from 'react';
import './Playlist.css';
import Track from '../Track/Track.js';
import {events} from '../../modules/player';
import {Table, TableBody} from 'material-ui/Table';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import PubSub from 'pubsub-js';


class Playlist extends Component {
    state = {
        items: [],
        selectedRows: [],
        currentTrack: -1
    };

    componentDidMount() {
        this.updatePlaylist();
        this.playlistUpdateToken = PubSub.subscribe(events.PLAYLIST_CHANGED, this.updatePlaylist.bind(this));
        this.playbackUpdateToken = PubSub.subscribe(events.PLAYBACK_CHANGED, this.updateCurrentTrack.bind(this));
    }

    componentWillUnmount() {
        PubSub.unsubscribe(this.playlistUpdateToken);
        PubSub.unsubscribe(this.playbackUpdateToken);
    }

    updatePlaylist() {
        this.setState({
            items: this.props.player.getPlaylist()
        });
    }

    updateCurrentTrack() {
        this.setState({
            currentTrack: this.props.player.currentTrack()
        });
    }

    removeSelected = () => {
        this.props.player.removeFromPlaylist(this.state.selectedRows);
    };

    render() {
        let lines = [];

        for (let [index, item] of this.state.items.entries()) {
            lines.push(<Track
                player={this.props.player}
                key={index}
                index={index}
                selected={this.state.selectedRows.indexOf(index) !== -1}
                isCurrent={this.state.currentTrack === index}
                data={item} />);
        }

        return (
            <MuiThemeProvider>
            <div className="Playlist" hidden={this.props.hidden}>
                <Drawer width={100} openSecondary={true} open={this.state.selectedRows.length > 0} containerStyle={{
                    top: '66px',
                    height: '100vh',
                    position: 'fixed',
                    zIndex: 1
                }} >
                    <MenuItem onTouchTap={this.removeSelected}>Remove</MenuItem>
                </Drawer>
                <Table multiSelectable={true} onRowSelection={(selectedRows) => {
                    this.setState({selectedRows: selectedRows});
                }}>
                    <TableBody displayRowCheckbox={false}>

                        {lines}
                    </TableBody>
                </Table>

            </div>
            </MuiThemeProvider>
        );
    }
}

export default Playlist;
