'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { FiPlus, FiSearch, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Brand {
    id: string;
    name: string;
}

interface Product {
    id: string;
    brand_id: string;
    model: string;
    unit_price: number | null;
    quantity: number;
    created_at: string;
    updated_at: string;
    brands?: { name: string };
    description?: string;
}

const BRANDS_LIST = ['ITEL', 'TECNO', 'INFINIX', 'SAMSUNG', 'APPLE', 'REDMI', 'GOOGLE PIXEL', 'AUTRE'];

export default function StockPage() {
    const { showToast } = useToast();
    const [brands, setBrands] = useState<Brand[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterBrand, setFilterBrand] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [formBrand, setFormBrand] = useState('');
    const [formModel, setFormModel] = useState('');
    const [formQuantity, setFormQuantity] = useState('1');
    const [formPrice, setFormPrice] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Inline edit
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPrice, setEditPrice] = useState('');
    const [editQty, setEditQty] = useState('');

    const loadData = useCallback(async () => {
        try {
            const { data: brandsData } = await supabase
                .from('brands')
                .select('*')
                .order('name');
            setBrands(brandsData || []);

            let query = supabase
                .from('products')
                .select('*, brands(name)')
                .order('created_at', { ascending: false });

            if (filterBrand) {
                query = query.eq('brand_id', filterBrand);
            }

            const { data: productsData } = await query;
            setProducts(productsData || []);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    }, [filterBrand]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleAddProduct(e: React.FormEvent) {
        e.preventDefault();
        if (!formBrand || !formModel || !formQuantity) {
            showToast('Veuillez remplir les champs requis', 'error');
            return;
        }

        setSubmitting(true);
        try {
            // Check if product exists already
            const { data: existing } = await supabase
                .from('products')
                .select('id')
                .eq('brand_id', formBrand)
                .ilike('model', formModel.trim())
                .single();

            if (existing) {
                // Add stock entry to existing product
                await supabase.from('stock_entries').insert({
                    product_id: existing.id,
                    quantity: parseInt(formQuantity),
                    unit_price: formPrice ? parseFloat(formPrice) : null,
                });
                showToast('Stock mis à jour avec succès !', 'success');
            } else {
                // Create new product
                const { data: newProduct, error: createErr } = await supabase
                    .from('products')
                    .insert({
                        brand_id: formBrand,
                        model: formModel.trim(),
                        quantity: parseInt(formQuantity),
                        unit_price: formPrice ? parseFloat(formPrice) : null,
                        description: formDescription || null,
                    })
                    .select()
                    .single();

                if (createErr) throw createErr;

                // Also create stock entry
                if (newProduct) {
                    await supabase.from('stock_entries').insert({
                        product_id: newProduct.id,
                        quantity: parseInt(formQuantity),
                        unit_price: formPrice ? parseFloat(formPrice) : null,
                    });
                }
                showToast('Produit ajouté avec succès !', 'success');
            }

            // Reset form
            setFormModel('');
            setFormQuantity('1');
            setFormPrice('');
            setFormDescription('');
            setShowForm(false);
            loadData();
        } catch (error) {
            console.error('Add product error:', error);
            showToast('Erreur lors de l\'ajout', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    function startEdit(product: Product) {
        setEditingId(product.id);
        setEditPrice(product.unit_price?.toString() || '');
        setEditQty(product.quantity.toString());
    }

    async function saveEdit(productId: string) {
        try {
            const updates: Record<string, unknown> = {};
            if (editQty) updates.quantity = parseInt(editQty);
            if (editPrice) updates.unit_price = parseFloat(editPrice);
            else updates.unit_price = null;

            await supabase
                .from('products')
                .update(updates)
                .eq('id', productId);

            showToast('Produit mis à jour !', 'success');
            setEditingId(null);
            loadData();
        } catch (error) {
            console.error('Edit error:', error);
            showToast('Erreur lors de la mise à jour', 'error');
        }
    }

    const filteredProducts = products.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            p.model.toLowerCase().includes(q) ||
            p.brands?.name.toLowerCase().includes(q)
        );
    });

    const formatCurrency = (val: number | null) => {
        if (val === null || val === undefined) return '—';
        return new Intl.NumberFormat('fr-FR').format(val) + ' FCFA';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <span>Chargement du stock...</span>
            </div>
        );
    }

    return (
        <div className="animate-in">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">Stock & Inventaire</h2>
                    <p className="page-subtitle">Gérez vos produits et entrées de stock</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <FiPlus /> Ajouter un Produit
                </button>
            </div>

            {/* Add Product Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '24px', animation: 'scaleIn 0.2s ease' }}>
                    <div className="card-title" style={{ marginBottom: '16px' }}>
                        Nouveau Produit / Entrée de Stock
                    </div>
                    <form onSubmit={handleAddProduct}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Marque *</label>
                                <select
                                    className="form-select"
                                    value={formBrand}
                                    onChange={(e) => setFormBrand(e.target.value)}
                                    required
                                >
                                    <option value="">Sélectionner une marque</option>
                                    {brands.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Modèle *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ex: Hot 40i"
                                    value={formModel}
                                    onChange={(e) => setFormModel(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Quantité *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min="1"
                                    value={formQuantity}
                                    onChange={(e) => setFormQuantity(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Prix Unitaire</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Optionnel"
                                    value={formPrice}
                                    onChange={(e) => setFormPrice(e.target.value)}
                                />
                                <span className="form-hint">Le prix peut être renseigné plus tard</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                placeholder="Détails sur l'état, couleur, stockage..."
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                style={{ minHeight: '80px', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button type="submit" className="btn btn-success" disabled={submitting}>
                                {submitting ? <span className="loading-spinner" /> : <FiCheck />}
                                Valider
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="filter-bar">
                <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                    <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Rechercher un produit..."
                        style={{ paddingLeft: '36px' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="form-select"
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    style={{ width: 'auto', minWidth: '180px' }}
                >
                    <option value="">Toutes les marques</option>
                    {brands.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {/* Products Table */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Marque</th>
                            <th>Modèle</th>
                            <th>Description</th>
                            <th>Quantité</th>
                            <th>Prix Unitaire</th>
                            <th>Valeur Stock</th>
                            <th>Dernière MAJ</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={8}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📦</div>
                                        <div className="empty-state-text">Aucun produit en stock</div>
                                        <div className="empty-state-sub">Ajoutez votre premier produit ci-dessus</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredProducts.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <span className="badge badge-purple">{p.brands?.name}</span>
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.model}</td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                                        {p.description || '—'}
                                    </td>
                                    <td>
                                        {editingId === p.id ? (
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ width: '80px', padding: '4px 8px' }}
                                                value={editQty}
                                                onChange={(e) => setEditQty(e.target.value)}
                                                min="0"
                                            />
                                        ) : (
                                            <span className={`badge ${p.quantity > 5 ? 'badge-success' : p.quantity > 0 ? 'badge-warning' : 'badge-danger'}`}>
                                                {p.quantity}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === p.id ? (
                                            <input
                                                type="number"
                                                className="form-input"
                                                style={{ width: '120px', padding: '4px 8px' }}
                                                value={editPrice}
                                                onChange={(e) => setEditPrice(e.target.value)}
                                                placeholder="Optionnel"
                                            />
                                        ) : (
                                            formatCurrency(p.unit_price)
                                        )}
                                    </td>
                                    <td>
                                        {p.unit_price
                                            ? formatCurrency(p.unit_price * p.quantity)
                                            : '—'
                                        }
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                        {format(new Date(p.updated_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                                    </td>
                                    <td>
                                        {editingId === p.id ? (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button className="btn btn-success btn-sm" onClick={() => saveEdit(p.id)}>
                                                    <FiCheck />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                                                    <FiX />
                                                </button>
                                            </div>
                                        ) : (
                                            <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>
                                                <FiEdit2 /> Modifier
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            {filteredProducts.length > 0 && (
                <div style={{
                    display: 'flex', gap: '24px', justifyContent: 'flex-end',
                    marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)'
                }}>
                    <span>
                        <strong>{filteredProducts.length}</strong> produit{filteredProducts.length > 1 ? 's' : ''}
                    </span>
                    <span>
                        Total en stock : <strong>{filteredProducts.reduce((s, p) => s + p.quantity, 0)}</strong> unités
                    </span>
                </div>
            )}
        </div>
    );
}
