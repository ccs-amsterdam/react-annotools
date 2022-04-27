import React, { useState, useEffect } from "react";

// Main pages. Use below in items to include in header menu
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AnnotatorAPIClient from "lib/components/AnnotatorAPIClient/AnnotatorAPIClient";
import DemoJobOverview from "lib/components/DemoJob/DemoJobOverview";
import RedeemToken from "lib/components/RedeemToken/RedeemToken";

import "./appStyle.css";

// just for quick testing
//import AnnotatorRClient from "lib/components/AnnotatorAPIClient/AnnotatorRClient";

const App = () => {
  const [size, setSize] = useState({
    height: window.innerHeight,
    width: document.documentElement.clientWidth,
  });

  useEffect(() => {
    // use window.innerHeight for height, because vh on mobile is weird (can include the address bar)
    // use document.documentElement.clientwidth for width, to exclude the scrollbar
    const onResize = () => {
      setSize({
        height: window.innerHeight,
        width: document.documentElement.clientWidth,
      });
    };
    window.addEventListener("resize", onResize);
    window.screen.orientation.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.screen.orientation.removeEventListener("change", onResize);
    };
  });

  return (
    <Router basename={process.env.PUBLIC_URL}>
      <div style={{ height: `${size.height}px`, width: `${size.width}px` }}>
        <Routes>
          <Route path="/" exact element={<AnnotatorAPIClient />} />
          <Route path="/demo" exact element={<DemoJobOverview />} />
          <Route path="/redeem" exact element={<RedeemToken />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
