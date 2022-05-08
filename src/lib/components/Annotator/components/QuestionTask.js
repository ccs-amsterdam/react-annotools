import React, { useState, useEffect, useRef } from "react";
import QuestionForm from "./QuestionForm";
import Document from "../../Document/Document";
import { useSwipeable } from "react-swipeable";
import { codeBookEdgesToMap, getCodeTreeArray } from "../../../functions/codebook";
import { Form, Icon, Input, Popup } from "semantic-ui-react";
import standardizeColor from "../../../functions/standardizeColor";
import swipeControl from "../functions/swipeControl";
import useLocalStorage from "../../../hooks/useLocalStorage";

const documentSettings = {
  centerVertical: true,
};

const QuestionTask = ({ unit, codebook, setUnitIndex, blockEvents, fullScreenNode }) => {
  const [tokens, setTokens] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState(null);
  const refs = {
    text: useRef(),
    box: useRef(),
    code: useRef(),
    positionTracker: useRef({ containerRef: null }),
  };
  const [textReady, setTextReady] = useState(0);
  const [settings, setSettings] = useLocalStorage("questionTaskSettings", {
    splitHeight: 60,
    textSize: 1,
  });
  const divref = useRef(null);

  useEffect(() => {
    if (!codebook?.questions) return;
    setQuestions(prepareQuestions(codebook));
  }, [codebook]);

  useEffect(() => {
    if (!refs?.text.current) return null;
    refs.box.current.style.backgroundColor = "white";
    refs.text.current.style.transition = ``;
    refs.box.current.style.transition = ``;
    refs.box.current.style.opacity = 0;
    refs.text.current.style.transform = "translateX(0%) translateY(0%)";
  }, [refs.text, refs.box, unit, questionIndex]);

  useEffect(() => {
    if (!refs?.text.current) return null;
    refs.box.current.style.transition = `opacity 200ms ease-out`;
    refs.box.current.style.opacity = 1;
  }, [textReady, refs.text, refs.box, questionIndex]);

  // swipe controlls need to be up in the QuestionTask component due to working on the div containing the question screen
  // use separate swipe for text (document) and menu rows, because swiping up in the text is only possible if scrolled all the way down
  const [swipe, setSwipe] = useState(null);
  const textSwipe = useSwipeable(swipeControl(questions?.[questionIndex], refs, setSwipe, false));
  const menuSwipe = useSwipeable(swipeControl(questions?.[questionIndex], refs, setSwipe, true));

  if (!unit) return null;

  // The size of the text div, in pct compared to the answer div
  const splitHeight = unit?.text_window_size ?? settings.splitHeight;

  // if there are only annotinder or confirm questions, minify the answer form
  let minifiedAnswerForm = true;
  const minifiable = ["annotinder", "confirm"];
  for (let question of questions || [])
    if (!minifiable.includes(question.type)) minifiedAnswerForm = false;

  return (
    <div
      ref={divref}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        {...textSwipe}
        style={{
          flex: "1 1 auto",
          position: "relative",
          //height: `${splitHeight}%`,
        }}
      >
        <div
          ref={refs.box}
          style={{
            height: "100%",
            width: "100%",
            overflow: "hidden",
            outline: "1px solid black",
            outlineOffset: "-1px",
            position: "absolute",

            //border: "0.5px solid",
          }}
        >
          {/* This div moves around behind the div containing the document to show the swipe code  */}
          <div
            ref={refs.code}
            style={{ padding: "0.6em 0.3em", width: "100%", fontSize: "3em", position: "absolute" }}
          />
          <div
            ref={refs.text}
            style={{
              height: "100%",
              width: "100%",
              position: "absolute",
              top: "0",
              backgroundColor: "white",
              //overflow: "hidden",
              fontSize: `${settings.textSize}em`,
              boxShadow: "5px 5px 20px 5px",

              //border: "0.5px solid",
            }}
          >
            <Document
              unit={unit}
              settings={documentSettings}
              setReady={setTextReady}
              returnTokens={setTokens}
              fullScreenNode={fullScreenNode}
              positionTracker={refs.positionTracker}
            />
          </div>
        </div>
        <SettingsPopup
          settings={settings}
          setSettings={setSettings}
          fullScreenNode={fullScreenNode}
          cantChangeSplitHeight={minifiedAnswerForm || unit?.text_window_size != null}
        />
      </div>
      <div {...menuSwipe} style={{ height: minifiedAnswerForm ? null : `${100 - splitHeight}%` }}>
        <QuestionForm
          unit={unit}
          tokens={tokens}
          questions={questions}
          questionIndex={questionIndex}
          setQuestionIndex={setQuestionIndex}
          setUnitIndex={setUnitIndex}
          swipe={swipe}
          blockEvents={blockEvents}
        />
      </div>
    </div>
  );
};

