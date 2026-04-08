import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  MoreVertical,
  ExternalLink,
  Copy,
  Upload,
} from 'lucide-react';
import { mockProducts, mockCategories } from '@/data/mockData';
import { Product } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

const AdminProductsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleVisibility = (productId: string) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, isVisible: !p.isVisible } : p
      )
    );
  };

  const deleteProduct = (productId: string) => {
    if (confirm(t.confirmDeleteProduct)) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
    setMenuOpen(null);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.adminProducts}</h1>
          <p className="text-gray-500">{products.length} {t.productCount}</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/products/import"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <Upload className="w-5 h-5" />
            {t.importFromUrl}
          </Link>
          <Link
            to="/admin/products/add"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            {t.addProduct}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t.searchProducts}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t.allCategories}</option>
            {mockCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-5 h-5" />
            {t.moreFilters}
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t.adminProducts}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t.category}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t.price}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t.stockQuantity}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t.dateAdded}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t.status}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const category = mockCategories.find(c => c.id === product.categoryId);
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={product.images[0]?.url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.sourceUrl && (
                            <a
                              href={product.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {t.source}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {category?.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatPrice(product.price)} {t.rial}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${
                        product.stock > 10 ? 'text-green-600' :
                        product.stock > 0 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {product.stock} {t.units}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.isVisible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.isVisible ? t.visible : t.hidden}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === product.id ? null : product.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>

                        {menuOpen === product.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpen(null)}
                            />
                            <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                              <Link
                                to={`/admin/products/edit/${product.id}`}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                              >
                                <Edit className="w-4 h-4" />
                                {t.edit}
                              </Link>
                              <button
                                onClick={() => toggleVisibility(product.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                              >
                                {product.isVisible ? (
                                  <>
                                    <EyeOff className="w-4 h-4" />
                                    {t.hidden}
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" />
                                    {t.show}
                                  </>
                                )}
                              </button>
                              <Link
                                to={`/product/${product.id}`}
                                target="_blank"
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-700"
                              >
                                <ExternalLink className="w-4 h-4" />
                                {t.viewProduct}
                              </Link>
                              <button
                                onClick={() => deleteProduct(product.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                {t.delete}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500">{t.noProducts}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
