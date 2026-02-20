'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { FiRepeat, FiArrowRight, FiCheck, FiTrendingUp, FiTrendingDown, FiSearch, FiX, FiPackage } from 'react-icons/fi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMarques } from '@/hooks/useMarques';

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
    shop_phone_value: number | null;
    client_complement: number;
    trade_gain: number;
    notes: string | null;
    created_at: string;
    products?: { model: string; brands?: { name: string } };
    client_phone_description?: string;
    shop_phone_description?: string;
}

// ── Combobox Component ──────────────────────────────────────────────────────
interface ComboboxProps {
    products: Product[];
    value: string; // product id
    onChange: (productId: string) => void;
}

function ProductCombobox({ products, value, onChange }: ComboboxProps) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedProduct = products.find(p => p.id === value);

    // When a product is selected, show its label in the input
    useEffect(() => {
        if (selectedProduct) {
            setQuery(`${selectedProduct.brands?.name ?? ''} ${selectedProduct.model}`);
        } else {
            setQuery('');
        }
    }, [value, selectedProduct]);

    const filtered = products.filter(p => {
        if (!query || (selectedProduct && `${selectedProduct.brands?.name ?? ''} ${selectedProduct.model}` === query)) return true;
        const q = query.toLowerCase();
        return (
            p.model.toLowerCase().includes(q) ||
            (p.brands?.name ?? '').toLowerCase().includes(q)
        );
    });

    function handleSelect(p: Product) {
        onChange(p.id);
        setQuery(`${p.brands?.name ?? ''} ${p.model}`);
        setOpen(false);
    }

    function handleClear() {
        onChange('');
        setQuery('');
        inputRef.current?.focus();
    }

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                // If nothing valid is typed, clear selection to avoid stale state
                if (!selectedProduct) {
                    setQuery('');
                } else {
                    setQuery(`${selectedProduct.brands?.name ?? ''} ${selectedProduct.model}`);
                }
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [selectedProduct]);

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
                <FiSearch style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                    pointerEvents: 'none', zIndex: 1,
                }} />
                <input
                    ref={inputRef}
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '36px', paddingRight: value ? '36px' : '12px' }}
                    placeholder="Rechercher un produit... (marque, modèle)"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange(''); // clear selection when typing
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    autoComplete="off"
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        style={{
                            position: 'absolute', right: '10px', top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                            padding: '2px',
                        }}
                        tabIndex={-1}
                    >
                        <FiX size={14} />
                    </button>
                )}
            </div>

            {open && filtered.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0, right: 0,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    zIndex: 1000,
                    maxHeight: '260px',
                    overflowY: 'auto',
                }}>
                    {filtered.map((p) => {
                        const isSelected = p.id === value;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    padding: '10px 14px',
                                    background: isSelected ? 'rgba(99,102,241,0.12)' : 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid var(--border)',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    gap: '10px',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)'; }}
                                onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                            >
                                <span className="badge badge-purple" style={{ flexShrink: 0, fontSize: '11px' }}>
                                    {p.brands?.name ?? '—'}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                                    {p.model}
                                </span>
                                <span style={{
                                    fontSize: '12px',
                                    padding: '2px 8px',
                                    borderRadius: '99px',
                                    background: p.quantity > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                                    color: p.quantity > 0 ? 'var(--success)' : 'var(--danger)',
                                    flexShrink: 0,
                                }}>
                                    Stock: {p.quantity}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {open && query.length > 0 && filtered.length === 0 && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0, right: 0,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    zIndex: 1000,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}>
                    Aucun produit trouvé pour « {query} »
                </div>
            )}
        </div>
    );
}
// ────────────────────────────────────────────────────────────────────────────