const SettingsPopup = ({ settings, setSettings, fullScreenNode, cantChangeSplitHeight }) => {
  return (
    <Popup
      on="click"
      mountNode={fullScreenNode || undefined}
      trigger={
        <Icon
          size="large"
          name="setting"
          style={{
            position: "absolute",

            cursor: "pointer",
            top: "1px",
            left: "2px",
            color: "#1b1c1d",
            padding: "5px 0px",
            height: "30px",
          }}
        />
      }
    >
      <Form>
        <Form.Group grouped>
          {cantChangeSplitHeight ? null : (
            <Form.Field>
              <label>
                text window size <font style={{ color: "blue" }}>{`${settings.splitHeight}%`}</font>
              </label>
              <Input
                size="mini"
                step={2}
                min={20}
                max={80}
                type="range"
                value={settings.splitHeight}
                onChange={(e, d) => setSettings((state) => ({ ...state, splitHeight: d.value }))}
              />
            </Form.Field>
          )}
          <Form.Field>
            <label>
              text size scaling <font style={{ color: "blue" }}>{`${settings.textSize}`}</font>
            </label>
            <Input
              size="mini"
              step={0.025}
              min={0.4}
              max={1.6}
              type="range"
              value={settings.textSize}
              onChange={(e, d) => setSettings((state) => ({ ...state, textSize: d.value }))}
            />
          </Form.Field>
        </Form.Group>
      </Form>
    </Popup>
  );
};

const prepareQuestions = (codebook) => {
  const questions = codebook.questions;
  console.log(questions);
  return questions.map((question) => {
    const fillMissingColor = !["scale"].includes(question.type);
    const codeMap = codeBookEdgesToMap(question.codes, fillMissingColor);
    let cta = getCodeTreeArray(codeMap);
    cta = addRequiredFor([...cta]);
    console.log(cta);
    const [options, swipeOptions] = getOptions(cta);
    return { ...question, options, swipeOptions }; // it's important that this deep copies question
  });
};

const addRequiredFor = (cta) => {
  // if codebook has a required_for question, check if this code has it. If not, it's the same as this code having
  // a makes_irrelevant for this question. This way we only need to process the makes_irrelevant logic (which is easier)
  const haveRequired = cta.reduce((s, code) => {
    if (!code.required_for) return s;
    if (typeof code.required_for !== "object") {
      s.add(code.required_for);
    } else {
      for (let rf of code.required_for) s.add(rf);
    }
    return s;
  }, new Set());

  for (let code of cta) {
    for (let hasReq of haveRequired) {
      if (
        !code.required_for ||
        (code.required_for !== hasReq && !code.required_for.includes(hasReq))
      ) {
        if (!code.makes_irrelevant.includes(hasReq))
          code.makes_irrelevant = [...code.makes_irrelevant, hasReq];
      }
    }
  }
  return cta;
};

const getOptions = (cta) => {
  const options = [];
  const swipeOptions = {}; // object, for fast lookup in swipeControl

  for (let code of cta) {
    if (!code.active) continue;
    if (!code.activeParent) continue;
    let tree = code.tree.join(" - ");
    const option = {
      code: code.code,
      tree: tree,
      makes_irrelevant: code.makes_irrelevant,
      color: standardizeColor(code.color, "88"),
      ref: React.createRef(), // used for keyboard navigation of buttons
    };
    if (code.swipe) swipeOptions[code.swipe] = option;
    options.push(option);
  }
  console.log(swipeOptions);
  // if swipe options for left and right are not specified, use order.
  if (!swipeOptions.left && !swipeOptions.right) {
    swipeOptions.left = options?.[0];
    swipeOptions.right = options?.[1];
    swipeOptions.up = options?.[2];
  }
  return [options, swipeOptions];
};

export default React.memo(QuestionTask);
