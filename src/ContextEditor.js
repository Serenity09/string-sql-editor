import React, { useState } from 'react'

import Form from 'react-bootstrap/Form'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

function ContextEditor(props) {
    function onEditorChange(evt) {
        props.setEditorText(evt.target.value);
    }

    return (
        <Form className="h-100">
            <Row>
                <Col>
                <Form.Group controlId="applicationStringSQLInput" className="h-100">
                    <Form.Label>Root Context Editor</Form.Label>
                    <Form.Control as="textarea" placeholder="Edit variables representing an application context as Json"
                        value={props.editorText}
                        onChange={onEditorChange} 
                        rows={10}
                    />
                </Form.Group>
                </Col>
            </Row>
        </Form>
    )
}

export default ContextEditor;