import { useState, useEffect } from "react";
import { prepareDocument } from "../../../functions/createDocuments";

const useUnit = (unit, safetyCheck, returnTokens, setCodeHistory) => {
  const [preparedUnit, setPreparedUnit] = useState({});
  const [annotations, setAnnotations] = useState();
  const [importedCodes, setImportedCodes] = useState({});

  useEffect(() => {
    if (!unit?.text && !unit.text_fields && !unit.tokens) return null;

    if (!unit.annotations) unit.annotations = [];
    if (unit.importedAnnotations) {
      if (unit.annotations.length === 0 && unit.status !== "DONE") {
        unit.annotations = unit.importedAnnotations;
      }
      const importedCodes = {};
      for (let a of unit.importedAnnotations) {
        if (!importedCodes[a.variable]) importedCodes[a.variable] = {};
        if (!importedCodes[a.variable][a.value]) importedCodes[a.variable][a.value] = true;
      }
      setImportedCodes(importedCodes);
    }

    initializeCodeHistory(unit.annotations, setCodeHistory);

    const document = prepareDocument(unit);
    safetyCheck.current = {
      tokens: document.tokens,
      //annotationsChanged: false,
      //annotations: hash(document.annotations),
    };
    setPreparedUnit({
      tokens: document.tokens,
      text_fields: document.text_fields,
      meta_fields: document.meta_fields,
    });

    setAnnotations(document.annotations);
    if (returnTokens) returnTokens(document.tokens);
  }, [unit, returnTokens, safetyCheck, setCodeHistory, setImportedCodes]);

  // if returnAnnotations is falsy (so not passed to Document), make setAnnotations
  // falsy as well. This is used further down as a sign that annotations are disabled
  return [preparedUnit, annotations, setAnnotations, importedCodes];
};

const initializeCodeHistory = (annotations, setCodeHistory) => {
  const ch = {};

  for (let annotation of annotations) {
    if (!ch[annotation.variable]) ch[annotation.variable] = new Set();
    ch[annotation.variable].add(annotation.value);
  }

  for (let key of Object.keys(ch)) {
    ch[key] = [...ch[key]];
  }
  setCodeHistory(ch);
};

export default useUnit;