export default function TrocPage() {
    const { showToast } = useToast();
    const { marques, loading: marquesLoading } = useMarques();
    const [products, setProducts] = useState<Product[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Téléphone CLIENT (repris) ──
    const [clientBrand, setClientBrand] = useState('');
    const [clientModel, setClientModel] = useState('');
    const [clientValue, setClientValue] = useState('');
    const [clientDescription, setClientDescription] = useState('');

    // ── Téléphone BOUTIQUE (donné) ──
    const [shopProductId, setShopProductId] = useState('');
    const [shopPrice, setShopPrice] = useState('');
    const [shopPhoneValue, setShopPhoneValue] = useState('');
    const [shopDescription, setShopDescription] = useState('');

    // Complément & notes
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

    useEffect(() => { loadData(); }, [loadData]);

    // Auto-fill shop phone price & infos depuis le produit sélectionné
    const selectedShopProduct = products.find(p => p.id === shopProductId);
    useEffect(() => {
        if (selectedShopProduct) {
            setShopPrice(selectedShopProduct.unit_price?.toString() || '');
        } else {
            setShopPrice('');
        }
    }, [shopProductId, selectedShopProduct]);

    // Calcul du gain (preview)
    const gain = (parseFloat(complement) || 0) + (parseFloat(clientValue) || 0) - (parseFloat(shopPrice) || 0);

    // ── Ajoute le tél. client au stock après un troc ──────────────────────────
    async function addClientPhoneToStock(
        brandName: string,
        model: string,
        description: string,
        estimatedValue: number | null
    ) {
        // 1. Trouver la marque par nom
        const { data: brandData } = await supabase
            .from('brands')
            .select('id')
            .ilike('name', brandName)
            .single();

        const brandId = brandData?.id;
        if (!brandId) {
            console.warn('Marque introuvable pour le téléphone client :', brandName);
            return;
        }

        // 2. Trouver ou créer le produit
        const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('brand_id', brandId)
            .ilike('model', model.trim())
            .single();

        let productId = existingProduct?.id;

        if (!productId) {
            const { data: newProduct } = await supabase
                .from('products')
                .insert({
                    brand_id: brandId,
                    model: model.trim(),
                    quantity: 0,
                    unit_price: estimatedValue ?? null,
                    description: description || `Repris via troc — ${new Date().toLocaleDateString('fr-FR')}`,
                })
                .select('id')
                .single();
            productId = newProduct?.id;
        }

        if (!productId) return;

        // 3. Ajouter une entrée de stock (+1)
        await supabase.from('stock_entries').insert({
            product_id: productId,
            quantity: 1,
            unit_price: estimatedValue ?? null,
            notes: `Récupéré via troc`,
        });
    }
    // ────────────────────────────────────────────────────────────────────────────

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
                shop_phone_value: shopPhoneValue ? parseFloat(shopPhoneValue) : null,
                shop_phone_description: shopDescription || null,
                client_complement: parseFloat(complement) || 0,
                notes: notes || null,
            });

            if (error) throw error;

            // ✅ Ajouter le téléphone du client au stock (avoir)
            await addClientPhoneToStock(
                clientBrand,
                clientModel,
                clientDescription,
                clientValue ? parseFloat(clientValue) : null
            );

            showToast('Troc enregistré — tél. client ajouté au stock !', 'success');
            setClientBrand(''); setClientModel(''); setClientValue(''); setClientDescription('');
            setShopProductId(''); setShopPrice(''); setShopPhoneValue(''); setShopDescription('');
            setComplement('0'); setNotes('');
            loadData();
        } catch (error: unknown) {
            console.error('Trade error:', error);
            showToast(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
        } finally {
            setSubmitting(false);
        }
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';

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

            {/* Info banner */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                marginBottom: '20px', fontSize: '13px', color: 'var(--success)',
            }}>
                <FiPackage />
                <span>Le téléphone repris au client est automatiquement ajouté à votre stock comme avoir.</span>
            </div>

            <form onSubmit={handleTrade}>
                <div className="trade-flow">

                    {/* ── Côté CLIENT ── */}
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
                                disabled={marquesLoading}
                            >
                                <option value="">{marquesLoading ? 'Chargement...' : 'Sélectionner'}</option>
                                {marques.map((m) => (
                                    <option key={m.id} value={m.name}>{m.name}</option>
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
                                placeholder="Optionnel — FCFA"
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
                                placeholder="État, couleur, rayures..."
                                value={clientDescription}
                                onChange={(e) => setClientDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* ── Flèche ── */}
                    <div className="trade-arrow">
                        <FiArrowRight />
                    </div>

                    {/* ── Côté BOUTIQUE ── */}
                    <div className="trade-section">
                        <div className="trade-section-title" style={{ color: 'var(--accent-primary-hover)' }}>
                            🏪 Téléphone Boutique (Donné)
                        </div>

                        <div className="form-group">
                            <label className="form-label">Produit du Stock *</label>
                            <ProductCombobox
                                products={products}
                                value={shopProductId}
                                onChange={setShopProductId}
                            />
                            {shopProductId && selectedShopProduct && (
                                <span className="form-hint" style={{ marginTop: '4px', display: 'block' }}>
                                    ✅ {selectedShopProduct.brands?.name} {selectedShopProduct.model} — {selectedShopProduct.quantity} en stock
                                </span>
                            )}
                        </div>

                        {/* Marque auto-remplie */}
                        <div className="form-group">
                            <label className="form-label">Marque</label>
                            <input
                                type="text"
                                className="form-input"
                                value={selectedShopProduct?.brands?.name || ''}
                                readOnly
                                placeholder="Auto depuis le produit"
                                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                            />
                        </div>

                        {/* Modèle auto-rempli */}
                        <div className="form-group">
                            <label className="form-label">Modèle</label>
                            <input
                                type="text"
                                className="form-input"
                                value={selectedShopProduct?.model || ''}
                                readOnly
                                placeholder="Auto depuis le produit"
                                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Prix de Vente Boutique *</label>
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
                            <label className="form-label">Valeur Marchande Estimée Boutique</label>
                            <input
                                type="number"
                                className="form-input"
                                value={shopPhoneValue}
                                onChange={(e) => setShopPhoneValue(e.target.value)}
                                placeholder="Optionnel — FCFA"
                            />
                            <span className="form-hint">Valeur marchande estimée du téléphone donné</span>
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

                {/* Complément + Preview Gain */}
                <div className="card" style={{ margin: '20px 0' }}>
                    <div className="form-row" style={{ alignItems: 'flex-end' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Complément Versé par le Client (FCFA)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={complement}
                                onChange={(e) => setComplement(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {(shopPrice || complement || clientValue) && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: '12px',
                            marginTop: '16px',
                        }}>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                                <div className="stat-label">Tél. Client Estimé</div>
                                <div style={{ fontWeight: 700, color: 'var(--info)' }}>
                                    {clientValue ? formatCurrency(parseFloat(clientValue)) : '—'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                                <div className="stat-label">Complément Versé</div>
                                <div style={{ fontWeight: 700, color: 'var(--accent-primary-hover)' }}>
                                    {formatCurrency(parseFloat(complement) || 0)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
                                <div className="stat-label">Prix Boutique</div>
                                <div style={{ fontWeight: 700, color: 'var(--warning)' }}>
                                    {shopPrice ? formatCurrency(parseFloat(shopPrice)) : '—'}
                                </div>
                            </div>
                            <div className={`gain-display ${gain >= 0 ? 'positive' : 'negative'}`}>
                                <div className="gain-label">{gain >= 0 ? '📈 Gain Gérant' : '📉 Perte'}</div>
                                <div className={`gain-value ${gain >= 0 ? 'positive' : 'negative'}`}>
                                    {gain >= 0 ? '+' : ''}{formatCurrency(gain)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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

            {/* Historique */}
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
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
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

                {trades.length > 0 && (
                    <div style={{ display: 'flex', gap: '24px', justifyContent: 'flex-end', marginTop: '16px', fontSize: '14px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            <strong>{trades.length}</strong> troc{trades.length > 1 ? 's' : ''}
                        </span>
                        <span style={{
                            fontWeight: 700,
                            color: trades.reduce((s, t) => s + Number(t.trade_gain), 0) >= 0 ? 'var(--success)' : 'var(--danger)'
                        }}>
                            Gain total : {formatCurrency(trades.reduce((s, t) => s + Number(t.trade_gain), 0))}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
