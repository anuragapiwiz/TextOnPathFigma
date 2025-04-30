// Show the UI
figma.showUI(__html__);

let selectedTextNode: TextNode | null = null;
let selectedShapeNode: ArcNode | null = null;
let letterGroup: GroupNode | null = null;

// Function to handle selection change
function handleSelectionChange() {
  selectedTextNode = null;
  selectedShapeNode = null;
  const selection = figma.currentPage.selection;
  for (const node of selection) {
    if (node.type === 'TEXT') {
      selectedTextNode = node;
    } else if (node.type === 'ARC') {
      selectedShapeNode = node;
    }
  }
  figma.ui.postMessage({ type: 'selection-change', textName: selectedTextNode?.name, shapeName: selectedShapeNode?.name });
}

// Function to create an arc if none is selected
function createArc() {
  const arc = figma.createArc();
  arc.name = "Arc";
  arc.x = figma.viewport.center.x;
  arc.y = figma.viewport.center.y;
  arc.resize(200, 200);
  arc.arcStart = -Math.PI / 2;
  arc.arcEnd = Math.PI / 2;
  arc.innerRadius = 0.7;
  arc.strokeWeight = 5;
  arc.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
  figma.currentPage.appendChild(arc);
  return arc;
}

// Function to place text on path
function placeTextOnPath(textNode: TextNode, pathNode: ArcNode) {
  if (textNode && pathNode) {
    const letters = textNode.characters.split('');
    const letterNodes: TextNode[] = [];
    let currentAngle = pathNode.arcStart;
    const angleIncrement = (pathNode.arcEnd - pathNode.arcStart) / letters.length;

    for (const letter of letters) {
      const letterNode = figma.createText();
      letterNode.characters = letter;
      letterNode.fontName = textNode.fontName;
      letterNode.fontSize = textNode.fontSize;

      const radius = Math.max(pathNode.width, pathNode.height) / 2 * pathNode.innerRadius;
      const centerX = pathNode.x + pathNode.width / 2;
      const centerY = pathNode.y + pathNode.height / 2;

      const letterWidth = letterNode.width;
      const letterHeight = letterNode.height;
      const angle = currentAngle;

      letterNode.x = centerX + radius * Math.cos(angle) - letterWidth / 2;
      letterNode.y = centerY + radius * Math.sin(angle) - letterHeight / 2;

      letterNodes.push(letterNode);
      figma.currentPage.appendChild(letterNode);
      currentAngle += angleIncrement;
    }
    letterGroup = figma.group(letterNodes, figma.currentPage);
    letterGroup.name = "Letter Group"
  }
}

// Function to update spacing
function updateSpacing(spacing: number) {
  if (letterGroup && letterGroup.children.length > 1) {
    const pathNode = selectedShapeNode;
    const letters = letterGroup.children;

    if (pathNode) {
      let currentAngle = pathNode.arcStart;
      const angleIncrement = (pathNode.arcEnd - pathNode.arcStart) / letters.length;

      for (let i = 0; i < letters.length; i++) {
        const letterNode = letters[i] as TextNode;

        const radius = Math.max(pathNode.width, pathNode.height) / 2 * pathNode.innerRadius;
        const centerX = pathNode.x + pathNode.width / 2;
        const centerY = pathNode.y + pathNode.height / 2;
        const angle = currentAngle;
        letterNode.x = centerX + radius * Math.cos(angle) - letterNode.width / 2;
        letterNode.y = centerY + radius * Math.sin(angle) - letterNode.height / 2;
        currentAngle += angleIncrement + spacing / 100 * angleIncrement;
      }
    }
  }
}

// Handle UI messages
figma.ui.onmessage = (msg) => {
  if (msg.type === 'text-on-path') {
    if (!selectedTextNode) {
      figma.notify('Please select a text node.');
    } else if (!selectedShapeNode) {
      figma.notify('No arc selected. Creating one for you');
      selectedShapeNode = createArc();
      figma.currentPage.selection = [selectedShapeNode];
    } else {
      placeTextOnPath(selectedTextNode, selectedShapeNode);
    }
  } else if (msg.type === 'update-spacing') {
    updateSpacing(msg.spacing);
  }
};

// Listen for selection changes
figma.on('selectionchange', handleSelectionChange);
