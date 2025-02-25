import PropTypes from "prop-types";
import { useState, useCallback } from "react";

import ReactFlow, {
  addEdge,
  // MiniMap,
  Controls,
  Background,
  useEdgesState,
  useNodesState,
  Handle,
  NodeResizer,
  useStore,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Paper,
} from "@mui/material";

const CustomNode = ({ id, data, selected }) => {
  const { label, color } = data;

  const nodeDimensions = useStore((store) => {
    const node = store.nodeInternals.get(id);
    return { width: node?.width || 100, height: node?.height || 50 };
  });

  // Local state to manage node size
  const [nodeSize, setNodeSize] = useState(nodeDimensions);

  return (
    <div
      style={{
        width: nodeSize.width,
        height: nodeSize.height,
        background: color || "#90EE90", // Default blue
        borderRadius: "5px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #333",
        boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.2)",
        position: "relative",
        fontSize: "8px",
        fontWeight: "bold",
        textAlign: "center",
        padding: "8px",
        pt: "10px",
      }}
    >
      {selected && (
        <NodeResizer
          minWidth={50}
          minHeight={20}
          isVisible={selected}
          onResize={(event, params) => {
            setNodeSize({ width: params.width, height: params.height });
          }}
        />
      )}
      {/* Node Type Label */}
      {/* <div
        style={{
          position: "absolute",
          top: "3px",
          left: "3px",
          background: "#000",
          color: "#FFF",
          padding: "2px 6px",
          borderRadius: "2px",
          fontSize: "6px",
          fontWeight: "bold",
        }}
      >
        {nodeTypeLabel}
      </div> */}

      {/* Main Label */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          width: "100%",
          height: "100%",
          flexWrap: "wrap",
          wordWrap: "break-word",
          overflowWrap: "break-word",
          overflow: "auto",
          textAlign: "center",
          msOverflowStyle: "none", // Hide scrollbar in IE and Edge
          scrollbarWidth: "none", // Hide scrollbar in Firefox
          color: "#242424",
          fontSize: "8px",
        }}
      >
        {label}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const initialNodes = [
  // {
  //   id: "1",
  //   type: "custom",
  //   data: { label: "Login", shape: "circle", color: "#ADD8E6" },
  //   // position: { x: 250, y: 50 },
  // },
  // {
  //   id: "2",
  //   type: "custom",
  //   data: { label: "Check Credentials", shape: "diamond", color: "#90EE90" },
  //   // position: { x: 250, y: 150 },
  // },
  // {
  //   id: "3",
  //   type: "custom",
  //   data: { label: "Dashboard", shape: "rectangle", color: "#D3D3D3" },
  //   // position: { x: 100, y: 250 },
  // },
  // {
  //   id: "4",
  //   type: "custom",
  //   data: { label: "Error Message", shape: "rectangle", color: "#FFA500" },
  //   // position: { x: 400, y: 250 },
  // },
  // {
  //   id: "5",
  //   type: "custom",
  //   data: { label: "End", shape: "circle", color: "#FF0000" },
  //   // position: { x: 250, y: 350 },
  // },
];

const initialEdges = [
  // { id: "e1-2", source: "1", target: "2", label: "Submit", animated: true },
  // { id: "e2-3", source: "2", target: "3", label: "Valid" },
  // { id: "e2-4", source: "2", target: "4", label: "Invalid" },
  // { id: "e3-5", source: "3", target: "5", label: "Logout", animated: true },
];

function getNodeHierarchy(nodes, edges) {
  const hierarchy = {};
  const incomingEdges = {};

  // Initialize hierarchy and track incoming edges
  nodes.forEach((node) => {
    hierarchy[node.id] = [];
    incomingEdges[node.id] = 0;
  });

  // Build hierarchy and count incoming edges
  edges.forEach(({ source, target }) => {
    hierarchy[source].push(target);
    incomingEdges[target] = (incomingEdges[target] || 0) + 1;
  });

  return { hierarchy, incomingEdges };
}

function assignPositions(nodes, edges) {
  const { hierarchy, incomingEdges } = getNodeHierarchy(nodes, edges);
  const nodePositions = {};
  let xSpacing = 200; // Horizontal spacing
  let ySpacing = 100; // Vertical spacing

  // Identify root nodes (nodes with no incoming edges)
  let roots = Object.keys(incomingEdges).filter(
    (nodeId) => incomingEdges[nodeId] === 0
  );

  // Assign positions in a top-down manner (vertical layout)
  function placeNode(nodeId, x, y, visited = new Set()) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    nodePositions[nodeId] = { x, y };

    let children = hierarchy[nodeId] || [];
    let startX = x - ((children.length - 1) * xSpacing) / 2; // Centering children

    children.forEach((childId, index) => {
      placeNode(childId, startX + index * xSpacing, y + ySpacing, visited);
    });
  }

  // Start placement from root nodes
  roots.forEach((rootId, index) => {
    placeNode(rootId, index * xSpacing * 2, 100);
  });

  return nodes.map((node) => ({
    ...node,
    position: nodePositions[node.id] || { x: 100, y: 100 }, // Default if no position assigned
    type: "custom",
  }));
}

const nodesWithPositions = assignPositions(initialNodes, initialEdges);
console.log(nodesWithPositions);

