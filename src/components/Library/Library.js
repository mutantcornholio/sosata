import React, { Component } from 'react';
import './Library.css';
import config from '../../config.js'
import $ from 'jquery';
import {Table, TableBody, TableRowColumn} from 'material-ui/Table';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import path from 'path';
import DoubleClickableTableRow from '../DoubleClickableTableRow'
import LinearProgress from 'material-ui/LinearProgress';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';


class Library extends Component {
    renderingItems = [];

    state = {
        loading: true,
        currentPath: '/',
        items: [],
        selectedRows: [],
        directories: [],
        files: []
    };

    _shouldAddUpLink() {
        return decodeURIComponent(this.state.currentPath) !== '/';
    }

    componentDidMount() {
        if (this.props.match.params.deeperPath) {
            this.setPath('/' + this.props.match.params.deeperPath);
        } else {
            this.setPath('/');
        }
    }

    setPath(newPath) {
        const newpath = path.resolve(`/view/library/${newPath.replace(/%2F/g, '/')}`);

        if (this.props.match.url !== newpath) {
            this.props.history.push(newpath);
        }

        this.setState({loading: true});

        $.ajax(`http://${config.host}/library${newPath}/index.json`).done((data) => {
            let directories = [];
            let files = [];

            for (let index in data) {
                if (!data.hasOwnProperty(index)) {
                    continue;
                }

                if (data[index].type === 'directory') {
                    directories.push(data[index]);
                } else if (data[index].type === 'file') {
                    files.push(data[index]);
                }
            }

            this.setState({
                loading: false,
                currentPath: newPath,
                items: directories.concat(files),
                selectedRows: [],
                directories,
                files
            })
        })
    }

    addSelected = () => {
        let itemsToAdd = [];

        for (let row of this.state.selectedRows) {
            if (this._shouldAddUpLink()) {
                row--;
            }

            itemsToAdd.push(this.state.items[row]);
        }

        this.props.player.addToPlaylist(itemsToAdd);
    };

    addDoubleClickableRow({onDoubleTap, title, url}) {
        let result = (
            <DoubleClickableTableRow
                key={this.renderingItems.length + 1}
                style={{height: '32px'}}
                onDoubleTap={onDoubleTap ? onDoubleTap : () => {this.setPath(url)}}
                selected={this.state.selectedRows.indexOf(this.renderingItems.length) !== -1}>
                    <TableRowColumn style={{height: '32px'}}>{title}</TableRowColumn>
            </DoubleClickableTableRow>
        );

        this.renderingItems.push(result);
    }

    render() {
        if (this.state.loading) {
            return (
                <LinearProgress mode="indeterminate"/>
            )
        }

        let currentPath = decodeURIComponent(this.state.currentPath);

        this.renderingItems = [];

        if (this._shouldAddUpLink()) {
            let upperPath = path.resolve(currentPath + '/../');
            let url = encodeURIComponent(upperPath);

            this.addDoubleClickableRow({
                url,
                title: '..',
            });
        }

        for (let item of this.state.directories) {
            let url = '/' + encodeURIComponent(item.path);

            this.addDoubleClickableRow({
                url,
                title: item.name,
            });
        }

        for (let item of this.state.files) {
            this.addDoubleClickableRow({
                onDoubleTap: () => {this.props.player.addToPlaylist([item])},
                title: item.title,
            });
        }

        return (
            <MuiThemeProvider>
            <div className="Library" hidden={this.props.hidden}>
                <Drawer width={100} openSecondary={true} open={this.state.selectedRows.length > 0} containerStyle={{
                    top: '66px',
                    height: '100vh',
                    position: 'fixed',
                    zIndex: 1
                }} >
                    <MenuItem onTouchTap={this.addSelected}>Add</MenuItem>
                </Drawer>
                <Table multiSelectable={true} onRowSelection={(selectedRows) => {
                    if (this._shouldAddUpLink()) {
                        const upLinkIndex = selectedRows.indexOf(0);

                        if (upLinkIndex !== -1) {
                            selectedRows.splice(upLinkIndex, 1);
                        }
                    }
                    this.setState({selectedRows: selectedRows});
                }}>
                    <TableBody displayRowCheckbox={false}>
                        {this.renderingItems}
                    </TableBody>
                </Table>
            </div>
            </MuiThemeProvider>
        );
    }
}

export default Library;
