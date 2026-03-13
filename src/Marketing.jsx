import React from "react";

export default function Marketing() {
  return (
    <div style={{ padding: 20 }}>
      <h1>📣 Marketing</h1>

      <textarea
        style={{
          width: "100%",
          height: "400px",
          padding: "10px",
          borderRadius: "8px"
        }}
        placeholder="Planejamento de marketing da oficina..."
      />
    </div>
  );
}