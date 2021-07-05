import { useEffect } from 'react';
import Form from 'react-bootstrap/Form'

function Editor(props) {
    function onCopyClick() {
        if (props.value)
            navigator.clipboard.writeText(props.value);
    }

    useEffect(() => {
        if (props.controlRef) {
            props.controlRef.current.scrollTop = props.scrollPosition;
        }
    }, [props.controlRef, props.scrollPosition]);

    return (
        <Form.Group controlId={props.controlId} className="h-100">
            <Form.Label>{props.label} <i class="icon-docs" onClick={onCopyClick}></i></Form.Label>
            <Form.Control ref={props.controlRef} as="textarea" placeholder={props.placeholder}
                value={props.value}
                onChange={props.onChange}
                onFocus={props.onFocus}
                onBlur={props.onBlur}
                disabled={props.disabled}
                onScroll={props.onScroll}
            />
        </Form.Group>
    );
}

export default Editor;