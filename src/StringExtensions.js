const START_DELIMITER = "${";
const END_DELIMITER = "}";

const ANONYMOUS_PARAMETER = "?";

const stringifyTemplate = function (template) {
    const splitTemplateSQL = template.split("\n");
    const stringifiedTemplateSQL = [];

    //check if there is any line in the template string that's not null or empty and, if there is, iterate all elements
    if (splitTemplateSQL.some((value) => {
        return value;
    })) {
        splitTemplateSQL.forEach((templateSQLLine, iLineNumber) => {  
            let iLineCharacterIndex = 0;
            let startCopyIndex = 0;

            const templateParts = [];

            while (iLineCharacterIndex < templateSQLLine.length) {
                const endDelimiterIndex = templateSQLLine.indexOf(END_DELIMITER, iLineCharacterIndex);

                //check if the current template index is greater than the minimum number of characters to represent a template variable
                if (iLineCharacterIndex === templateSQLLine.length - 1) {
                    templateParts.push("\"" + templateSQLLine.substring(startCopyIndex) + "\"");
                    iLineCharacterIndex = templateSQLLine.length;
                }
                //otherwise check if the sequence at the current index matches the START_DELIMITER and that the END_DELIMITER occurs someplace after the current index
                else if (templateSQLLine.substring(iLineCharacterIndex, iLineCharacterIndex + START_DELIMITER.length) === START_DELIMITER && endDelimiterIndex >= 0) {
                    if (startCopyIndex !== iLineCharacterIndex) {
                        templateParts.push("\"" + templateSQLLine.substring(startCopyIndex, iLineCharacterIndex) + "\"");
                    }

                    templateParts.push(templateSQLLine.substring(iLineCharacterIndex + START_DELIMITER.length, endDelimiterIndex));

                    iLineCharacterIndex = endDelimiterIndex + END_DELIMITER.length;
                    startCopyIndex = endDelimiterIndex + END_DELIMITER.length;
                }
                else
                    //otherwise move on to the next character
                    iLineCharacterIndex++;
            }

            let strTemplateSQL;
            if (templateParts.length > 0) {
                if (iLineNumber > 0)
                    templateParts.splice(0, 0, "");
                
                strTemplateSQL = templateParts.join(" + ");
            }
            else
                strTemplateSQL = "";

            stringifiedTemplateSQL.push(strTemplateSQL);
        });
    }
    else
        return "";

    //const rejoinedTemplateSQL = stringifiedTemplateSQL.join(" + \"\\n\"\n");
    const rejoinedTemplateSQL = stringifiedTemplateSQL.map((sqlLine, iLineNumber) => {
        if (iLineNumber !== stringifiedTemplateSQL.length - 1) {
            if (iLineNumber === 0 && !sqlLine)
                return sqlLine + "\"\\n\"\n";
            else
                return sqlLine + " + \"\\n\"\n";
        }
        else
            return sqlLine;
    }).join("");
    
    return rejoinedTemplateSQL;
}

const stringInterpolate = function (template, params) {
    let interpolatedString = "";
    let iTemplateCharacterIndex = 0;

    let iAnonymousParameter = 0;

    //replace ? characters
    while (iTemplateCharacterIndex < template.length) {
        const endDelimiterIndex = template.indexOf(END_DELIMITER, iTemplateCharacterIndex);

        if (template.substring(iTemplateCharacterIndex, iTemplateCharacterIndex + ANONYMOUS_PARAMETER.length) === ANONYMOUS_PARAMETER) {
            const anonymousParameter = params.anonymousParameters[iAnonymousParameter];
            interpolatedString += anonymousParameter;

            iAnonymousParameter++;
            iTemplateCharacterIndex += ANONYMOUS_PARAMETER.length;
        }
        else if (template.substring(iTemplateCharacterIndex, iTemplateCharacterIndex + START_DELIMITER.length) === START_DELIMITER && endDelimiterIndex >= 0) {
            const keyStartIndex = iTemplateCharacterIndex + START_DELIMITER.length;
            const keyEndIndex = endDelimiterIndex;

            let originalKey = template.substring(keyStartIndex, keyEndIndex);
            let strippedKey = originalKey;
            if (originalKey.substring(originalKey.length - "()".length) === "()")
                strippedKey = originalKey.substring(0, originalKey.length - "()".length);

            if (strippedKey in params) {
                interpolatedString += params[strippedKey];
            }
            else {
                interpolatedString += template.substring(iTemplateCharacterIndex + START_DELIMITER.length, endDelimiterIndex);
            }

            iTemplateCharacterIndex = endDelimiterIndex + END_DELIMITER.length;
        }
        else {
            interpolatedString += template[iTemplateCharacterIndex];
            iTemplateCharacterIndex++;
        }
    }

    return interpolatedString;
};

const variableNameRegExp = new RegExp("[a-zA-Z]", "g");
const getStringSQLVariableName = function(stringSQL) {
    const variableNameStartIndex = stringSQL.search(variableNameRegExp);
    let variableName = "";

    if (variableNameStartIndex >= 0) {
        let variableNameEndIndex = stringSQL.indexOf(" ", variableNameStartIndex + 1);
        if (variableNameEndIndex === -1)
            variableNameEndIndex = stringSQL.length;

        variableName = stringSQL.substring(variableNameStartIndex, variableNameEndIndex);
    }

    return variableName
}
const wrapStringSQLVariable = function(stringSQL, candidateStartIndex, candidateEndIndex) {
    const candidateString = stringSQL.substring(candidateStartIndex, candidateEndIndex);
    const variableName = getStringSQLVariableName(candidateString);

    if (variableName) {
        const variableStartIndex = stringSQL.indexOf(variableName, candidateStartIndex);
                
        const wrappedVariableName = "${" + variableName + "}";
        
        stringSQL = stringSQL.substring(0, variableStartIndex) + wrappedVariableName + stringSQL.substring(variableStartIndex + variableName.length);
    }

    return stringSQL;
}

const cleanStringSQL = function (stringSQL) {
    //replace string segments which are not wrapped in quotation marks
    const splitStringSQL = stringSQL.split("+");
    splitStringSQL.forEach((splitStringSQLElement, index) => {
        const trimmedStringSQLElement = splitStringSQLElement.trim();

        if (trimmedStringSQLElement.length > 0 && trimmedStringSQLElement.charAt(0) !== "\"" && trimmedStringSQLElement.charAt(trimmedStringSQLElement.length - 1) !== "\"") {
            const wrappedTemplateSQL = wrapStringSQLVariable(splitStringSQLElement, 0, splitStringSQLElement.length);
            splitStringSQL[index] = wrappedTemplateSQL;
        }
    });

    stringSQL = splitStringSQL.join("+");
    
    return stringSQL
        .replace(new RegExp("\\\\r", "g"), "")
        .replace(new RegExp("\\\\n", "g"), "")
        .replace(new RegExp("\\ \\+\\ ", "g"), "")
        .replace(new RegExp("\\ \\+", "g"), "")
        .replace(new RegExp("\"", "g"), "")
    
    // return stringSQL.replace(new RegExp("^(\\\\r|\\\\n|\\ \\+\\ |\\ \\+|\"|\\(|\\))", "g"), "")
};

export { stringInterpolate, stringifyTemplate, cleanStringSQL };