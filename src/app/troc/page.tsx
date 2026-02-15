'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { FiRepeat, FiArrowRight, FiCheck, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Product {
    id: string;
    model: string;
    unit_price: number | null;
    quantity: number;
    brands?: { name: string };
}

interface Trade {
    id: string;
    client_phone_brand: string;
    client_phone_model: string;
    client_phone_value: number | null;
    shop_product_id: string;
    shop_phone_price: number;
    client_complement: number;
    trade_gain: number;
    notes: string | null;
    created_at: string;
    products?: { model: string; brands?: { name: string } };
    client_phone_description?: string;
    shop_phone_description?: string;
}

const BRANDS_LIST = ['ITEL', 'TECNO', 'INFINIX', 'SAMSUNG', 'APPLE', 'REDMI', 'GOOGLE PIXEL', 'AUTRE'];

export default function TrocPage() {
    const { showToast } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);

    // Client phone (received)
    const [clientBrand, setClientBrand] = useState('');
    const [clientModel, setClientModel] = useState('');
    const [clientValue, setClientValue] = useState('');
    const [clientDescription, setClientDescription] = useState('');

    // Shop phone (given)
    const [shopProductId, setShopProductId] = useState('');
    const [shopPrice, setShopPrice] = useState('');
    const [shopDescription, setShopDescription] = useState('');

    // Complement
    const [complement, setComplement] = useState('0');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const { data: prods } = await supabase
                .from('products')
                .select('*, brands(name)')
                .gt('quantity', 0)
                .order('model');
            setProducts(prods || []);

            const { data: tradesData } = await supabase
                .from('trades')
                .select('*, products(model, brands(name))')
                .order('created_at', { ascending: false })
                .limit(50);
            setTrades(tradesData || []);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-fill shop phone price
    useEffect(() => {
        if (shopProductId) {
            const product = products.find(p => p.id === shopProductId);
            if (product?.unit_price) {
                setShopPrice(product.unit_price.toString());
            } else {
                setShopPrice('');
            }
        }
    }, [shopProductId, products]);

    // Calculate gain
    const calcGain = () => {
        const comp = parseFloat(complement) || 0;
        const clientVal = parseFloat(clientValue) || 0;
        const shopPr = parseFloat(shopPrice) || 0;
        return comp + clientVal - shopPr;
    };

    const gain = calcGain();

    async function handleTrade(e: React.FormEvent) {
        e.preventDefault();
        if (!clientBrand || !clientModel || !shopProductId || !shopPrice) {
            showToast('Veuillez remplir tous les champs requis', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase.from('trades').insert({
                client_phone_brand: clientBrand,
                client_phone_model: clientModel.trim(),
                client_phone_value: clientValue ? parseFloat(clientValue) : null,
                client_phone_description: clientDescription || null,
                shop_product_id: shopProductId,
                shop_phone_price: parseFloat(shopPrice),
                shop_phone_description: shopDescription || null,
                client_complement: parseFloat(complement) || 0,
                notes: notes || null,
            });

            if (error) throw error;

            showToast('Troc enregistré avec succès !', 'success');
            // Reset
            setClientBrand('');
            setClientModel('');
            setClientValue('');
            setClientDescription('');
            setShopProductId('');
            setShopPrice('');
            setShopDescription('');
            setComplement('0');
            setNotes('');
            loadData();
        } catch (error: unknown) {
            console.error('Trade error:', error);
            const errMsg = error instanceof Error ? error.message : 'Erreur inconnue';
            showToast(`Erreur: ${errMsg}`, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span>Chargement des trocs...</span>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h2 className="page-title">Troc / Échanges</h2>
                    <p className="page-subtitle">Enregistrez les échanges de téléphones avec vos clients</p>
                </div>
            </div>

            {/* Trade Form */}
            <form onSubmit={handleTrade}>
                <div className="trade-flow">
                    {/* Client Side - Phone Received */}
                    <div className="trade-section">
                        <div className="trade-section-title" style={{ color: 'var(--info)' }}>
                            📱 Téléphone Client (Repris)
                        </div>
                        <div className="form-group">
                            <label className="form-label">Marque *</label>
                            <select
                                className="form-select"
                                value={clientBrand}
                                onChange={(e) => setClientBrand(e.target.value)}
                                required
                            >
                                <option value="">Sélectionner</option>
                                {BRANDS_LIST.map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Modèle *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ex: iPhone 13"
                                value={clientModel}
                                onChange={(e) => setClientModel(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Valeur Marchande Estimée</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Optionnel - FCFA"
                                value={clientValue}
                                onChange={(e) => setClientValue(e.target.value)}
                            />
                            <span className="form-hint">Estimation du prix du téléphone repris</span>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description Client</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="État, couleur..."
                                value={clientDescription}
                                onChange={(e) => setClientDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="trade-arrow">
                        <FiArrowRight />
                    </div>

                    {/* Shop Side - Phone Given */}
                    <div className="trade-section">
                        <div className="trade-section-title" style={{ color: 'var(--accent-primary-hover)' }}>
                            🏪 Téléphone Boutique (Donné)
                        </div>
                        <div className="form-group">
                            <label className="form-label">Produit Boutique *</label>
                            <select
                                className="form-select"
                                value={shopProductId}
                                onChange={(e) => setShopProductId(e.target.value)}
                                required
                            >
                                <option value="">Sélectionner un produit</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.brands?.name} {p.model} (Stock: {p.quantity})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Prix du Téléphone Boutique *</label>
                            <input
                                type="number"
                                className="form-input"
                                value={shopPrice}
                                onChange={(e) => setShopPrice(e.target.value)}
                                placeholder="FCFA"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Complément Client (versé) *</label>
                            <input
                                type="number"
                                className="form-input"
                                value={complement}
                                onChange={(e) => setComplement(e.target.value)}
                                placeholder="Montant versé par le client"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description Boutique</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="État, accessoires..."
                                value={shopDescription}
                                onChange={(e) => setShopDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Gain Display */}
                {(shopPrice || complement || clientValue) && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                        margin: '20px 0'
                    }}>
                        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                            <div className="stat-label">Téléphone Client</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--info)' }}>
                                {clientValue ? formatCurrency(parseFloat(clientValue)) : '—'}
                            </div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                            <div className="stat-label">Complément Versé</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-primary-hover)' }}>
                                {formatCurrency(parseFloat(complement) || 0)}
                            </div>
                        </div>
                        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                            <div className="stat-label">Téléphone Boutique</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--warning)' }}>
                                {shopPrice ? formatCurrency(parseFloat(shopPrice)) : '—'}
                            </div>
                        </div>
                        <div className={`gain-display ${gain >= 0 ? 'positive' : 'negative'}`}>
                            <div className="gain-label">
                                {gain >= 0 ? '📈 Gain du Gérant' : '📉 Perte'}
                            </div>
                            <div className={`gain-value ${gain >= 0 ? 'positive' : 'negative'}`}>
                                {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
                            </div>
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Notes</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Notes optionnelles..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
                    {submitting ? <span className="loading-spinner" /> : <FiRepeat />}
                    Enregistrer le Troc
                </button>
            </form>

            {/* Trade History */}
            <div className="section" style={{ marginTop: '32px' }}>
                <h3 className="section-title">Historique des Trocs</h3>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Tél. Client (Repris)</th>
                                <th>Valeur Client</th>
                                <th>Tél. Boutique (Donné)</th>
                                <th>Prix Boutique</th>
                                <th>Complément</th>
                                <th>Gain</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trades.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">🔄</div>
                                            <div className="empty-state-text">Aucun troc enregistré</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                trades.map((t) => (
                                    <tr key={t.id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                            {format(new Date(t.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {t.client_phone_brand} {t.client_phone_model}
                                            </span>
                                            {t.client_phone_description && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    {t.client_phone_description}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {t.client_phone_value
                                                ? formatCurrency(Number(t.client_phone_value))
                                                : <span style={{ color: 'var(--text-muted)' }}>Non estimé</span>
                                            }
                                        </td>
                                        <td>
                                            <span className="badge badge-purple" style={{ marginRight: '4px' }}>
                                                {t.products?.brands?.name}
                                            </span>
                                            {t.products?.model}
                                            {t.shop_phone_description && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    {t.shop_phone_description}
                                                </div>
                                            )}
                                        </td>
                                        <td>{formatCurrency(Number(t.shop_phone_price))}</td>
                                        <td style={{ fontWeight: 600 }}>
                                            {formatCurrency(Number(t.client_complement))}
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontWeight: 700,
                                                color: Number(t.trade_gain) >= 0 ? 'var(--success)' : 'var(--danger)',
                                            }}>
                                                {Number(t.trade_gain) >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                                                {Number(t.trade_gain) >= 0 ? '+' : ''}
                                                {formatCurrency(Number(t.trade_gain))}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Trades summary */}
                {trades.length > 0 && (
                    <div style={{
                        display: 'flex', gap: '24px', justifyContent: 'flex-end',
                        marginTop: '16px', fontSize: '14px'
                    }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            <strong>{trades.length}</strong> troc{trades.length > 1 ? 's' : ''}
                        </span>
                        <span style={{
                            fontWeight: 700,
                            color: trades.reduce((s, t) => s + Number(t.trade_gain), 0) >= 0
                                ? 'var(--success)' : 'var(--danger)'
                        }}>
                            Gain total : {formatCurrency(trades.reduce((s, t) => s + Number(t.trade_gain), 0))}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
