import React, { useState, useEffect, useRef } from 'react'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

import './app.scss';

import Editor from './Editor'
import ContextEditor from './ContextEditor'
import { stringInterpolate, cleanStringSQL, stringifyTemplate } from './StringExtensions'

function App() {
  const [ stringSQL, setStringSQL ] = useState("");
  const stringSQLRef = useRef(null);

  const [ templateSQL, setTemplateSQL ] = useState("");
  const templateSQLRef = useRef(null);

  const [ nativeSQL, setNativeSQL ] = useState("");

  const [ activeEditor, setActiveEditor ] = useState(null);

  const [ rootContext, setRootContext ] = useState({
    siteCD: "PV.SITE_CD = 640",
    COVID_PCR_TEST_NAMES: ["'COVID-19 (PHRL)'", "'COVID-19 (VAPAHCS-ABBOTT)'", "'COVID-19 (VAPAHCS-CEPHEID)'", "'COVID-19 CONFIRMATORY (PHRL)'",
      "'COVID-19 CONFIRMATORY (VAPACHS-ABBOTT)'", "'COVID-19 CONFIRMATORY (VAPAHCS-CEPHEID)'",
      "'NOVEL CORONAVIRUS 2019 RRT PCR (PHRL)'", "'COVID-19 (ABBOTT)'", "'COVID-19 (BIOFIRE)'", "'COVID-19 (CEPHEID)'",
      "'COVID-19 (PHRL8761)'", "'COVID-19 PCR (FLUVID)'"
    ],
    covidStatusExpr:
      "CASE " +
          "WHEN POS_BEFORE_ADM.PTNT_IDNTFR IS NOT NULL OR POS_DURING_ADM.PTNT_IDNTFR IS NOT NULL THEN 'COVID+' " +
          "WHEN PUI.PTNT_IDNTFR IS NOT NULL THEN 'PUI' " +
          "ELSE 'Non-COVID' " +
      "END",
    dateExpr: "TO_CHAR(TRUNC(ADM.ADMSN_DT, 'IW') - 1, 'YYYY-MM-DD')",
    getPatientTypeFilterExpr: "AND ((P.PSBLY_VTRN_FLG = 'Y' AND P.PSBLY_VTRN_EMP_FLG = 'N' AND P.PSBLY_EMP_FLG = 'N') OR ((P.PSBLY_VTRN_FLG = 'Y' AND P.PSBLY_EMP_FLG = 'Y') OR P.PSBLY_VTRN_EMP_FLG = 'Y') OR (P.PSBLY_EMP_FLG = 'Y' AND P.PSBLY_VTRN_FLG = 'N' AND P.PSBLY_VTRN_EMP_FLG = 'N'))",

    anonymousParameters: [
      640,
      640,
      "'2020-01-01 00:00:00'",
      "'2021-12-31 23:59:59'"
    ],

    stringJoinImplementation: "line-ending"
  });

  const onStringSQLChange = function(evt) {
    setStringSQL(evt.target.value);
  }

  useEffect(() => {
    if (activeEditor !== null && templateSQLRef.current === activeEditor) {
      const joinedStringSQL = stringifyTemplate(templateSQL);
      setStringSQL(joinedStringSQL);
    }

    const nativeSQL = stringInterpolate(templateSQL, rootContext);
    setNativeSQL(nativeSQL);
  }, [activeEditor, rootContext, templateSQL]);

  const onTemplateSQLChange = function(evt) {
    setTemplateSQL(evt.target.value);
  }

  useEffect(() => {
    const stringToTemplateSQL = function(value) {
      const splitStringSQL = value.split("\n");
      const templateSQLLines = [];
  
      if (splitStringSQL[0]) {
        splitStringSQL.forEach((stringSQLLine, lineNumber) => {  
          const templateSQLLine = [];

          if (stringSQLLine) {
            const strTemplateSQL = cleanStringSQL(stringSQLLine, rootContext.anonymousParameters);
            templateSQLLine.push(strTemplateSQL);
          }
  
          if (templateSQLLine.length > 0) {
            const joinedTemplateSQL = templateSQLLine.join(" ");
            templateSQLLines.push(joinedTemplateSQL);
          }
        });
      }
  
      return templateSQLLines.join("\n");
    }
    
    if (activeEditor !== null && stringSQLRef.current === activeEditor) {
      const cleanedSQL = stringToTemplateSQL(stringSQL);

      //update template string editor based on string SQL
      setTemplateSQL(cleanedSQL);
    }
  }, [activeEditor, rootContext.anonymousParameters, stringSQL]);

  const onFocus = function(evt) {
    setActiveEditor(evt.target);
  }
  const onBlur = function(evt) {
    setActiveEditor(null);
  }

  const [ isContextEditorVisible, setContextEditorVisible ] = useState(false);
  const [ contextEditorText, setContextEditorText ] = useState("");

  const closeContextEditor = () => setContextEditorVisible(false);
  const openContextEditor = () => {
    setContextEditorText(JSON.stringify(rootContext, null, 2));
    setContextEditorVisible(true); 
  }
  
  const onContextEditorSave = () => {
    try {
        const jsonContext = JSON.parse(contextEditorText);

        if (jsonContext) {
            setRootContext(jsonContext);
        }
    }
    catch (err) {
        
    }

    closeContextEditor();
  }

  return (
    <>
      <Form className="h-100">
        <Container className="app-container h-100" fluid>
          <Row>
            <Col className="header-container">
              <h1 className="mb-3">string-sql-editor</h1>
              <div className="button-container">
                <Button onClick={openContextEditor} variant="primary">Context Editor</Button>
              </div>
            </Col>
          </Row>
          <Row className="editor-row">
            <Col>
              <Editor controlId="applicationStringSQLInput" 
                label="IO Application String SQL"
                controlRef={stringSQLRef}
                placeholder="Copy and paste application string SQL to and from here"
                value={stringSQL}
                onChange={onStringSQLChange}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Col>
            <Col>
              <Editor controlId="applicationTemplateSQLInput" 
                label="Template SQL Editor"
                controlRef={templateSQLRef}
                placeholder="Edit a more minimal view of application string SQL here. &#10;This view allows for references to Java variables available in the runtime context"
                value={templateSQL}
                onChange={onTemplateSQLChange}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </Col>
            <Col>
              <Editor controlId="applicationSQLOutput"
                label="SQL View"
                placeholder="Valid SQL will be generated here. &#10;References to Java variables will be replaced using the selected context"
                value={nativeSQL}
                disabled="disabled"
              />
            </Col>
          </Row>
        </Container>
      </Form>
      <Modal 
        show={isContextEditorVisible} 
        onHide={closeContextEditor}
        backdrop="static"
        keyboard={false}
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>Context Editor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ContextEditor
            editorText={contextEditorText}
            setEditorText={setContextEditorText}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeContextEditor}>
            Close
          </Button>
          <Button variant="primary" onClick={onContextEditorSave}>Save</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default App;
