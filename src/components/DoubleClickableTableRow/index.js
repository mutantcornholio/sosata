import React, { Component } from 'react';
import './index.css';
import {TableRow} from 'material-ui/Table';

const DOUBLETAP_INTERVAL = 350;

class DoubleClickableTableRow extends Component {
    waitingForSecondClick = false;
    waitingTimeout = null;

    clearClickTimeout = () => {
        this.waitingForSecondClick = false;
        clearTimeout(this.waitingTimeout);
        this.waitingTimeout = null;
    };

    render() {
        let props = Object.assign({}, this.props);
        let singleTap = props.onTouchTap;
        delete props.onTouchTap;
        delete props.onDoubleTap;

        props.onTouchTap = () => {
            if (this.waitingForSecondClick) {
                this.clearClickTimeout();

                if (this.props.onDoubleTap) {
                    this.props.onDoubleTap();
                }
            } else {
                if (singleTap) {
                    singleTap();
                }

                this.waitingForSecondClick = true;
                this.waitingTimeout = setTimeout(this.clearClickTimeout, DOUBLETAP_INTERVAL);
            }
        };

        return (
            <TableRow {...props}>
                {this.props.children}
            </TableRow>
        )
    }
}

export default DoubleClickableTableRow;
