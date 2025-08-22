import React from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart
} from 'recharts';
import { motion } from 'framer-motion';

// Color palettes for charts
export const CHART_COLORS = {
  primary: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
  gradient: ['#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#14B8A6', '#06B6D4'],
  dark: ['#1E40AF', '#DC2626', '#059669', '#D97706', '#7C3AED', '#BE185D', '#0F766E', '#EA580C']
};

interface ChartProps {
  data: any[];
  config: {
    xAxis: string;
    yAxis: string;
    groupBy?: string;
    aggregation?: string;
  };
  height?: number;
}

// Enhanced Line Chart with multiple series support
export const EnhancedLineChart: React.FC<ChartProps> = ({ data, config, height = 300 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey={config.xAxis} 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: 'none', 
              borderRadius: '8px',
              color: '#F9FAFB'
            }} 
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={config.yAxis} 
            stroke={CHART_COLORS.primary[0]}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.primary[0], strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: CHART_COLORS.primary[0], strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Enhanced Area Chart with gradient fills
export const EnhancedAreaChart: React.FC<ChartProps> = ({ data, config, height = 300 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={CHART_COLORS.primary[0]} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey={config.xAxis} 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: 'none', 
              borderRadius: '8px',
              color: '#F9FAFB'
            }} 
          />
          <Area 
            type="monotone" 
            dataKey={config.yAxis} 
            stroke={CHART_COLORS.primary[0]}
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Enhanced Bar Chart with custom styling
export const EnhancedBarChart: React.FC<ChartProps> = ({ data, config, height = 300 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey={config.xAxis} 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: 'none', 
              borderRadius: '8px',
              color: '#F9FAFB'
            }} 
          />
          <Bar 
            dataKey={config.yAxis} 
            fill={CHART_COLORS.primary[0]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Enhanced Pie Chart with custom styling
export const EnhancedPieChart: React.FC<ChartProps> = ({ data, config, height = 300 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={config.yAxis}
            nameKey={config.xAxis}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: 'none', 
              borderRadius: '8px',
              color: '#F9FAFB'
            }} 
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Scatter Plot Chart
export const EnhancedScatterChart: React.FC<ChartProps> = ({ data, config, height = 300 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            type="number" 
            dataKey={config.xAxis} 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            type="number" 
            dataKey={config.yAxis} 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: 'none', 
              borderRadius: '8px',
              color: '#F9FAFB'
            }} 
          />
          <Scatter 
            dataKey={config.yAxis} 
            fill={CHART_COLORS.primary[0]}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// Candlestick Chart Component
export const CandlestickChart: React.FC<ChartProps & { 
  priceData: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }> 
}> = ({ priceData, height = 300 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={priceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: 'none', 
              borderRadius: '8px',
              color: '#F9FAFB'
            }} 
          />
          <Bar dataKey="high" fill="#10B981" />
          <Bar dataKey="low" fill="#EF4444" />
          <Line type="monotone" dataKey="close" stroke="#3B82F6" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
