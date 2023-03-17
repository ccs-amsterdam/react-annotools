import React, { useState, useEffect, CSSProperties } from "react";
import AnnotateNavigation from "./components/AnnotateNavigation";
import Body from "./components/Body";
import useCodeSelector from "./hooks/useCodeSelector";
import useRelationSelector from "./hooks/useRelationSelector";
import useUnit from "./hooks/useUnit";
import SelectVariable from "./components/SelectVariable";

import useVariableMap from "./components/useVariableMap";
import {
  Variable,
  VariableMap,
  Unit,
  Annotation,
  SpanAnnotations,
  Token,
  SetState,
  VariableValueMap,
} from "../../types";
import { useCallback } from "react";
import styled from "styled-components";

const DocumentContainer = styled.div`
  display: flex;
  position: relative;
  height: 100%;
  max-height: 100%;
  flex-direction: column;
  color: var(--text);
  background: var(--background);
  z-index: 100;
  font-size: var(--font-size);
`;

interface DocumentProps {
  /** A unit object, as created in JobServerClass (or standardizeUnit) */
  unit: Unit;
  /** An array of annotations */
  annotations: Annotation[];
  /** An array of variables */
  variables?: Variable[];
  /** A VariableValueMap with codes per variable. If given, only these codes
   *  can be used
   */
  restrictedCodes?: VariableValueMap;
  /** An object with settings. Supports "editAll" (and probably more to come) */
  settings?: {
    [key: string]: any;
    editAll?: boolean;
  };
  /** If true, always show all annotations. This makes sense if the annotations property
   * is already the selection you need. But when coding multiple variables, it can be
   * better to set to false, so coders only see annotations of the variable they're working on
   */
  showAll?: boolean;
  /** for getting acces to annotations from the parent component
   *  If not given, Document is automatically in read only mode (i.e. cannot make annotations) */
  onChangeAnnotations?: (value: Annotation[]) => void;
  /** for getting access to the tokens from the parent component  */
  returnTokens?: SetState<Token[]>;
  /** returnVariableMap */
  returnVariableMap?: SetState<VariableMap>;
  /** A callback function that is called when the document is ready. This is mainly usefull for
   * managing layout while waiting for document to load
   */
  onReady?: Function;
  /** a boolean value for blocking all event listeners */
  blockEvents?: boolean;
  /** Names of fields to focus on, or Annotation objects to focus on */
  focus?: string[];
  /** Should the text be centered? */
  centered?: boolean;
  /** CSSProperties for the body container  */
  bodyStyle?: CSSProperties;
}

/**
 * This is hopefully the only Component in this folder that you'll ever see. It should be fairly isolated
 * and easy to use, but behind the scenes it gets dark real fast.
 */
const Document = ({
  unit,
  annotations,
  variables,
  restrictedCodes,
  settings,
  showAll,
  onChangeAnnotations,
  returnTokens,
  returnVariableMap,
  onReady,
  blockEvents,
  focus,
  centered,
  bodyStyle,
}: DocumentProps) => {
  const [variable, setVariable] = useState(null);

  const unitStates = useUnit(unit, annotations, returnTokens, onChangeAnnotations);
  const [variableMap, showValues, variableType, editMode] = useVariableMap(
    variables,
    variable,
    restrictedCodes
  );

  const [codeSelector, triggerCodeSelector, codeSelectorOpen] = useCodeSelector(
    unitStates,
    variableMap,
    editMode,
    variables
  );
  const [relationSelector, triggerRelationSelector, relationSelectorOpen] = useRelationSelector(
    unitStates,
    variableMap?.[variable]
  );

  useEffect(() => {
    if (returnVariableMap) returnVariableMap(variableMap);
  }, [variableMap, returnVariableMap]);

  const setSpanAnnotations = unitStates.annotationManager.setSpanAnnotations;
  const onBodyReady = useCallback(() => {
    if (onReady) onReady();
    setSpanAnnotations((spanAnnotations: SpanAnnotations) => ({ ...spanAnnotations })); //trigger DOM update after token refs have been prepared
  }, [onReady, setSpanAnnotations]);

  if (!unitStates.doc.tokens && !unitStates.doc.image_fields) return null;

  const triggerSelectionPopup =
    variableType === "relation" ? triggerRelationSelector : triggerCodeSelector;
  const selectorOpen = variableType === "relation" ? relationSelectorOpen : codeSelectorOpen;
  const selector = variableType === "relation" ? relationSelector : codeSelector;

  const annotationMode = variableType === "relation" ? "relationMode" : "spanMode";

  return (
    <DocumentContainer className={`${annotationMode} ${(editMode && "editMode") || ""}`}>
      <SelectVariable
        variables={variables}
        variable={variable}
        setVariable={setVariable}
        editAll={settings?.editAll}
      />
      <Body
        tokens={unitStates.doc.tokens}
        text_fields={unitStates.doc.text_fields}
        meta_fields={unitStates.doc.meta_fields}
        image_fields={unitStates.doc.image_fields}
        markdown_fields={unitStates.doc.markdown_fields}
        grid={unitStates.doc.grid}
        onReady={onBodyReady}
        bodyStyle={bodyStyle}
        focus={focus}
        centered={centered}
        readOnly={!onChangeAnnotations}
      />

      <AnnotateNavigation
        tokens={unitStates.doc.tokens}
        spanAnnotations={unitStates.spanAnnotations}
        relationAnnotations={unitStates.relationAnnotations}
        variable={variableMap?.[variable]}
        variableType={variableType}
        showValues={showValues}
        disableAnnotations={!onChangeAnnotations || !variableMap}
        editMode={editMode}
        triggerSelectionPopup={triggerSelectionPopup}
        eventsBlocked={selectorOpen || blockEvents}
        showAll={showAll}
      />

      {selector || null}
    </DocumentContainer>
  );
};

export default React.memo(Document);
