import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { 
  ShoppingBagIcon, 
  MagnifyingGlassIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

export default function OrgMarketplace() {
  const { t } = useTranslation();
  const { authGet } = useAuth('orgLeader');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { value: 'all', label: t('marketplace.categories.all', 'All Products') },
    { value: 'sensory', label: t('marketplace.categories.sensory', 'Sensory') },
    { value: 'motor', label: t('marketplace.categories.motor', 'Motor Skills') },
    { value: 'cognitive', label: t('marketplace.categories.cognitive', 'Cognitive') }
  ];

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const categoryParam = category !== 'all' ? `&category=${category}` : '';
      const data = await authGet(`/marketplace/products?limit=50${categoryParam}`, { ttl: 60_000 });
      setProducts(Array.isArray(data) ? data : data?.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      product.title?.toLowerCase().includes(search) ||
      product.description?.toLowerCase().includes(search) ||
      product.category?.toLowerCase().includes(search)
    );
  });

  const formatPrice = (price) => {
    if (!price) return t('marketplace.free', 'Free');
    return `${price} TND`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('orgDashboard.marketplace.title', 'Marketplace')}
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {t('orgDashboard.marketplace.subtitle', 'Browse educational tools and resources')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('marketplace.search', 'Search products...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-900 dark:text-slate-100"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700">
          <ShoppingBagIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400">
            {searchTerm 
              ? t('marketplace.noResults', 'No products found')
              : t('marketplace.noProducts', 'No products available')
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div 
              key={product._id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Product Image */}
              {product.imageUrl ? (
                <div className="aspect-video bg-slate-100 dark:bg-slate-800">
                  <img 
                    src={product.imageUrl} 
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <ShoppingBagIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                </div>
              )}

              {/* Product Info */}
              <div className="p-4">
                {/* Category Badge */}
                {product.category && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-2">
                    {product.category}
                  </span>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 line-clamp-2">
                  {product.title || t('marketplace.untitled', 'Untitled Product')}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                  {product.description}
                </p>

                {/* Rating */}
                {product.rating > 0 && (
                  <div className="flex items-center gap-1 mb-3">
                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {product.rating.toFixed(1)}
                    </span>
                    {product.reviewCount > 0 && (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        ({product.reviewCount})
                      </span>
                    )}
                  </div>
                )}

                {/* Price & Link */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  {product.externalUrl && (
                    <a
                      href={product.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {t('marketplace.view', 'View')}
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
