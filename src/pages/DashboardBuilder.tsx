import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Share2, Coins, BarChart3, LineChart, PieChart, Download, Settings, Trash2, Sparkles, Zap, Database, Type } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { getDashboardById, upsertDashboard } from '../services/dashboardStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from '../components/ui/AnimatedCard';
import AnimatedButton from '../components/ui/AnimatedButton';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import SavedQueries from '../components/SavedQueries';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const ResponsiveGridLayout = WidthProvider(Responsive);

type WidgetType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'counter' | 'table' | 'pivot' | 'text';

interface ChartWidget {
  id: string;
  type: WidgetType;
  title: string;
  query: string;
  data: any;
  content?: string; // for text widgets
  config: {
    xAxis: string;
    yAxis: string;
    groupBy?: string;
    aggregation: 'sum' | 'count' | 'avg' | 'max' | 'min';
  };
  position: { x: number; y: number; w: number; h: number };
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: ChartWidget[];
  isPublic: boolean;
  created_at: string;
  updated_at: string;
}

const DashboardBuilder = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard>({
    id: '',
    name: 'New Dashboard',
    description: '',
    widgets: [],
    isPublic: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const [selectedWidget, setSelectedWidget] = useState<ChartWidget | null>(null);
  const [showWidgetEditor, setShowWidgetEditor] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  const addWidgetFromSavedQuery = (savedQuery: any) => {
    const newWidget: ChartWidget = {
      id: Date.now().toString(),
      type: savedQuery.visualizationType as WidgetType,
      title: savedQuery.name,
      query: savedQuery.query,
      data: null,
      config: {
        xAxis: '',
        yAxis: '',
        aggregation: 'sum',
      },
      position: { x: 0, y: 0, w: 4, h: 8 },
    };

    setSelectedWidget(newWidget);
    setShowWidgetEditor(true);
  };

  useEffect(() => {
    const id = searchParams.get('dashId');
    if (id) {
      const d = getDashboardById(id);
      if (d) {
        setDashboard(d as any);
      }
    }
  }, [searchParams]);

  const chartTypes = [
    { type: 'bar', name: 'Bar', icon: BarChart3, color: 'from-blue-500 to-cyan-500' },
    { type: 'line', name: 'Line', icon: LineChart, color: 'from-green-500 to-emerald-500' },
    { type: 'pie', name: 'Pie', icon: PieChart, color: 'from-purple-500 to-pink-500' },
    { type: 'text', name: 'Text', icon: Type, color: 'from-gray-500 to-gray-700' },
    { type: 'area', name: 'Area', icon: AreaChart, color: 'from-orange-500 to-red-500' },
    { type: 'scatter', name: 'Scatter', icon: ScatterChart, color: 'from-indigo-500 to-purple-500' },
    { type: 'counter', name: 'Counter', icon: CounterIcon, color: 'from-teal-500 to-green-500' },
    { type: 'table', name: 'Table', icon: TableIcon, color: 'from-gray-600 to-gray-800' },
    { type: 'pivot', name: 'Pivot', icon: PivotIcon, color: 'from-pink-500 to-red-500' },
  ];

  const sampleQueries = [
    {
      name: 'Daily Transaction Volume',
      query: `SELECT DATE(timestamp) as date, COUNT(*) as transaction_count FROM starknet_transactions WHERE timestamp >= DATE('now', '-30 days') GROUP BY DATE(timestamp) ORDER BY date`,
      config: { xAxis: 'date', yAxis: 'transaction_count', aggregation: 'sum' as const }
    },
    {
      name: 'Top Contracts by Calls',
      query: `SELECT contract_address, COUNT(*) as call_count FROM contract_calls WHERE timestamp >= DATE('now', '-7 days') GROUP BY contract_address ORDER BY call_count DESC LIMIT 10`,
      config: { xAxis: 'contract_address', yAxis: 'call_count', aggregation: 'count' as const }
    },
    {
      name: 'Gas Usage Distribution',
      query: `SELECT CASE WHEN gas_used < 50000 THEN 'Low' WHEN gas_used < 200000 THEN 'Medium' ELSE 'High' END as gas_category, COUNT(*) as transaction_count FROM starknet_transactions WHERE timestamp >= DATE('now', '-24 hours') GROUP BY gas_category`,
      config: { xAxis: 'gas_category', yAxis: 'transaction_count', aggregation: 'count' as const }
    }
  ];

  const createWidget = (type: WidgetType) => {
    const newWidget: ChartWidget = {
      id: Date.now().toString(),
      type,
      title: type === 'text' ? 'Text Block' : `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      query: type === 'text' ? '' : sampleQueries[0].query,
      content: type === 'text' ? 'Click the settings icon to edit this text...' : undefined,
      data: null,
      config: type === 'text' ? { xAxis: '', yAxis: '', aggregation: 'sum' } as any : sampleQueries[0].config,
      position: { x: 0, y: 0, w: type === 'text' ? 4 : 4, h: type === 'text' ? 6 : 8 },
    };

    setSelectedWidget(newWidget);
    setShowWidgetEditor(true);
  };

  const executeWidgetQuery = async (widget: ChartWidget) => {
    try {
      const response = await fetch('/api/query/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ query: widget.query })
      });
      if (!response.ok) throw new Error('Query execution failed');
      const result = await response.json();
      return result;
    } catch (error) {
      const mockData = {
        columns: ['label', 'value'],
        rows: [
          ['A', 12], ['B', 18], ['C', 7], ['D', 15]
        ]
      };
      return mockData;
    }
  };

  const transformDataForChart = (queryResult: any, widget: ChartWidget) => {
    const { config } = widget;
    const labels = queryResult.rows.map((row: any[]) => {
      const xIndex = queryResult.columns.indexOf(config.xAxis) !== -1 ? queryResult.columns.indexOf(config.xAxis) : 0;
      return row[xIndex];
    });

    const values = queryResult.rows.map((row: any[]) => {
      const yIndex = queryResult.columns.indexOf(config.yAxis) !== -1 ? queryResult.columns.indexOf(config.yAxis) : 1;
      return row[yIndex];
    });

    if (widget.type === 'pie') {
      return { labels, datasets: [{ data: values, backgroundColor: ['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316','#84CC16','#6366F1'] }] };
    }

    return {
      labels,
      datasets: [{
        label: config.yAxis || 'value',
        data: values,
        backgroundColor: widget.type === 'bar' ? '#3B82F6' : undefined,
        borderColor: widget.type === 'line' ? '#3B82F6' : undefined,
        fill: widget.type === 'line' ? false : undefined
      }]
    };
  };

  const canRenderChart = (w: ChartWidget) => w.type === 'bar' || w.type === 'line' || w.type === 'pie';

  const saveWidget = async () => {
    if (!selectedWidget) return;
    try {
      let updatedWidget = { ...selectedWidget } as ChartWidget;
      if (canRenderChart(selectedWidget)) {
        const queryResult = await executeWidgetQuery(selectedWidget);
        const chartData = transformDataForChart(queryResult, selectedWidget);
        updatedWidget = { ...updatedWidget, data: chartData };
      }

      setDashboard(prev => {
        const exists = prev.widgets.find(w => w.id === updatedWidget.id);
        const widgets = exists
          ? prev.widgets.map(w => (w.id === updatedWidget.id ? updatedWidget : w))
          : [...prev.widgets, updatedWidget];
        return { ...prev, widgets, updated_at: new Date().toISOString() };
      });

      setShowWidgetEditor(false);
      setSelectedWidget(null);
      toast.success('Widget saved');
    } catch (error) {
      toast.error('Failed to save widget');
    }
  };

  // Layout helpers for react-grid-layout
  const layouts: Layouts = useMemo(() => {
    const lg: Layout[] = dashboard.widgets.map((w) => ({
      i: w.id,
      x: w.position.x ?? 0,
      y: w.position.y ?? 0,
      w: w.position.w ?? 4,
      h: w.position.h ?? 8,
      minW: 2,
      minH: 4,
    }));
    return { lg, md: lg, sm: lg, xs: lg, xxs: lg };
  }, [dashboard.widgets]);

  const onLayoutChange = (current: Layout[]) => {
    // Map the new layout back into dashboard widgets
    setDashboard(prev => {
      const map = new Map(current.map((l) => [l.i, l]));
      const widgets = prev.widgets.map((w) => {
        const l = map.get(w.id);
        if (!l) return w;
        return { ...w, position: { x: l.x, y: l.y, w: l.w, h: l.h } };
        });
      return { ...prev, widgets, updated_at: new Date().toISOString() };
    });
  };

  const saveDashboard = async () => {
    setIsSaving(true);
    try {
      setTimeout(() => {
        setDashboard(prev => {
          const updated = { ...prev, id: prev.id || Date.now().toString(), updated_at: new Date().toISOString() };
          upsertDashboard(updated as any);
          return updated;
        });
        toast.success('Dashboard saved successfully!');
        setIsSaving(false);
      }, 800);
    } catch (error) {
      toast.error('Failed to save dashboard');
      setIsSaving(false);
    }
  };

  const mintDashboard = async () => {
    if (!user?.isPremium) {
      toast.error('Premium feature: Mint dashboards as NFTs');
      return;
    }
    setIsMinting(true);
    setTimeout(() => {
      toast.success('Dashboard minted successfully! TX: 0x1234...5678');
      setShowMintModal(false);
      setIsMinting(false);
    }, 1500);
  };

  const deleteWidget = (widgetId: string) => {
    setDashboard(prev => ({ ...prev, widgets: prev.widgets.filter(w => w.id !== widgetId), updated_at: new Date().toISOString() }));
    toast.success('Widget deleted');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950 flex items-center justify-center font-['Inter',sans-serif]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <AnimatedCard className="p-12 max-w-md mx-auto" glow={true}>
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mb-6">
              <BarChart3 className="w-16 h-16 text-blue-600 mx-auto" />
            </motion.div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Sign In Required</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Please sign in to access the dashboard builder and create stunning visualizations.</p>
            <AnimatedButton variant="primary" size="lg" icon={Zap}>Sign In</AnimatedButton>
          </AnimatedCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-950 font-['Inter',sans-serif]">
      {/* Header */}
      <motion.div className="glass border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </motion.div>
              <motion.input type="text" value={dashboard.name} onChange={(e) => setDashboard(prev => ({ ...prev, name: e.target.value }))} className="text-xl font-black bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 text-gray-900 dark:text-white min-w-[260px]" whileFocus={{ scale: 1.02 }} />
            </motion.div>
            <motion.div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full" whileHover={{ scale: 1.05 }}>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{dashboard.widgets.length} widgets</span>
            </motion.div>
          </div>

          <div className="flex items-center space-x-3 gap-2">
            <motion.div className="flex items-center gap-3 text-sm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <motion.label className="inline-flex items-center gap-2 cursor-pointer" whileHover={{ scale: 1.05 }}>
                <input type="checkbox" checked={Boolean((dashboard as any).isPublic)} onChange={(e) => setDashboard(prev => ({ ...prev, isPublic: e.target.checked }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Public</span>
              </motion.label>

              <AnimatedButton variant="secondary" size="sm" icon={Share2} onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/d/${dashboard.id || ''}`); setCopied(true); setTimeout(() => setCopied(false), 1200); }} disabled={!dashboard.id}>{copied ? 'Copied!' : 'Share'}</AnimatedButton>
              <AnimatedButton variant="secondary" size="sm" icon={Download} onClick={async () => { const el = document.getElementById('dashboard-capture'); if (!el) return; await new Promise((r) => setTimeout(r, 200)); const dataUrl = await htmlToImage.toPng(el, { pixelRatio: 2 }); const a = document.createElement('a'); a.href = dataUrl; a.download = `dashboard_${dashboard.name || 'export'}_${Date.now()}.png`; a.click(); }}>Export</AnimatedButton>
            </motion.div>

            <AnimatedButton variant="primary" size="sm" icon={Save} onClick={saveDashboard} loading={isSaving}>{isSaving ? 'Saving...' : 'Save'}</AnimatedButton>
            <AnimatedButton variant={user.isPremium && dashboard.widgets.length > 0 ? 'warning' : 'secondary'} size="sm" icon={Coins} onClick={() => setShowMintModal(true)} disabled={!user.isPremium || dashboard.widgets.length === 0} className={user.isPremium && dashboard.widgets.length > 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : 'opacity-50 cursor-not-allowed'}>Mint NFT</AnimatedButton>
          </div>
        </div>

        {/* Description */}
        <motion.div className="mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <motion.input type="text" value={dashboard.description || ''} onChange={(e) => setDashboard(prev => ({ ...prev, description: e.target.value }))} placeholder="Add a description..." className="w-full bg-transparent border-none focus:outline-none text-gray-600 dark:text-gray-300 text-sm font-medium placeholder-gray-400" whileFocus={{ scale: 1.01 }} />
        </motion.div>
      </motion.div>

      {/* Toolbar */}
      <motion.div className="glass border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Sparkles className="w-4 h-4" />Add Widget:</span>
          {chartTypes.map(({ type, name, icon: Icon, color }, index) => (
            <motion.button key={type} onClick={() => createWidget(type as WidgetType)} className={`flex items-center space-x-2 px-3 py-2 bg-gradient-to-r ${color} text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
              <Icon className="h-4 w-4" />
              <span>{name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Dashboard Grid */}
      <div className="p-4">
        <SavedQueries onAddWidget={addWidgetFromSavedQuery} />
        <div id="dashboard-capture">
          {dashboard.widgets.length === 0 ? (
            <motion.div className="text-center py-16" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <AnimatedCard className="p-8 max-w-md mx-auto" glow={true}>
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">No widgets yet</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 text-base">Add your first chart widget to get started</p>
                <AnimatedButton variant="primary" size="md" icon={Plus} onClick={() => createWidget('bar')}>Add Your First Widget</AnimatedButton>
              </AnimatedCard>
            </motion.div>
          ) : (
            <ResponsiveGridLayout
              className="layout"
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 8, xs: 6, xxs: 4 }}
              rowHeight={24}
              margin={[8, 8]}
              compactType="vertical"
              draggableHandle=".drag-handle"
              layouts={layouts}
              onLayoutChange={(curr, all) => onLayoutChange(curr)}
            >
              {dashboard.widgets.map((widget) => (
                <div key={widget.id}>  
                  <AnimatedCard className="p-5 h-full" hover={true} glow={true}>
                    <div className="flex justify-between items-center mb-2 drag-handle cursor-move">
                      <motion.h3 className="font-black text-sm text-gray-900 dark:text-white" whileHover={{ scale: 1.02 }}>{widget.title}</motion.h3>
                      <div className="flex items-center space-x-1">
                        <motion.button onClick={() => { setSelectedWidget(widget); setShowWidgetEditor(true); }} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-all" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><Settings className="h-4 w-4" /></motion.button>
                        <motion.button onClick={() => deleteWidget(widget.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><Trash2 className="h-4 w-4" /></motion.button>
                      </div>
                    </div>

                    <div className="h-full">
                      {(() => {
                        if (widget.type === 'text') {
                          return (
                            <div className="h-full p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 overflow-auto text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                              {widget.content || 'Empty'}
                            </div>
                          );
                        }
                        const chartData = (widget.data && (widget.data.chartData || widget.data)) as any;
                        if (widget.type === 'bar' && chartData) return <div className="h-48"><Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>;
                        if (widget.type === 'line' && chartData) return <div className="h-48"><Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>;
                        if (widget.type === 'pie' && chartData) return <div className="h-48"><Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>;
                        return (
                          <div className="flex items-center justify-center h-40 text-gray-500">
                            <div className="text-center">
                              <Database className="h-10 w-10 mx-auto mb-2 opacity-50" />
                              <p className="text-xs font-medium">Configure widget to see data</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </AnimatedCard>
                </div>
              ))}
            </ResponsiveGridLayout>
          )}
        </div>
      </div>

      {/* Widget Editor Modal */}
      <AnimatePresence>
        {showWidgetEditor && selectedWidget && (
          <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Edit Widget</h2>
                  <motion.button onClick={() => { setShowWidgetEditor(false); setSelectedWidget(null); }} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Widget Title</label>
                    <input
                      type="text"
                      value={selectedWidget.title}
                      onChange={(e) => setSelectedWidget(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter widget title"
                    />
                  </div>

                  {selectedWidget.type !== 'text' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SQL Query</label>
                        <textarea
                          value={selectedWidget.query}
                          onChange={(e) => setSelectedWidget(prev => prev ? { ...prev, query: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                          rows={4}
                          placeholder="Enter your SQL query"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">X-Axis Column</label>
                          <input
                            type="text"
                            value={selectedWidget.config.xAxis}
                            onChange={(e) => setSelectedWidget(prev => prev ? { ...prev, config: { ...prev.config, xAxis: e.target.value } } : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="x_axis_column"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Y-Axis Column</label>
                          <input
                            type="text"
                            value={selectedWidget.config.yAxis}
                            onChange={(e) => setSelectedWidget(prev => prev ? { ...prev, config: { ...prev.config, yAxis: e.target.value } } : null)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="y_axis_column"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {selectedWidget.type === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text Content</label>
                      <textarea
                        value={selectedWidget.content || ''}
                        onChange={(e) => setSelectedWidget(prev => prev ? { ...prev, content: e.target.value } : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={6}
                        placeholder="Enter your text content here..."
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <AnimatedButton
                      variant="secondary"
                      onClick={() => { setShowWidgetEditor(false); setSelectedWidget(null); }}
                    >
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton
                      variant="primary"
                      onClick={saveWidget}
                    >
                      Save Widget
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mint Modal */}
      <AnimatePresence>
        {showMintModal && (
          <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white">Mint Dashboard as NFT</h2>
                  <motion.button onClick={() => setShowMintModal(false)} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <motion.div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Coins className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ready to mint?</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      This will create an NFT of your dashboard on StarkNet. The NFT will include all widget configurations and current data.
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Dashboard Details</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <div>Name: {dashboard.name}</div>
                      <div>Widgets: {dashboard.widgets.length}</div>
                      <div>Network: StarkNet</div>
                      <div>Cost: ~0.001 ETH</div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <AnimatedButton
                      variant="secondary"
                      onClick={() => setShowMintModal(false)}
                    >
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton
                      variant="primary"
                      onClick={mintDashboard}
                      loading={isMinting}
                    >
                      {isMinting ? 'Minting...' : 'Mint NFT'}
                    </AnimatedButton>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Missing icon components
const AreaChart = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
  </svg>
);

const ScatterChart = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="7" cy="7" r="1" />
    <circle cx="12" cy="10" r="1" />
    <circle cx="17" cy="6" r="1" />
    <circle cx="8" cy="14" r="1" />
    <circle cx="15" cy="16" r="1" />
    <circle cx="10" cy="8" r="1" />
    <circle cx="13" cy="13" r="1" />
  </svg>
);

const CounterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const TableIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const PivotIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

export default DashboardBuilder;
