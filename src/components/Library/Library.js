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
    state = {
        loading: true,
        currentPath: '/',
        items: [],
        selectedRows: [],
        directories: [],
        files: []
    };

    componentDidMount() {
        this.setPath('/');
    }

    setPath(path) {
        this.setState({loading: true});

        $.ajax(`http://${config.host}/library${path}/index.json`).done((data) => {
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
                currentPath: path,
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
            itemsToAdd.push(this.state.items[row]);
        }

        this.props.player.addToPlaylist(itemsToAdd);
    };

    render() {
        if (this.state.loading) {
            return (
                <LinearProgress mode="indeterminate"/>
            )
        }

        let items = [];

        let currentPath = decodeURIComponent(this.state.currentPath);

        if (currentPath !== '/') {
            let upperPath = path.resolve(currentPath + '/../');
            let url = encodeURIComponent(upperPath);

            items.push(
                <DoubleClickableTableRow
                    key={url}
                    style={{height: '32px'}}
                    onDoubleTap={() => {this.setPath(url)}}>
                    <TableRowColumn style={{height: '32px'}}>..</TableRowColumn>
                </DoubleClickableTableRow>
            );
        }

        for (let item of this.state.directories) {
            let url = '/' + encodeURIComponent(item.path);

            items.push(
                <DoubleClickableTableRow
                    key={url}
                    style={{height: '32px'}}
                    onDoubleTap={() => {this.setPath(url)}}
                    selected={this.state.selectedRows.indexOf(items.length) !== -1}>
                    <TableRowColumn style={{height: '32px'}}>{item.name}</TableRowColumn>
                </DoubleClickableTableRow>
            );
        }

        for (let item of this.state.files) {
            items.push(
                <DoubleClickableTableRow
                    key={item.checksum}
                    style={{height: '32px'}}
                    onDoubleTap={() => {this.props.player.addToPlaylist([item]);}}
                        selected={this.state.selectedRows.indexOf(items.length) !== -1}>
                    <TableRowColumn style={{height: '32px'}}>{item.title}</TableRowColumn>
                </DoubleClickableTableRow>
            )
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
                    this.setState({selectedRows: selectedRows});
                }}>
                    <TableBody displayRowCheckbox={false}>
                        {items}
                    </TableBody>
                </Table>

            </div>
            </MuiThemeProvider>
        );
    }
}

export default Library;