const FlowChart = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithPositions);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeShape, setNodeShape] = useState("rectangle");
  const [edgeLabel, setEdgeLabel] = useState("");
  const [nodeColor, setNodeColor] = useState("#cccccc");
  const [edgeAnimated, setEdgeAnimated] = useState(false);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, label: "" }, eds)),
    [setEdges]
  );
  const addNode = () => {
    const position = { x: event.clientX - 450, y: event.clientY - 100 };
    const newNode = {
      id: (nodes.length + 1).toString(),
      type: "custom",
      data: {
        label: `Node ${nodes.length + 1}`,
        color: "#D3D3D3",
      },
      position,
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = (_, node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label);
    setNodeShape(node.data.shape);
    setNodeColor(node.data.color);
    setSelectedEdge(null);
  };

  const onEdgeClick = (_, edge) => {
    setSelectedEdge(edge);
    setEdgeLabel(edge.label || "");
    setEdgeAnimated(edge.animated || false);
    setSelectedNode(null);
  };

  const applyNodeChanges = () => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                label: nodeLabel,
                // shape: nodeShape,
                color: nodeColor,
              },
            }
          : node
      )
    );
    setSelectedNode(null);
  };

  const applyEdgeChanges = () => {
    if (!selectedEdge) return;
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === selectedEdge.id
          ? { ...edge, label: edgeLabel, animated: edgeAnimated }
          : edge
      )
    );
    setSelectedEdge(null);
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    setSelectedNode(null);
  };

  const deleteEdge = () => {
    if (!selectedEdge) return;
    setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
    setSelectedEdge(null);
  };

  // 🚀 Export Flowchart as JSON
  const exportFlowchart = () => {
    // Extract only the required properties from nodes
    const filteredNodes = nodes.map(({ id, data }) => ({ 
      id, 
      data: { label: data.label } // Only keep the label inside data
    }));
    // Extract only the required properties from edges
    const filteredEdges = edges.map(({ source, target, id }) => ({ source, target, id }));
  
    // Create the JSON structure with filtered nodes and edges
    const flowchartData = JSON.stringify({ nodes: filteredNodes, edges: filteredEdges }, null, 2);
  
    // Export as a JSON file
    const blob = new Blob([flowchartData], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "flowchart.json";
    link.click();
  };
  

  // 📥 Import Flowchart from JSON
  const importFlowchart = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      const nodesWithPositions = assignPositions(data.nodes, data.edges);
      setNodes(nodesWithPositions || []);
      setEdges(data.edges || []);
    };
    reader.readAsText(file);
  };

  // ✅ Drag and Drop Handlers
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (event) => {
    event.preventDefault();

    const type = event.dataTransfer.getData("application/reactflow");
    if (!type) return;

    const position = { x: event.clientX - 450, y: event.clientY - 100 };
    const newNode = {
      id: (nodes.length + 1).toString(),
      type: "custom",
      data: {
        label: `Node ${nodes.length + 1}`,
        color: "#D3D3D3",
      },
      position,
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <Box
        sx={{
          width: "20%",
          p: 2,
          borderRight: "1px solid gray",
          bgcolor: "#f5f5f5",
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#e0e0e0",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "10px",
            "&:hover": {
              background: "#555",
            },
          },
        }}
      >
        {/* Drag Nodes Section */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", gap: "10px" }}>
            <Button
              variant="contained"
              fullWidth
              onClick={exportFlowchart}
              sx={{ mt: 2, width: "50%" }}
            >
              Export JSON
            </Button>

            <Button
              variant="contained"
              component="label"
              sx={{ mt: 2, width: "50%" }}
            >
              Import JSON
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={importFlowchart}
              />
            </Button>
          </Box>
        </Paper>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box
            draggable
            onDragStart={(e) => onDragStart(e, "rectangle")}
            onClick={addNode} 
            sx={{ display: "flex", gap: 2, justifyContent: "center" }}
          >
            <Typography variant="h6">Add Nodes</Typography>
          </Box>
        </Paper>

        {/* Edit Node Section */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Edit Node</Typography>
          <TextField
            label="Label"
            fullWidth
            variant="outlined"
            size="small"
            value={nodeLabel}
            onChange={(e) => setNodeLabel(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">Color:</Typography>
            <input
              type="color"
              value={nodeColor}
              onChange={(e) => setNodeColor(e.target.value)}
            />
          </Box>
          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={applyNodeChanges}>
              Apply
            </Button>
            <Button variant="outlined" color="error" onClick={deleteNode}>
              Delete
            </Button>
          </Box>
        </Paper>

        {/* Edit Link Section */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Edit Link</Typography>
          <TextField
            label="Label"
            fullWidth
            variant="outlined"
            size="small"
            value={edgeLabel}
            onChange={(e) => setEdgeLabel(e.target.value)}
            sx={{ mt: 2 }}
          />
          {/* <FormControlLabel
            control={
              <Checkbox
                checked={edgeAnimated}
                onChange={(e) => setEdgeAnimated(e.target.checked)}
              />
            }
            label="Animated"
            sx={{ mt: 2 }}
          /> */}
          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            <Button variant="contained" onClick={applyEdgeChanges}>
              Apply
            </Button>
            <Button variant="outlined" color="error" onClick={deleteEdge}>
              Delete
            </Button>
          </Box>
        </Paper>

        {/* Export & Import Section */}
      </Box>

      <div style={{ flex: 1 }} onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          fitView
          nodeTypes={nodeTypes}
        >
          {/* <NodeResizer minWidth={100} minHeight={30} /> */}
          <Controls />
          {/* <MiniMap /> */}
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

CustomNode.propTypes = {
  data: PropTypes.shape({
    label: PropTypes.string,
    shape: PropTypes.string,
    color: PropTypes.string,
    width: PropTypes.string,
    height: PropTypes.string,
  }).isRequired,
  selected: PropTypes.bool, // Validate 'selected' prop
  id: PropTypes.string, // Validate 'selected' prop
};

export default FlowChart;
