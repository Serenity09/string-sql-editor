import React, { useState, useEffect, useRef } from 'react'

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

import './app.scss';

import { stringInterpolate, cleanStringSQL, stringifyTemplate } from './StringExtensions'

function App() {
  const [ stringSQL, setStringSQL ] = useState("");
  const stringSQLRef = useRef(null);

  const [ templateSQL, setTemplateSQL ] = useState("");
  const templateSQLRef = useRef(null);
  const [ anonymousReferences, setAnonymousReferences ] = useState([]);

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

  // const START_DELIMITER = "${";
  // const END_DELIMITER = "}";

  // const ANONYMOUS_PARAMETER = "?";

  useEffect(() => {
    // const stringifyTemplateSQL = function(value) {
    //   const splitTemplateSQL = value.split("\n");
    //   const stringifiedTemplateSQL = [];
  
    //   if (splitTemplateSQL.some((value) => {
    //     return value;
    //   })) {
    //     splitTemplateSQL.forEach((templateSQLLine) => {  
    //       const stringifiedTemplateSQLLine = [];

    //       if (templateSQLLine) {
    //         let iTemplateCharacterIndex = 0;
    //         let startCopyIndex = 0;

    //         const templateParts = [];
    //         const template = templateSQLLine;

    //         while (iTemplateCharacterIndex < template.length) {
    //             const endDelimiterIndex = template.indexOf(END_DELIMITER, iTemplateCharacterIndex);

    //             //check if the current template index is greater than the minimum number of characters to represent a template variable
    //             if (iTemplateCharacterIndex >= template.length - START_DELIMITER.length - END_DELIMITER.length - 1) {
    //                 templateParts.push("\"" + template.substring(startCopyIndex) + "\"");
    //                 iTemplateCharacterIndex = template.length;
    //             }
    //             //otherwise check if the sequence at the current index matches the START_DELIMITER and that the END_DELIMITER occurs someplace after the current index
    //             else if (template.substring(iTemplateCharacterIndex, iTemplateCharacterIndex + START_DELIMITER.length) === START_DELIMITER && endDelimiterIndex >= 0) {
    //                 if (startCopyIndex !== iTemplateCharacterIndex) {
    //                     templateParts.push("\"" + template.substring(startCopyIndex, iTemplateCharacterIndex) + "\"");

    //                     startCopyIndex = endDelimiterIndex + END_DELIMITER.length;
    //                 }

    //                 templateParts.push(template.substring(iTemplateCharacterIndex + START_DELIMITER.length, endDelimiterIndex));

    //                 iTemplateCharacterIndex = endDelimiterIndex + END_DELIMITER.length;
    //             }
    //             else
    //             //otherwise move on to the next character
    //                 iTemplateCharacterIndex++;
    //         }

    //         let strTemplateSQL;
    //         if (templateParts.length > 0)
    //           strTemplateSQL = templateParts.join(" + ");
    //         else
    //           strTemplateSQL = "";
                        
    //         stringifiedTemplateSQLLine.push(strTemplateSQL);
    //       }
  
    //       if (stringifiedTemplateSQLLine.length > 0) {
    //         const joinedStrTemplateSQL = stringifiedTemplateSQLLine.join(" + ");
            
    //         stringifiedTemplateSQL.push(joinedStrTemplateSQL);
    //       }
    //     });
    //   }
  
    //   return stringifiedTemplateSQL.join(" + \"\\n\" +\n");
    // }
    
    if (activeEditor !== null && templateSQLRef.current === activeEditor) {
      const joinedStringSQL = stringifyTemplate(templateSQL);
      setStringSQL(joinedStringSQL);
    }

    const nativeSQL = stringInterpolate(templateSQL, rootContext);
    // const nativeSQL2 = fillTemplate(templateSQL, rootContext);
    // console.log("nativeSQL2", nativeSQL2);
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

      console.log("string SQL changed", stringSQL);
      console.log("cleaned", cleanedSQL);
      //TODO update template string editor based on string SQL
      setTemplateSQL(cleanedSQL);
    }
  }, [activeEditor, rootContext.anonymousParameters, stringSQL]);

  const onFocus = function(evt) {
    setActiveEditor(evt.target);
  }
  const onBlur = function(evt) {
    setActiveEditor(null);
  }

  return (
    <Form className="h-100">
      <Container className="app-container h-100" fluid>
        <h1 className="mb-3">string-sql-editor</h1>
        <Row className="editor-row">
          <Col>
            <Form.Group controlId="applicationStringSQLInput" className="h-100">
              <Form.Label>IO Application String SQL</Form.Label>
              <Form.Control ref={stringSQLRef} as="textarea" placeholder="Copy and paste application string SQL to and from here"
                value={stringSQL}
                onChange={onStringSQLChange}
                onFocus={onFocus}
                onBlur={onBlur} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="applicationStringSQLInput" className="h-100">
              <Form.Label>Template SQL Editor</Form.Label>
              <Form.Control ref={templateSQLRef} as="textarea" placeholder="Edit a more minimal view of application string SQL here. &#10;This view allows for references to Java variables available in the runtime context"
                value={templateSQL}
                onChange={onTemplateSQLChange}
                onFocus={onFocus}
                onBlur={onBlur} />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="applicationStringSQLInput" className="h-100">
              <Form.Label>SQL View</Form.Label>
              <Form.Control as="textarea" placeholder="Valid SQL will be generated here. &#10;References to Java variables will be replaced using the selected context" readOnly
                value={nativeSQL} />
            </Form.Group>
          </Col>
        </Row>
      </Container>
    </Form>
  );
}

export default App;
