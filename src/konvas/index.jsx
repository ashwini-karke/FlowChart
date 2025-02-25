import React, { useState, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Path, Text, Arrow } from "react-konva";

const Flowchart = () => {
  const [nodes, setNodes] = useState([
    { id: 1, x: 100, y: 100, label: "Start", type: "circle" },
    { id: 2, x: 300, y: 100, label: "Process", type: "rectangle" },
    { id: 3, x: 500, y: 100, label: "Decision", type: "diamond" },
  ]);

  const [lines, setLines] = useState([
    { from: 1, to: 2 },
    { from: 2, to: 3 },
  ]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [connectingNode, setConnectingNode] = useState(null);

  // Function to add a new node
  const addNode = () => {
    const newNode = {
      id: nodes.length + 1,
      x: 150 + nodes.length * 50,
      y: 200,
      label: `Node ${nodes.length + 1}`,
      type: nodes.length % 2 === 0 ? "rectangle" : "circle",
    };
    setNodes([...nodes, newNode]);
  };

  // Function to delete the selected node
  const deleteNode = () => {
    if (!selectedNode) return;

    setNodes(nodes.filter((node) => node.id !== selectedNode));
    setLines(lines.filter((line) => line.from !== selectedNode && line.to !== selectedNode));

    setSelectedNode(null);
  };

  // Function to connect nodes
  const handleNodeClick = (id) => {
    if (connectingNode === null) {
      setConnectingNode(id);
    } else {
      if (connectingNode !== id) {
        setLines([...lines, { from: connectingNode, to: id }]);
      }
      setConnectingNode(null);
    }
  };

  // Handle node dragging
  const handleDragMove = (e, id) => {
    const { x, y } = e.target.position();
    setNodes(nodes.map(node => (node.id === id ? { ...node, x, y } : node)));
  };

  // Keyboard event for Delete key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete") {
        deleteNode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedNode, nodes, lines]);

  // Function to export JSON
  const exportFlowchart = () => {
    const data = JSON.stringify({ nodes, lines });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flowchart.json";
    a.click();
  };

  // Function to import JSON
  const importFlowchart = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      setNodes(data.nodes || []);
      setLines(data.lines || []);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: "200px", padding: "10px", background: "#f0f0f0" }}>
        <button onClick={addNode} style={{ width: "100%", marginBottom: "10px" }}>
          ➕ Add Node
        </button>
        <button onClick={deleteNode} style={{ width: "100%", marginBottom: "10px" }}>
          🗑️ Delete Node
        </button>
        <button onClick={exportFlowchart} style={{ width: "100%", marginBottom: "10px" }}>
          📤 Export JSON
        </button>
        <input type="file" onChange={importFlowchart} style={{ width: "100%" }} />
      </div>

      {/* Flowchart Canvas */}
      <Stage width={800} height={600} style={{ border: "1px solid #ddd" }}>
        <Layer>
          {/* Render Lines */}
          {lines.map((line, i) => {
            const fromNode = nodes.find(node => node.id === line.from);
            const toNode = nodes.find(node => node.id === line.to);
            return (
              fromNode && toNode && (
                <Arrow
                  key={i}
                  points={[fromNode.x + 50, fromNode.y + 25, toNode.x, toNode.y + 25]}
                  stroke="black"
                  fill="black"
                />
              )
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            let shape;
            if (node.type === "circle") {
              shape = (
                <Circle
                  x={node.x + 50}
                  y={node.y + 25}
                  radius={30}
                  fill={selectedNode === node.id ? "lightblue" : "white"}
                  stroke="black"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => handleDragMove(e, node.id)}
                  onClick={() => handleNodeClick(node.id)}
                />
              );
            } else if (node.type === "diamond") {
              shape = (
                <Path
                  x={node.x + 25}
                  y={node.y}
                  data="M 0 25 L 25 0 L 50 25 L 25 50 Z"
                  fill={selectedNode === node.id ? "lightblue" : "white"}
                  stroke="black"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => handleDragMove(e, node.id)}
                  onClick={() => handleNodeClick(node.id)}
                />
              );
            } else {
              shape = (
                <Rect
                  x={node.x}
                  y={node.y}
                  width={100}
                  height={50}
                  fill={selectedNode === node.id ? "lightblue" : "white"}
                  stroke="black"
                  strokeWidth={2}
                  draggable
                  onDragMove={(e) => handleDragMove(e, node.id)}
                  onClick={() => handleNodeClick(node.id)}
                />
              );
            }

            return (
              <React.Fragment key={node.id}>
                {shape}
                <Text x={node.x + 25} y={node.y + 15} text={node.label} fontSize={16} />
              </React.Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Flowchart;