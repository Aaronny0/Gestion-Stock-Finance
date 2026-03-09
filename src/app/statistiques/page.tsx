'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { FiTrendingUp, FiTrendingDown, FiMinus, FiAward, FiPackage, FiDollarSign } from 'react-icons/fi';
import { motion, Variants } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

interface TopProduct {
    model: string;
    brandName: string;
    totalQuantity: number;
    totalRevenue: number;
}

interface TopBrand {
    name: string;
    totalRevenue: number;
    totalUnits: number;
}

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];

export default function StatistiquesPage() {
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [topBrands, setTopBrands] = useState<TopBrand[]>([]);
    const [totalGlobalRevenue, setTotalGlobalRevenue] = useState(0);
    const [totalUnitsSold, setTotalUnitsSold] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // New Calendar logic
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
    const [trendData, setTrendData] = useState<Map<string, { qtyDiff: number }>>(new Map());

    const loadData = useCallback(async () => {
        try {
            // Calculate Current Valid Month Bounds
            const targetDate = new Date(selectedYear, selectedMonth, 1);
            const startDate = startOfMonth(targetDate);
            const endDate = endOfMonth(targetDate);
            
            const startDateStr = format(startDate, "yyyy-MM-dd'T'00:00:00");
            const endDateStr = format(endDate, "yyyy-MM-dd'T'23:59:59");
            
            // Calculate Previous Month Bounds for Trends
            const prevTargetDate = subMonths(targetDate, 1);
            const prevStartDateStr = format(startOfMonth(prevTargetDate), "yyyy-MM-dd'T'00:00:00");
            const prevEndDateStr = format(endOfMonth(prevTargetDate), "yyyy-MM-dd'T'23:59:59");

            // Fetch Current Month and Previous Month in parallel
            const [currentSalesRes, prevSalesRes] = await Promise.all([
                supabase
                    .from('sales')
                    .select('quantity, total_price, products(model, brands(name))')
                    .gte('created_at', startDateStr)
                    .lte('created_at', endDateStr),
                supabase
                    .from('sales')
                    .select('quantity, products(model, brands(name))')
                    .gte('created_at', prevStartDateStr)
                    .lte('created_at', prevEndDateStr)
            ]);

            if (currentSalesRes.error) throw currentSalesRes.error;
            if (prevSalesRes.error) throw prevSalesRes.error;

            let globalRev = 0;
            let globalUnits = 0;

            const productMap = new Map<string, TopProduct>();
            const brandMap = new Map<string, TopBrand>();

            currentSalesRes.data?.forEach(sale => {
                const qty = sale.quantity || 0;
                const rev = Number(sale.total_price) || 0;
                globalRev += rev;
                globalUnits += qty;

                const prod = sale.products as any;
                if (!prod) return;
                
                const model = prod.model || 'Inconnu';
                const brandName = prod.brands?.name || 'Inconnue';
                const productKey = `${brandName} ${model}`;

                // Aggregate by Product
                if (productMap.has(productKey)) {
                    const existing = productMap.get(productKey)!;
                    existing.totalQuantity += qty;
                    existing.totalRevenue += rev;
                } else {
                    productMap.set(productKey, { model, brandName, totalQuantity: qty, totalRevenue: rev });
                }

                // Aggregate by Brand
                if (brandMap.has(brandName)) {
                    const existing = brandMap.get(brandName)!;
                    existing.totalRevenue += rev;
                    existing.totalUnits += qty;
                } else {
                    brandMap.set(brandName, { name: brandName, totalRevenue: rev, totalUnits: qty });
                }
            });

            // Aggregate Previous Month logic
            const prevProductMap = new Map<string, number>();
            prevSalesRes.data?.forEach(sale => {
                const qty = sale.quantity || 0;
                const prod = sale.products as any;
                if (!prod) return;
                const productKey = `${prod.brands?.name || 'Inconnue'} ${prod.model || 'Inconnu'}`;
                prevProductMap.set(productKey, (prevProductMap.get(productKey) || 0) + qty);
            });

            setTotalGlobalRevenue(globalRev);
            setTotalUnitsSold(globalUnits);

            // Sort and take top 10 products
            // 1. By Quantity (descending)
            // 2. By Revenue (descending) if quantity is equal
            const sortedProducts = Array.from(productMap.values())
                .sort((a, b) => {
                    if (b.totalQuantity !== a.totalQuantity) {
                        return b.totalQuantity - a.totalQuantity;
                    }
                    return b.totalRevenue - a.totalRevenue;
                })
                .slice(0, 10);
            
            setTopProducts(sortedProducts);

            // Sort and take top brands by revenue
            const sortedBrands = Array.from(brandMap.values())
                .sort((a, b) => b.totalRevenue - a.totalRevenue);
            
            setTopBrands(sortedBrands);

            // Compute Trends
            const newTrends = new Map<string, { qtyDiff: number }>();
            sortedProducts.forEach(p => {
                const productKey = `${p.brandName} ${p.model}`;
                const prevQty = prevProductMap.get(productKey) || 0;
                newTrends.set(productKey, { qtyDiff: p.totalQuantity - prevQty });
            });
            setTrendData(newTrends);

        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        loadData();

        // Realtime Subscription
        const channel = supabase
            .channel('public:sales:stats')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'sales' },
                () => {
                    console.log('Realtime update received! Reloading stats...');
                    loadData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadData]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span>Analyse des données en cours...</span>
            </div>
        );
    }

    return (
        <motion.div 
            className="animate-in"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="page-header">
                <div>
                    <h2 className="page-title">Statistiques &amp; Performances</h2>
                    <p className="page-subtitle">Analysez vos meilleures ventes et marques les plus rentables</p>
                </div>
            </div>

            {/* Month & Year Selectors */}
            <motion.div variants={itemVariants} style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '24px',
                background: 'var(--bg-tertiary)',
                padding: '8px',
                borderRadius: 'var(--radius)',
                width: 'fit-content'
            }}>
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="form-select"
                    style={{ width: 'auto', minWidth: '150px' }}
                >
                    {MONTHS.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                    ))}
                </select>

                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="form-select"
                    style={{ width: 'auto' }}
                >
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                         <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </motion.div>

            {/* KPIs */}
            <motion.div className="grid-4" variants={itemVariants} style={{ marginBottom: '24px' }}>
                <div className="card" style={{ 
                    background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
                    borderLeft: '4px solid var(--accent-primary)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ padding: '10px', background: 'var(--accent-primary-glow)', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                            <FiDollarSign size={24} />
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Chiffre d&apos;Affaires Global</div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatCurrency(totalGlobalRevenue)}
                    </div>
                </div>

                <div className="card" style={{ 
                    background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
                    borderLeft: '4px solid var(--success)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)' }}>
                            <FiPackage size={24} />
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Unités Vendues</div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {totalUnitsSold}
                    </div>
                </div>
            </motion.div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Top Products Chart */}
                <motion.div className="card" variants={itemVariants}>
                    <div className="card-header" style={{ marginBottom: '24px' }}>
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiTrendingUp color="var(--accent-primary)" /> Top 10 Produits (Quantité)
                        </div>
                    </div>
                    <div style={{ height: '350px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis 
                                    dataKey="model" 
                                    stroke="var(--text-muted)" 
                                    fontSize={12}
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                    height={80}
                                />
                                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                                <Tooltip 
                                    cursor={{ fill: 'var(--bg-tertiary)' }}
                                    contentStyle={{ 
                                        backgroundColor: 'var(--bg-secondary)', 
                                        borderColor: 'var(--border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)'
                                    }}
                                    formatter={((value: number) => [`${value} unités`, 'Ventes']) as any}
                                />
                                <Bar 
                                    dataKey="totalQuantity" 
                                    fill="url(#colorTotal)" 
                                    radius={[4, 4, 0, 0]}
                                    animationDuration={1500}
                                />
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.2}/>
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Top Brands Chart */}
                <motion.div className="card" variants={itemVariants}>
                    <div className="card-header" style={{ marginBottom: '24px' }}>
                        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiAward color="var(--warning)" /> Répartition CA par Marque
                        </div>
                    </div>
                    <div style={{ height: '350px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={topBrands}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="totalRevenue"
                                    nameKey="name"
                                    animationDuration={1500}
                                >
                                    {topBrands.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={((value: number) => [formatCurrency(value), 'Chiffre d\'Affaires']) as any}
                                    contentStyle={{ 
                                        backgroundColor: 'var(--bg-secondary)', 
                                        borderColor: 'var(--border)',
                                        borderRadius: 'var(--radius-sm)'
                                    }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Detailed Top Products List (Animated List) */}
            <motion.div className="section" style={{ marginTop: '24px' }} variants={itemVariants}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiAward color="var(--accent-primary)" /> Palmarès Détaillé des Produits
                </h3>
                <div className="grid-3">
                    {topProducts.slice(0, 6).map((product, index) => (
                        <motion.div 
                            key={index} 
                            className="card"
                            whileHover={{ scale: 1.02, translateY: -4 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            style={{
                                position: 'relative',
                                overflow: 'hidden',
                                border: index === 0 ? '1px solid var(--warning)' : '1px solid var(--border)'
                            }}
                        >
                            {index === 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: 12,
                                    right: -24,
                                    background: 'var(--warning)',
                                    color: '#000',
                                    padding: '4px 32px',
                                    transform: 'rotate(45deg)',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                                    zIndex: 10
                                }}>
                                    #1 Bestseller
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ 
                                    width: '40px', height: '40px', 
                                    borderRadius: '50%', 
                                    background: index === 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-tertiary)',
                                    color: index === 0 ? 'var(--warning)' : 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '18px', fontWeight: 800
                                }}>
                                    #{index + 1}
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {product.brandName}
                                    </div>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '16px' }}>
                                        {product.model}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ventes</div>
                                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {product.totalQuantity} <span style={{fontSize:'12px', fontWeight:400, color:'var(--text-muted)'}}>unités</span>
                                        </div>
                                    </div>
                                    
                                    {/* Trend Indicator */}
                                    {trendData.has(`${product.brandName} ${product.model}`) && (
                                        <div style={{ 
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            fontSize: '12px', fontWeight: 700,
                                            padding: '4px 8px', borderRadius: '12px',
                                            color: trendData.get(`${product.brandName} ${product.model}`)!.qtyDiff > 0 ? 'var(--success)' : 
                                                   trendData.get(`${product.brandName} ${product.model}`)!.qtyDiff < 0 ? 'var(--error)' : 'var(--text-muted)',
                                            background: trendData.get(`${product.brandName} ${product.model}`)!.qtyDiff > 0 ? 'rgba(16, 185, 129, 0.1)' : 
                                                        trendData.get(`${product.brandName} ${product.model}`)!.qtyDiff < 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)'
                                        }}>
                                            {trendData.get(`${product.brandName} ${product.model}`)!.qtyDiff > 0 ? <FiTrendingUp /> : 
                                             trendData.get(`${product.brandName} ${product.model}`)!.qtyDiff < 0 ? <FiTrendingDown /> : <FiMinus />}
                                            {Math.abs(trendData.get(`${product.brandName} ${product.model}`)!.qtyDiff)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Généré</div>
                                    <div style={{ fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(product.totalRevenue)}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
