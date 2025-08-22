import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

// Heatmap Component
export const Heatmap: React.FC<{
  data: Array<{ x: string; y: string; value: number }>;
  width?: number;
  height?: number;
}> = ({ data, width = 400, height = 300 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xValues = Array.from(new Set(data.map(d => d.x)));
    const yValues = Array.from(new Set(data.map(d => d.y)));

    const xScale = d3.scaleBand()
      .domain(xValues)
      .range([0, innerWidth])
      .padding(0.05);

    const yScale = d3.scaleBand()
      .domain(yValues)
      .range([0, innerHeight])
      .padding(0.05);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain(d3.extent(data, d => d.value) as [number, number]);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add rectangles
    g.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.x) || 0)
      .attr("y", d => yScale(d.y) || 0)
      .attr("width", xScale.bandwidth())
      .attr("height", yScale.bandwidth())
      .attr("fill", d => colorScale(d.value))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("stroke-width", 2);
        
        // Tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "#1F2937")
          .style("color", "#F9FAFB")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .html(`${d.x}, ${d.y}: ${d.value}`);

        tooltip.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke-width", 1);
        d3.selectAll(".tooltip").remove();
      });

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("fill", "#6B7280")
      .style("font-size", "12px");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .selectAll("text")
      .style("fill", "#6B7280")
      .style("font-size", "12px");

  }, [data, width, height]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4"
    >
      <svg ref={svgRef} width={width} height={height} />
    </motion.div>
  );
};

// Network Graph Component
export const NetworkGraph: React.FC<{
  nodes: Array<{ id: string; group?: number; value?: number }>;
  links: Array<{ source: string; target: string; value?: number }>;
  width?: number;
  height?: number;
}> = ({ nodes, links, width = 400, height = 300 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!nodes || !links || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value || 1));

    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", d => Math.sqrt((d.value || 1) * 10))
      .attr("fill", d => d3.schemeCategory10[d.group || 0])
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append("title")
      .text(d => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("cx", (d: any) => d.x)
        .attr("cy", (d: any) => d.y);
    });

  }, [nodes, links, width, height]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4"
    >
      <svg ref={svgRef} width={width} height={height} />
    </motion.div>
  );
};

// Sankey Diagram Component
export const SankeyDiagram: React.FC<{
  data: {
    nodes: Array<{ id: string; name: string }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
  width?: number;
  height?: number;
}> = ({ data, width = 400, height = 300 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Simple Sankey implementation
    const { nodes, links } = data;
    
    // Calculate node positions
    const nodeMap = new Map(nodes.map((d, i) => [d.id, { ...d, index: i }]));
    const processedLinks = links.map(link => ({
      ...link,
      source: nodeMap.get(link.source)?.index || 0,
      target: nodeMap.get(link.target)?.index || 0
    }));

    const nodeHeight = 20;
    const nodeSpacing = (height - nodes.length * nodeHeight) / (nodes.length - 1);
    
    const processedNodes = nodes.map((node, i) => ({
      ...node,
      x: i % 2 === 0 ? 50 : width - 100,
      y: i * (nodeHeight + nodeSpacing),
      height: nodeHeight
    }));

    // Draw links
    svg.selectAll(".link")
      .data(processedLinks)
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", (d: any) => {
        const sourceNode = processedNodes[d.source];
        const targetNode = processedNodes[d.target];
        const x0 = sourceNode.x + 50;
        const x1 = targetNode.x;
        const y0 = sourceNode.y + sourceNode.height / 2;
        const y1 = targetNode.y + targetNode.height / 2;
        const xi = d3.interpolateNumber(x0, x1);
        const x2 = xi(0.5);
        const x3 = xi(0.5);
        return `M${x0},${y0}C${x2},${y0} ${x3},${y1} ${x1},${y1}`;
      })
      .attr("fill", "none")
      .attr("stroke", "#3B82F6")
      .attr("stroke-width", d => Math.max(1, d.value / 10))
      .attr("opacity", 0.7);

    // Draw nodes
    svg.selectAll(".node")
      .data(processedNodes)
      .enter()
      .append("rect")
      .attr("class", "node")
      .attr("x", d => d.x)
      .attr("y", d => d.y)
      .attr("width", 50)
      .attr("height", d => d.height)
      .attr("fill", "#10B981")
      .attr("stroke", "#059669");

    // Add labels
    svg.selectAll(".label")
      .data(processedNodes)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => d.x + 25)
      .attr("y", d => d.y + d.height / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("fill", "#F9FAFB")
      .style("font-size", "10px")
      .text(d => d.name);

  }, [data, width, height]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4"
    >
      <svg ref={svgRef} width={width} height={height} />
    </motion.div>
  );
};

// Define the data structure interface
interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
}

// Extended hierarchy node type with treemap layout properties
interface TreemapNode extends d3.HierarchyNode<TreemapData> {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// Treemap Component
export const Treemap: React.FC<{
  data: TreemapData;
  width?: number;
  height?: number;
}> = ({ data, width = 400, height = 300 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const root = d3.hierarchy<TreemapData>(data)
      .sum(d => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap<TreemapData>()
      .size([width, height])
      .padding(2)(root);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const leaf = svg.selectAll("g")
      .data(root.leaves() as TreemapNode[])
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    leaf.append("rect")
      .attr("fill", (_, i) => color(i.toString()))
      .attr("fill-opacity", 0.8)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    leaf.append("text")
      .attr("x", 4)
      .attr("y", 14)
      .style("fill", "#fff")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .text(d => d.data.name);

    leaf.append("text")
      .attr("x", 4)
      .attr("y", 28)
      .style("fill", "#fff")
      .style("font-size", "8px")
      .text(d => d.value?.toLocaleString() || "");

  }, [data, width, height]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4"
    >
      <svg ref={svgRef} width={width} height={height} />
    </motion.div>
  );
};
