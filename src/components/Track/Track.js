import React from 'react';
import './Track.css';
import DoubleClickableTableRow from '../DoubleClickableTableRow';
import {TableRowColumn} from 'material-ui/Table';

class Track extends DoubleClickableTableRow {
    render() {
        const props = Object.assign({}, this.props);
        const style = {height: '32px'};

        if (props.isCurrent) {
            style.fontWeight = 'bold';
        }

        delete props.data;
        delete props.player;
        delete props.index;
        delete props.isCurrent;

        return (
            <DoubleClickableTableRow
                style={style}
                {...props}
                onDoubleTap={() => {this.props.player.switchTo(this.props.index);}}>
                <TableRowColumn style={{height: '32px'}}>{this.props.data.title}</TableRowColumn>
            </DoubleClickableTableRow>
        );
    }
}

export default Track;
