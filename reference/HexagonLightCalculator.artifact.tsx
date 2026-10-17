import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { RotateCcw, Zap, ZoomIn, ZoomOut, Move } from 'lucide-react';

export default function HexagonLightCalculator() {
  const canvasRef = useRef(null);
  const schematicRef = useRef(null);
  const [hexSize, setHexSize] = useState(70);
  const [selectedSides, setSelectedSides] = useState(new Set());
  const [sideLength, setSideLength] = useState(0.5);
  const [powerInputVertex, setPowerInputVertex] = useState(null);
  
  // Zoom and pan state for schematic
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const LED_POWER_PER_METER = 10;

  const hexagonPoints = (cx, cy, size) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      points.push({
        x: cx + size * Math.cos(angle),
        y: cy + size * Math.sin(angle)
      });
    }
    return points;
  };

  const generateHoneycomb = (cols, rows) => {
    const hexagons = [];
    const horizontalSpacing = hexSize * Math.sqrt(3);
    const verticalSpacing = hexSize * 1.5;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = 120 + col * horizontalSpacing + (row % 2) * (horizontalSpacing / 2);
        const y = 100 + row * verticalSpacing;
        hexagons.push({ x, y, row, col });
      }
    }
    return hexagons;
  };

  const [honeycomb] = useState(() => generateHoneycomb(4, 4));

  const getSideKey = (hex1, hex2) => {
    const key = `${Math.min(hex1.x, hex2.x)},${Math.min(hex1.y, hex2.y)}-${Math.max(hex1.x, hex2.x)},${Math.max(hex1.y, hex2.y)}`;
    return key;
  };

  const findNeighbor = (hex, direction) => {
    const horizontalSpacing = hexSize * Math.sqrt(3);
    const verticalSpacing = hexSize * 1.5;
    
    const offsets = [
      { dx: horizontalSpacing, dy: 0 },
      { dx: horizontalSpacing / 2, dy: verticalSpacing },
      { dx: -horizontalSpacing / 2, dy: verticalSpacing },
      { dx: -horizontalSpacing, dy: 0 },
      { dx: -horizontalSpacing / 2, dy: -verticalSpacing },
      { dx: horizontalSpacing / 2, dy: -verticalSpacing },
    ];

    const offset = offsets[direction];
    return honeycomb.find(h => 
      Math.abs(h.x - (hex.x + offset.dx)) < 5 && 
      Math.abs(h.y - (hex.y + offset.dy)) < 5
    );
  };

  const vertexKey = (x, y) => `${Math.round(x)},${Math.round(y)}`;

  // Get all selected sides with their vertex coordinates
  const selectedSidesData = useMemo(() => {
    const sides = [];
    const processed = new Set();
    
    honeycomb.forEach(hex => {
      const points = hexagonPoints(hex.x, hex.y, hexSize);
      
      for (let i = 0; i < 6; i++) {
        const neighbor = findNeighbor(hex, i);
        const sideKey = neighbor ? getSideKey(hex, neighbor) : `${hex.x},${hex.y}-${i}`;
        
        if (selectedSides.has(sideKey) && !processed.has(sideKey)) {
          const p1 = points[i];
          const p2 = points[(i + 1) % 6];
          sides.push({
            key: sideKey,
            v1: { x: p1.x, y: p1.y, key: vertexKey(p1.x, p1.y) },
            v2: { x: p2.x, y: p2.y, key: vertexKey(p2.x, p2.y) }
          });
          processed.add(sideKey);
        }
      }
    });
    
    return sides;
  }, [selectedSides, honeycomb, hexSize]);

  // Calculate vertex connections
  const vertexConnections = useMemo(() => {
    const connections = new Map();
    
    honeycomb.forEach(hex => {
      const points = hexagonPoints(hex.x, hex.y, hexSize);
      
      for (let i = 0; i < 6; i++) {
        const neighbor = findNeighbor(hex, i);
        const sideKey = neighbor ? getSideKey(hex, neighbor) : `${hex.x},${hex.y}-${i}`;
        
        if (selectedSides.has(sideKey)) {
          const p1 = points[i];
          const p2 = points[(i + 1) % 6];
          
          const v1Key = vertexKey(p1.x, p1.y);
          const v2Key = vertexKey(p2.x, p2.y);
          
          if (!connections.has(v1Key)) {
            connections.set(v1Key, { sides: new Set(), x: p1.x, y: p1.y });
          }
          if (!connections.has(v2Key)) {
            connections.set(v2Key, { sides: new Set(), x: p2.x, y: p2.y });
          }
          
          connections.get(v1Key).sides.add(sideKey);
          connections.get(v2Key).sides.add(sideKey);
        }
      }
    });
    
    return connections;
  }, [selectedSides, honeycomb, hexSize]);

  // Calculate 3D printing parts
  const printingParts = useMemo(() => {
    let straightParts = selectedSides.size;
    let corners = 0;
    let threeWay = 0;
    let endCaps = 0;
    
    vertexConnections.forEach((data) => {
      const count = data.sides.size;
      if (count === 1) endCaps++;
      else if (count === 2) corners++;
      else if (count === 3) threeWay++;
    });
    
    return { straightParts, corners, threeWay, endCaps };
  }, [selectedSides, vertexConnections]);

  // Calculate wiring path and jumper wires
  const { wiringPath, jumperWires } = useMemo(() => {
    if (selectedSidesData.length === 0) return { wiringPath: [], jumperWires: [] };
    
    // Build adjacency map: vertex -> list of sides connected to it
    const sideMap = new Map();
    selectedSidesData.forEach(side => {
      if (!sideMap.has(side.v1.key)) sideMap.set(side.v1.key, []);
      if (!sideMap.has(side.v2.key)) sideMap.set(side.v2.key, []);
      sideMap.get(side.v1.key).push(side);
      sideMap.get(side.v2.key).push(side);
    });
    
    // Find all connected components
    const visitedSides = new Set();
    const components = [];
    
    const traverseComponent = (startVertex) => {
      const component = [];
      const stack = [{ vertex: startVertex, prevSide: null }];
      const visitedInComponent = new Set();
      
      while (stack.length > 0) {
        const { vertex } = stack.pop();
        if (visitedInComponent.has(vertex)) continue;
        visitedInComponent.add(vertex);
        
        const connectedSides = sideMap.get(vertex) || [];
        for (const side of connectedSides) {
          if (visitedSides.has(side.key)) continue;
          
          visitedSides.add(side.key);
          component.push(side);
          
          const nextVertex = side.v1.key === vertex ? side.v2.key : side.v1.key;
          stack.push({ vertex: nextVertex, prevSide: side });
        }
      }
      
      return component;
    };
    
    // Find starting point
    let startVertex = powerInputVertex;
    if (!startVertex || !sideMap.has(startVertex)) {
      // Prefer an end cap (vertex with only 1 connection) as starting point
      for (const [vKey, sides] of sideMap) {
        if (sides.length === 1) {
          startVertex = vKey;
          break;
        }
      }
      if (!startVertex) startVertex = sideMap.keys().next().value;
    }
    
    // Traverse from start vertex first
    if (startVertex && sideMap.has(startVertex)) {
      const firstComponent = traverseComponent(startVertex);
      if (firstComponent.length > 0) {
        components.push({ sides: firstComponent, startVertex });
      }
    }
    
    // Find remaining disconnected components
    for (const side of selectedSidesData) {
      if (!visitedSides.has(side.key)) {
        const component = traverseComponent(side.v1.key);
        if (component.length > 0) {
          components.push({ sides: component, startVertex: side.v1.key });
        }
      }
    }
    
    // Build the final path with proper ordering within each component
    const path = [];
    const jumpers = [];
    
    components.forEach((component, compIndex) => {
      // Order sides within component for continuous path
      const orderedSides = [];
      const componentSideSet = new Set(component.sides.map(s => s.key));
      const usedSides = new Set();
      
      let currentVertex = component.startVertex;
      let lastEndVertex = null;
      
      while (usedSides.size < component.sides.length) {
        const availableSides = (sideMap.get(currentVertex) || [])
          .filter(s => componentSideSet.has(s.key) && !usedSides.has(s.key));
        
        if (availableSides.length === 0) {
          // Find any unused side in this component
          const unusedSide = component.sides.find(s => !usedSides.has(s.key));
          if (unusedSide) {
            orderedSides.push(unusedSide);
            usedSides.add(unusedSide.key);
            currentVertex = unusedSide.v2.key;
            lastEndVertex = unusedSide.v2;
          } else {
            break;
          }
        } else {
          const nextSide = availableSides[0];
          // Ensure correct orientation
          const orientedSide = nextSide.v1.key === currentVertex ? 
            nextSide : 
            { ...nextSide, v1: nextSide.v2, v2: nextSide.v1 };
          
          orderedSides.push(orientedSide);
          usedSides.add(nextSide.key);
          currentVertex = orientedSide.v2.key;
          lastEndVertex = orientedSide.v2;
        }
      }
      
      // Add jumper wire if this is not the first component
      if (compIndex > 0 && path.length > 0 && orderedSides.length > 0) {
        const lastSide = path[path.length - 1];
        const lastVertex = lastSide.v2;
        const nextVertex = orderedSides[0].v1;
        
        jumpers.push({
          from: { x: lastVertex.x, y: lastVertex.y, key: lastVertex.key },
          to: { x: nextVertex.x, y: nextVertex.y, key: nextVertex.key }
        });
      }
      
      path.push(...orderedSides);
    });
    
    return { wiringPath: path, jumperWires: jumpers };
  }, [selectedSidesData, powerInputVertex, vertexConnections]);

  // Zoom and pan handlers
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.5), 3));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleSchematicClick = (e) => {
    if (isPanning) return;
    
    const canvas = schematicRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Transform click coordinates based on zoom and pan
    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;
    const x = (rawX - canvas.width / 2 - pan.x) / zoom + canvas.width / 2;
    const y = (rawY - canvas.height / 2 - pan.y) / zoom + canvas.height / 2;

    for (const [vKey, data] of vertexConnections) {
      const dist = Math.sqrt((x - data.x) ** 2 + (y - data.y) ** 2);
      if (dist < 15) {
        setPowerInputVertex(vKey === powerInputVertex ? null : vKey);
        return;
      }
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    for (const hex of honeycomb) {
      const points = hexagonPoints(hex.x, hex.y, hexSize);
      
      for (let i = 0; i < 6; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 6];
        
        const dist = pointToLineDistance(x, y, p1.x, p1.y, p2.x, p2.y);
        if (dist < 12) {
          const neighbor = findNeighbor(hex, i);
          const sideKey = neighbor ? getSideKey(hex, neighbor) : `${hex.x},${hex.y}-${i}`;
          
          setSelectedSides(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sideKey)) {
              newSet.delete(sideKey);
            } else {
              newSet.add(sideKey);
            }
            return newSet;
          });
          return;
        }
      }
    }
  };

  const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }

    return Math.sqrt((px - xx) ** 2 + (py - yy) ** 2);
  };

  // Draw main hexagon grid
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    honeycomb.forEach(hex => {
      const points = hexagonPoints(hex.x, hex.y, hexSize);
      
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < 6; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.fillStyle = '#f8fafc';
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      for (let i = 0; i < 6; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % 6];
        const neighbor = findNeighbor(hex, i);
        const sideKey = neighbor ? getSideKey(hex, neighbor) : `${hex.x},${hex.y}-${i}`;
        
        if (selectedSides.has(sideKey)) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
    });
  }, [hexSize, selectedSides, honeycomb]);

  // Draw wiring schematic with zoom and pan
  useEffect(() => {
    const canvas = schematicRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom and pan transformation
    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    
    if (selectedSidesData.length === 0) {
      ctx.restore();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Select sides above to see wiring diagram', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Draw background hexagon outlines
    ctx.globalAlpha = 0.3;
    honeycomb.forEach(hex => {
      const points = hexagonPoints(hex.x, hex.y, hexSize);
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < 6; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Draw LED strips (yellow)
    selectedSidesData.forEach(side => {
      ctx.beginPath();
      ctx.moveTo(side.v1.x, side.v1.y);
      ctx.lineTo(side.v2.x, side.v2.y);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.stroke();
    });

    // Draw jumper wires (red dashed lines)
    jumperWires.forEach((jumper, idx) => {
      ctx.beginPath();
      ctx.setLineDash([8, 6]);
      ctx.moveTo(jumper.from.x, jumper.from.y);
      ctx.lineTo(jumper.to.x, jumper.to.y);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw jumper label
      const midX = (jumper.from.x + jumper.to.x) / 2;
      const midY = (jumper.from.y + jumper.to.y) / 2;
      
      // Background for label
      const label = `J${idx + 1}`;
      ctx.font = 'bold 10px sans-serif';
      const labelWidth = ctx.measureText(label).width + 8;
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(midX - labelWidth / 2, midY - 9, labelWidth, 18);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - labelWidth / 2, midY - 9, labelWidth, 18);
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, midX, midY);
    });

    // Draw wiring path with arrows and numbers
    wiringPath.forEach((side, idx) => {
      const startV = side.v1;
      const endV = side.v2;
      
      const midX = (startV.x + endV.x) / 2;
      const midY = (startV.y + endV.y) / 2;
      const angle = Math.atan2(endV.y - startV.y, endV.x - startV.x);
      
      // Direction arrow
      ctx.beginPath();
      ctx.moveTo(midX + 10 * Math.cos(angle), midY + 10 * Math.sin(angle));
      ctx.lineTo(midX - 7 * Math.cos(angle - 0.5), midY - 7 * Math.sin(angle - 0.5));
      ctx.lineTo(midX - 7 * Math.cos(angle + 0.5), midY - 7 * Math.sin(angle + 0.5));
      ctx.closePath();
      ctx.fillStyle = '#1e40af';
      ctx.fill();
      
      // Strip number
      const offsetX = 14 * Math.cos(angle + Math.PI / 2);
      const offsetY = 14 * Math.sin(angle + Math.PI / 2);
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(midX + offsetX, midY + offsetY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((idx + 1).toString(), midX + offsetX, midY + offsetY);
    });

    // Draw connection points
    const startVertexKey = powerInputVertex || (wiringPath[0] && wiringPath[0].v1.key);
    
    vertexConnections.forEach((data, vKey) => {
      const isStart = vKey === startVertexKey;
      const connectionCount = data.sides.size;
      
      ctx.beginPath();
      ctx.arc(data.x, data.y, isStart ? 12 : 7, 0, Math.PI * 2);
      ctx.fillStyle = isStart ? '#22c55e' : (connectionCount === 1 ? '#94a3b8' : '#3b82f6');
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      if (isStart) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', data.x, data.y);
        
        ctx.fillStyle = '#166534';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('12V DC', data.x, data.y - 20);
      }
    });

    ctx.restore();

    // Draw legend (not affected by zoom/pan)
    const legendX = 15;
    const legendY = canvas.height - 85;
    
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(10, legendY - 10, 200, 90);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, legendY - 10, 200, 90);
    
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Legend:', legendX, legendY + 2);
    
    // LED strip
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(legendX, legendY + 12, 24, 5);
    ctx.fillStyle = '#334155';
    ctx.font = '11px sans-serif';
    ctx.fillText('LED Strip', legendX + 30, legendY + 18);
    
    // Power input
    ctx.beginPath();
    ctx.arc(legendX + 12, legendY + 35, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillText('Power input (click to set)', legendX + 30, legendY + 38);
    
    // Jumper wire
    ctx.beginPath();
    ctx.setLineDash([5, 4]);
    ctx.moveTo(legendX, legendY + 55);
    ctx.lineTo(legendX + 24, legendY + 55);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#334155';
    ctx.fillText('Jumper wire', legendX + 30, legendY + 58);
    
    // Zoom level
    ctx.fillStyle = '#64748b';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Zoom: ${Math.round(zoom * 100)}%`, canvas.width - 15, canvas.height - 10);

  }, [selectedSidesData, wiringPath, jumperWires, vertexConnections, powerInputVertex, honeycomb, hexSize, zoom, pan]);

  const totalLength = selectedSides.size * sideLength;
  const totalPower = totalLength * LED_POWER_PER_METER;

  const resetSelection = () => {
    setSelectedSides(new Set());
    setPowerInputVertex(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-slate-800">Hexagon Garage Light Calculator</h1>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
            <h2 className="text-sm font-semibold text-slate-600 mb-2">Design Your Pattern</h2>
            <canvas
              ref={canvasRef}
              width={620}
              height={520}
              onClick={handleCanvasClick}
              className="border border-slate-200 bg-white cursor-crosshair w-full rounded-lg"
              style={{ maxHeight: '520px' }}
            />
            <p className="text-sm text-slate-500 mt-3 text-center">
              Click on hexagon sides to select/deselect them
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-600">Wiring Schematic</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom(z => Math.min(z * 1.2, 3))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={16} className="text-slate-600" />
                </button>
                <button
                  onClick={() => setZoom(z => Math.max(z * 0.8, 0.5))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={16} className="text-slate-600" />
                </button>
                <button
                  onClick={resetView}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Reset view"
                >
                  <Move size={16} className="text-slate-600" />
                </button>
              </div>
            </div>
            <canvas
              ref={schematicRef}
              width={620}
              height={520}
              onClick={handleSchematicClick}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="border border-slate-200 bg-slate-50 w-full rounded-lg"
              style={{ maxHeight: '520px', cursor: isPanning ? 'grabbing' : 'grab' }}
            />
            <p className="text-sm text-slate-500 mt-3 text-center">
              Scroll to zoom • Drag to pan • Click vertex to set power input
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Side Length: <span className="text-amber-600 font-bold">{sideLength.toFixed(2)} m</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.05"
              value={sideLength}
              onChange={(e) => setSideLength(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0.1 m</span>
              <span>2 m</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-lg border border-slate-200">
            <h2 className="text-lg font-bold mb-4 text-slate-800">Calculations</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-600">LED Strips</span>
                <span className="font-bold text-2xl text-slate-800">{selectedSides.size}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                <span className="text-amber-700">Total Length</span>
                <span className="font-bold text-2xl text-amber-600">{totalLength.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-700">Total Power</span>
                <span className="font-bold text-2xl text-red-600">{totalPower.toFixed(1)} W</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-700">Jumper Wires</span>
                <span className="font-bold text-2xl text-orange-600">{jumperWires.length}</span>
              </div>
            </div>
            
            <button
              onClick={resetSelection}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw size={16} />
              Reset Selection
            </button>
          </div>
          
          <div className="bg-purple-50 p-5 rounded-xl shadow-lg border-2 border-purple-200">
            <h2 className="text-lg font-bold mb-3 text-purple-900">🖨️ 3D Print Parts</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-1 bg-purple-500 rounded"></div>
                  <span className="text-purple-800 text-sm">Straight channels</span>
                </div>
                <span className="font-bold text-xl text-purple-700">{printingParts.straightParts}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="text-purple-500">
                    <path d="M4 12 L12 12 L20 4" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-purple-800 text-sm">Corners (120°)</span>
                </div>
                <span className="font-bold text-xl text-purple-700">{printingParts.corners}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" className="text-purple-500">
                    <path d="M12 4 L12 12 M12 12 L4 18 M12 12 L20 18" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-purple-800 text-sm">3-way connectors</span>
                </div>
                <span className="font-bold text-xl text-purple-700">{printingParts.threeWay}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-purple-500 rounded-r"></div>
                  <span className="text-purple-800 text-sm">End caps</span>
                </div>
                <span className="font-bold text-xl text-purple-700">{printingParts.endCaps}</span>
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-3">
              Channel length: {(sideLength * 100).toFixed(0)} cm each
            </p>
          </div>
          
          <div className="bg-slate-800 p-5 rounded-xl shadow-lg text-white">
            <h2 className="text-lg font-bold mb-3">LED Strip Specs</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Model:</span>
                <span className="font-medium">LED COB 320 PREMIUM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Voltage:</span>
                <span className="font-medium">12V DC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Colour:</span>
                <span className="font-medium">4000K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Density:</span>
                <span className="font-medium">300 LEDs/m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Power:</span>
                <span className="font-medium">~10W/m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Width:</span>
                <span className="font-medium">8mm</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-5 rounded-xl shadow-lg border-2 border-green-200">
            <h2 className="text-lg font-bold mb-3 text-green-900">Shopping List</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>{Math.ceil(totalLength)} m</strong> LED COB strip (buy {Math.ceil(totalLength / 5) * 5 || 5} m)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>12V DC</strong> power supply ({Math.max(1, Math.ceil(totalPower / 12))} A minimum)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>3D print filament for channels</span>
              </li>
              {jumperWires.length > 0 && (
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>{jumperWires.length}</strong> jumper wire{jumperWires.length > 1 ? 's' : ''} (2-conductor)</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
