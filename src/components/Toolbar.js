// components/Toolbar.jsx
import React from "react";

const Toolbar = ({
  addPoint,
  clusterElements,
  toggleManualMode,
  handleZoomIn,
  handleZoomOut,
  width,
  height,
}) => {
  return (
    <div style={{ padding: "20px" }}>
      <button
        onClick={() =>
          addPoint("red", Math.random() * width, Math.random() * height)
        }
      >
        Add Random Red
      </button>
      <button
        onClick={() =>
          addPoint("yellow", Math.random() * width, Math.random() * height)
        }
      >
        Add Random Yellow
      </button>
      <button
        onClick={() =>
          addPoint("green", Math.random() * width, Math.random() * height)
        }
      >
        Add Random Green
      </button>
      <button onClick={clusterElements}>Cluster Points</button>
      <button onClick={toggleManualMode}>
        {toggleManualMode ? "Cancel Manual" : "Add Manually"}
      </button>
      <button onClick={handleZoomIn}>Zoom In (+)</button>
      <button onClick={handleZoomOut}>Zoom Out (-)</button>
    </div>
  );
};

export default Toolbar;
