import React from 'react';
import './Track.css';
import DoubleClickableTableRow from '../DoubleClickableTableRow';
import {TableRowColumn} from 'material-ui/Table';

class Track extends DoubleClickableTableRow {
    render() {
        let props = Object.assign({}, this.props);
        delete props.data;
        delete props.player;
        delete props.index;

        return (
            <DoubleClickableTableRow
                style={{height: '32px'}} {...props}
                onDoubleTap={() => {this.props.player.switchTo(this.props.index);}}>
                <TableRowColumn style={{height: '32px'}}>{this.props.data.title}</TableRowColumn>
            </DoubleClickableTableRow>
        );
    }
}

export default Track;
