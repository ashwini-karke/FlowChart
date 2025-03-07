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
  Paper,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  IconButton,
} from "@mui/material";
import {
  FormatSize,
  TextFormat,
  FormatBold,
  FormatItalic,
  Palette,
  Delete,
} from "@mui/icons-material";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import FontDownloadIcon from "@mui/icons-material/FontDownload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const CustomNode = ({ id, data, selected }) => {
  const {
    label,
    bgColor,
    fontSize,
    fontWeight,
    fontStyle,
    fontFamily,
    fontColor,
  } = data;

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
        background: bgColor || "#D3D3D3", // Default blue
        borderRadius: "6px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #ccc",
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
          color: fontColor || "#242424",
          fontSize: fontSize || "8px",
          fontWeight: fontWeight || "normal",
          fontStyle: fontStyle || "normal",
          fontFamily: fontFamily || "Arial",
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

const initialNodes = [];

const initialEdges = [];

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
  const [selectedNode, setSelectedNode] = useState([]);
  const [selectedEdge, setSelectedEdge] = useState([]);
  const [nodeLabel, setNodeLabel] = useState("");
  const [edgeLabel, setEdgeLabel] = useState("");
  const [nodeColor, setNodeColor] = useState("#D3D3D3");
  const [edgeAnimated, setEdgeAnimated] = useState(false);
  const [nodeFontStyle, setNodeFontStyle] = useState({
    fontSize: "12px",
    fontWeight: "normal",
    fontStyle: "",
    fontFamily: "Arial",
    fontColor: "#ccc",
    bgColor: "#D3D3D3",
  });

  const [edgeFontStyle, setEdgeFontStyle] = useState({
    fontSize: "12px",
    fontWeight: "normal",
    fontStyle: "normal",
    fontFamily: "Arial",
  });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const handleNodeStyleChange = (property, value) => {
    console.log(value, "value");
    if (!selectedNode || selectedNode.length === 0) return;

    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        selectedNode.some((n) => n.id === node.id)
          ? { ...node, data: { ...node.data, [property]: value } }
          : node
      )
    );

    // Update labels for selected nodes
    if (property === "label") {
      setNodeLabel(value); // Store full value instead of appending character by character
    }
  };

  //--------------------Undo-Redo--------------
  // Function to update history before making changes
  const saveState = () => {
    setHistory((prev) => [...prev, { nodes, edges }]);
    setRedoStack([]); // Clear redo stack on new action
  };

  // Undo function
  const undo = () => {
    if (history.length === 0) return;

    const lastState = history[history.length - 1];
    setRedoStack((prev) => [...prev, { nodes, edges }]); // Save current state to redoStack
    setNodes(lastState.nodes);
    setEdges(lastState.edges);
    setHistory((prev) => prev.slice(0, -1)); // Remove last state
  };

  // Redo function
  const redo = () => {
    if (redoStack.length === 0) return;

    const nextState = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, { nodes, edges }]); // Save current state to history
    setNodes(nextState.nodes);
    setEdges(nextState.edges);
    setRedoStack((prev) => prev.slice(0, -1)); // Remove last state
  };

  // Override functions to track changes
  const onNodesChangeWithHistory = (changes) => {
    saveState();
    onNodesChange(changes);
  };

  const onEdgesChangeWithHistory = (changes) => {
    saveState();
    onEdgesChange(changes);
  };

  const onConnectWithHistory = (params) => {
    saveState();
    setEdges((eds) => addEdge({ ...params, label: "" }, eds));
  };
  //--------------------------------

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, label: "" }, eds)),
    [setEdges]
  );
  const addNode = () => {
    saveState();
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

  // const onNodeClick = (_, node) => {
  //   setSelectedNode(node);
  //   setNodeLabel(node.data.label);
  //   setNodeColor(node.data.color);
  //   setSelectedEdge(null);
  // };

  const onNodeClick = (_, node) => {
    setSelectedNode((prevSelected) => {
      const isAlreadySelected = prevSelected.some((n) => n.id === node.id);

      return isAlreadySelected
        ? prevSelected // Keep it unchanged if already selected
        : [...prevSelected, node]; // Append new selection
    });

    setSelectedEdge([]); // Clear edge selection when selecting nodes
  };

  // const onEdgeClick = (_, edge) => {
  //   setSelectedEdge(edge);
  //   setEdgeLabel(edge.label || "");
  //   setEdgeAnimated(edge.animated || false);
  //   setSelectedNode(null);
  // };

  const onEdgeClick = (_, edge) => {
    setSelectedEdge((prevSelected) => {
      const isAlreadySelected = prevSelected.some((e) => e.id === edge.id);

      return isAlreadySelected
        ? prevSelected // Keep it unchanged if already selected
        : [...prevSelected, edge]; // Append new selection
    });

    setEdgeLabel(edge.label || "");
    setEdgeAnimated(edge.animated || false);
    setSelectedNode([]); // Clear node selection when selecting edges
  };

  const onPaneClick = () => {
    setSelectedNode([]);
    setSelectedEdge([]);
    setNodeLabel("");
    setEdgeLabel("");
  };

  const handleEdgeLabelChange = (event) => {
    saveState();
    const newLabel = event.target.value;
    setEdgeLabel(newLabel);

    if (selectedEdge.length > 0) {
      setEdges((eds) =>
        eds.map((edge) =>
          selectedEdge.some((e) => e.id === edge.id)
            ? { ...edge, label: newLabel }
            : edge
        )
      );
    }
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
    setSelectedEdge([]);
  };

  const deleteNode = () => {
    if (!selectedNode || selectedNode.length === 0) return;

    const selectedNodeIds = selectedNode.map((node) => node.id);

    setNodes((nds) => nds.filter((node) => !selectedNodeIds.includes(node.id)));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          !selectedNodeIds.includes(edge.source) &&
          !selectedNodeIds.includes(edge.target)
      )
    );
    setSelectedNode([]); // Clear selection after deletion
  };

  const deleteEdge = () => {
    if (selectedEdge.length === 0) return;

    setEdges((eds) =>
      eds.filter((edge) => !selectedEdge.some((e) => e.id === edge.id))
    );

    setSelectedEdge([]); // Clear selection after deletion
  };

  //  Export Flowchart as JSON
  const exportFlowchart = () => {
    // Extract only the required properties from nodes
    const filteredNodes = nodes.map(({ id, data }) => ({
      id,
      data: { label: data.label }, // Only keep the label inside data
    }));
    // Extract only the required properties from edges
    const filteredEdges = edges.map(({ source, target, id }) => ({
      source,
      target,
      id,
    }));

    // Create the JSON structure with filtered nodes and edges
    const flowchartData = JSON.stringify(
      { nodes: filteredNodes, edges: filteredEdges },
      null,
      2
    );

    // Export as a JSON file
    const blob = new Blob([flowchartData], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "newFlowchart.json";
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

  const duplicateNode = () => {
    if (!selectedNode || selectedNode.length === 0) return;

    saveState(); // Save state before duplicating

    setNodes((prevNodes) => {
      const newNodes = selectedNode.map((node) => {
        const newId = `${node.id}-copy-${Date.now()}`; // Ensure unique ID
        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 50, // Offset the duplicate slightly
            y: node.position.y + 50,
          },
          data: { ...node.data },
        };
      });

      return [...prevNodes, ...newNodes];
    });
  };

  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh" }}>
      <div style={{ flex: 1 }} onDrop={onDrop} onDragOver={onDragOver}>
        <Paper
          sx={{
            p: 2,
            mb: 2,
            display: "flex",
            flexDirection: "row",
            gap: "10px",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Box sx={{ display: "flex", gap: "20px" }}>
              <Button
                variant="outlined"
                component="label"
                color="#ccc"
                sx={{ width: "50%" }}
              >
                <UploadFileIcon />
                <input
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={importFlowchart}
                />
              </Button>
              <Button
                variant="outlined"
                color="#ccc"
                fullWidth
                onClick={exportFlowchart}
                sx={{ width: "50%" }}
              >
                <FileDownloadIcon />
              </Button>
            </Box>
            <Box
              draggable
              onDragStart={(e) => onDragStart(e, "rectangle")}
              onClick={(e) => addNode(e)}
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                width: "150px",
                height: "40px",
                border: "1.5px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <Typography variant="h6" sx={{ pt: "4px" }}>
                Add Nodes
              </Typography>
            </Box>
          </Box>
          <Button onClick={undo} disabled={history.length === 0}>
            Undo
          </Button>
          <Button onClick={redo} disabled={redoStack.length === 0}>
            Redo
          </Button>
          {selectedEdge.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
                mt: "5px",
              }}
            >
              <FormControl size="small">
                <Typography variant="h6" sx={{ textAlign: "left", mb: "8px" }}>
                  Edit Link Label:
                </Typography>
                <TextField
                  label="Label"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={edgeLabel}
                  onChange={handleEdgeLabelChange}
                  sx={{ mt: "0px" }}
                />
              </FormControl>
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
              <FormControl size="small">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={deleteEdge}
                  style={{
                    width: "35px",
                    height: "35px",
                    cursor: "pointer",
                    marginTop: "43px",
                  }}
                >
                  <Delete />
                </Button>
              </FormControl>
            </Box>
          )}
          {selectedNode.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
                mt: "5px",
              }}
            >
              <FormControl size="small">
                <Typography variant="h6" sx={{ textAlign: "left", mb: "8px" }}>
                  Edit Node Label:
                </Typography>
                <TextField
                  size="small"
                  variant="outlined"
                  value={nodeLabel}
                  onChange={(e) => {
                    // const newValue = e.target.value;
                    // setNodeLabel(newValue); // Update UI instantly
                    handleNodeStyleChange("label", e.target.value);
                  }}
                  placeholder="Enter label"
                />
              </FormControl>

              <FormControl size="small">
                <IconButton>
                  <FontDownloadIcon />
                </IconButton>
                <Select
                  value={nodeFontStyle.fontFamily || "Arial"}
                  onChange={(e) =>
                    handleNodeStyleChange("fontFamily", e.target.value)
                  }
                  sx={{ width: "80px" }}
                >
                  {["Arial", "Verdana", "Times New Roman", "Courier New"].map(
                    (font) => (
                      <MenuItem key={font} value={font}>
                        {font}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <FormControl size="small">
                <IconButton>
                  <FormatSize />
                </IconButton>
                <Select
                  value={nodeFontStyle.fontSize || "16px"}
                  onChange={(e) =>
                    handleNodeStyleChange("fontSize", e.target.value)
                  }
                  sx={{ width: "80px" }}
                >
                  {["12px", "14px", "16px", "18px", "20px", "24px"].map(
                    (size) => (
                      <MenuItem key={size} value={size}>
                        {size}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <FormControl size="small">
                <IconButton>
                  <FormatBold />
                </IconButton>
                <Select
                  value={nodeFontStyle.fontWeight || "400"}
                  onChange={(e) =>
                    handleNodeStyleChange("fontWeight", e.target.value)
                  }
                >
                  {[
                    "100",
                    "200",
                    "300",
                    "400",
                    "500",
                    "600",
                    "700",
                    "800",
                    "900",
                  ].map((weight) => (
                    <MenuItem key={weight} value={weight}>
                      {weight}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small">
                <IconButton>
                  <FormatItalic />
                </IconButton>
                <Select
                  value={nodeFontStyle.fontStyle}
                  onChange={(e) =>
                    handleNodeStyleChange("fontStyle", e.target.value)
                  }
                  sx={{ width: "70px" }}
                >
                  {["normal", "italic"].map((style) => (
                    <MenuItem key={style} value={style}>
                      {style}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small">
                <IconButton sx={{ p: "8px 0px" }}>
                  <FormatColorTextIcon />
                </IconButton>
                <input
                  type="color"
                  value={nodeFontStyle.fontColor || "#000000"}
                  onChange={(e) =>
                    handleNodeStyleChange("fontColor", e.target.value)
                  }
                  style={{
                    width: "30px",
                    height: "30px",
                    border: "none",
                    cursor: "pointer",
                  }}
                />
              </FormControl>

              <FormControl size="small">
                <IconButton sx={{ p: "8px 0px" }}>
                  <FormatColorFillIcon />
                </IconButton>
                <input
                  type="color"
                  value={nodeFontStyle.bgColor || "#ffffff"}
                  onChange={(e) =>
                    handleNodeStyleChange("bgColor", e.target.value)
                  }
                  style={{
                    width: "30px",
                    height: "30px",
                    border: "none",
                    cursor: "pointer",
                  }}
                />
              </FormControl>

              <FormControl size="small">
                <Button
                  variant="outlined"
                  color="color"
                  onClick={duplicateNode}
                  style={{
                    width: "30px",
                    height: "30px",
                    cursor: "pointer",
                    marginTop: "40px",
                  }}
                >
                  <ContentCopyIcon />
                </Button>
              </FormControl>

              <FormControl size="small">
                <Button
                  variant="outlined"
                  color="error"
                  onClick={deleteNode}
                  style={{
                    width: "30px",
                    height: "30px",
                    cursor: "pointer",
                    marginTop: "40px",
                  }}
                >
                  <Delete />
                </Button>
              </FormControl>
            </Box>
          )}
        </Paper>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          onNodesChange={onNodesChangeWithHistory}
          onEdgesChange={onEdgesChangeWithHistory}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
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
