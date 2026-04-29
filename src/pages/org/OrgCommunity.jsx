import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { 
  UsersIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon,
  PhotoIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function OrgCommunity() {
  const { t } = useTranslation();
  const { authGet, authPost } = useAuth('orgLeader');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [page]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await authGet(`/community/posts?page=${page}&limit=20`);
      const newPosts = Array.isArray(data) ? data : data?.posts || [];
      
      if (page === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === 20);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
    setLoading(false);
  };

  const toggleLike = async (postId) => {
    try {
      await authPost(`/community/posts/${postId}/like`);
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          const hasLiked = post.likes?.includes(post.authorId);
          return {
            ...post,
            likesCount: hasLiked ? (post.likesCount || 1) - 1 : (post.likesCount || 0) + 1,
            hasLiked: !hasLiked
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('common.justNow', 'Just now');
    if (diffMins < 60) return t('common.minutesAgo', '{{count}} minutes ago', { count: diffMins });
    if (diffHours < 24) return t('common.hoursAgo', '{{count}} hours ago', { count: diffHours });
    if (diffDays < 7) return t('common.daysAgo', '{{count}} days ago', { count: diffDays });
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t('orgDashboard.community.title', 'Community Feed')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 md:mt-1">
          {t('orgDashboard.community.subtitle', 'Connect with families, specialists, and caregivers')}
        </p>
      </div>

      {/* Posts List */}
      <div className="space-y-3 md:space-y-4">
        {loading && page === 1 ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-8 md:p-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700">
            <UsersIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
              {t('orgDashboard.community.noPosts', 'No posts yet')}
            </p>
          </div>
        ) : (
          posts.map(post => (
            <div 
              key={post._id} 
              className="bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 p-4 md:p-6 hover:shadow-md transition-shadow"
            >
              {/* Author Info */}
              <div className="flex items-start gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm md:text-base">
                  {post.authorName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm md:text-base text-slate-900 dark:text-slate-100 truncate">
                    {post.authorName || t('common.anonymous', 'Anonymous')}
                  </p>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{formatDate(post.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="mb-3 md:mb-4">
                {post.title && (
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    {post.title}
                  </h3>
                )}
                <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>

              {/* Post Image */}
              {post.imageUrl && (
                <div className="mb-3 md:mb-4 rounded-lg overflow-hidden">
                  <img 
                    src={post.imageUrl} 
                    alt={post.title || t('orgDashboard.community.postImageAlt')}
                    className="w-full h-48 sm:h-56 md:h-64 object-cover"
                  />
                </div>
              )}

              {/* Post Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                  {post.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center flex-wrap gap-3 md:gap-4 pt-3 md:pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => toggleLike(post._id)}
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                >
                  {post.hasLiked ? (
                    <HeartSolidIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <HeartIcon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="text-xs md:text-sm font-medium">
                    {post.likesCount || 0}
                  </span>
                </button>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <ChatBubbleLeftIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs md:text-sm font-medium">
                    {post.commentsCount || 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && posts.length > 0 && (
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={loading}
          className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-primary font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {t('common.loading', 'Loading...')}
            </span>
          ) : (
            t('common.loadMore', 'Load More')
          )}
        </button>
      )}
    </div>
  );
}
