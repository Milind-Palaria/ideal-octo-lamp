// components/ManualModeSelector.jsx
import React from "react";

const ManualModeSelector = ({ selectedColor, setSelectedColor }) => {
  const colors = ["red", "yellow", "green"];
  return (
    <div
      style={{
        padding: "10px",
        border: "1px solid #ccc",
        margin: "10px",
        width: "200px",
      }}
    >
      <p>Select Color:</p>
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => setSelectedColor(color)}
          style={{
            backgroundColor: color,
            color: color === "yellow" ? "black" : "white",
            margin: "5px",
            border:
              selectedColor === color ? "3px solid #000" : "1px solid #ccc",
          }}
        >
          {color.charAt(0).toUpperCase() + color.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default ManualModeSelector;
