'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, BookOpen, Eye, Calendar, Clock, User, Bookmark, Share2, Facebook, Twitter, Linkedin, Link as LinkIcon, Heart, MessageCircle, TrendingUp, Sparkles, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'

export function BlogDetailPage({ post, relatedPosts }: any) {
  const [readingProgress, setReadingProgress] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.like_count || 0)
  const [commentCount, setCommentCount] = useState(post.comment_count || 0)

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrolled = (winScroll / height) * 100
      setReadingProgress(scrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const formatReadingTime = (minutes?: number) => {
    if (!minutes) return '5 dk okuma'
    return `${minutes} dk okuma`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    // Use UTC methods to avoid timezone differences between server and client
    const day = date.getUTCDate()
    const month = date.getUTCMonth()
    const year = date.getUTCFullYear()
    
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ]
    
    return `${day} ${monthNames[month]} ${year}`
  }

  const shareOnTwitter = () => {
    const text = `${post.title} - ${post.excerpt}`
    const url = window.location.href
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const shareOnFacebook = () => {
    const url = window.location.href
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  const shareOnLinkedIn = () => {
    const url = window.location.href
    const title = post.title
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link kopyalandı!')
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const toggleBookmark = () => {
    setBookmarked(!bookmarked)
  }

  const toggleLike = () => {
    if (liked) {
      setLikeCount(prev => prev - 1)
    } else {
      setLikeCount(prev => prev + 1)
    }
    setLiked(!liked)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/10">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,theme(colors.blue.300),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,theme(colors.blue.900),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,theme(colors.indigo.300),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,theme(colors.indigo.900),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,theme(colors.purple.200),transparent_50%)] dark:bg-[radial-gradient(circle_at_40%_40%,theme(colors.purple.900),transparent_50%)]" />
      </div>

      {/* Modern Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200/50 dark:bg-gray-700/50 z-50 backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300 shadow-lg"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Theme Toggle Button */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Modern Header */}
      <section className="relative py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog">
            <Button 
              variant="ghost" 
              size="sm"
              className="group mb-8 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              Blog'a Dön
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Image */}
      {post.coverImage && (
        <section className="relative px-6 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="relative h-64 md:h-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-blue-500 text-white border-0 px-3 py-1.5 rounded-full">
                    {post.category}
                  </Badge>
                  {post.featured && (
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-yellow-400/90 text-black rounded-full">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-sm font-medium">Öne Çıkan</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Article Content */}
      <section className="relative px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <article className="prose prose-lg max-w-none">
            {/* Modern Article Header */}
            <header className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent mb-6 leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed max-w-3xl mx-auto">
                  {post.excerpt}
                </p>
              )}

              {/* Enhanced Article Meta */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-10 pb-8 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-full">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {post.author?.name?.charAt(0).toUpperCase() || 'B'}
                    </span>
                  </div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">{post.author?.name || 'ButcApp Team'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatReadingTime(post.readingTime)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span>{post.views} görüntülenme</span>
                </div>
              </div>

              {/* Modern Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <button
                  onClick={toggleBookmark}
                  className={`group px-6 py-3 text-sm font-medium rounded-2xl transition-all duration-300 flex items-center gap-2 ${
                    bookmarked 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl hover:scale-105' 
                      : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80 hover:scale-105'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                  {bookmarked ? 'Kaydedildi' : 'Kaydet'}
                </button>

                <button
                  onClick={toggleLike}
                  className={`group px-6 py-3 text-sm font-medium rounded-2xl transition-all duration-300 flex items-center gap-2 ${
                    liked 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105' 
                      : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80 hover:scale-105'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                  {likeCount}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="group px-6 py-3 text-sm font-medium bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80 rounded-2xl transition-all duration-300 flex items-center gap-2 hover:scale-105"
                  >
                    <Share2 className="w-4 h-4" />
                    Paylaş
                  </button>

                  {showShareMenu && (
                    <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-2 z-50 min-w-[220px]">
                      <button
                        onClick={shareOnFacebook}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Facebook className="w-4 h-4 text-white" />
                        </div>
                        <span>Facebook</span>
                      </button>
                      <button
                        onClick={shareOnTwitter}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-xl transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                          <Twitter className="w-4 h-4 text-white" />
                        </div>
                        <span>Twitter</span>
                      </button>
                      <button
                        onClick={shareOnLinkedIn}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Linkedin className="w-4 h-4 text-white" />
                        </div>
                        <span>LinkedIn</span>
                      </button>
                      <button
                        onClick={copyLink}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-xl transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                          <LinkIcon className="w-4 h-4 text-white" />
                        </div>
                        <span>Linki Kopyala</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Article Content */}
            <div 
              className="prose prose-gray dark:prose-invert max-w-none bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-xl"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-20 pt-12 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 dark:from-white dark:to-blue-200 bg-clip-text text-transparent mb-4">
                  İlgili Makaleler
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Bu makaleyi beğendiyseniz, bunlar da ilginizi çekebilir
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost: any, index: number) => (
                  <Card key={relatedPost.id} className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md">
                    {relatedPost.coverImage && (
                      <div className="relative h-48 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <img
                          src={relatedPost.coverImage}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                        <Link href={`/blog/${relatedPost.slug}`} className="hover:underline">
                          {relatedPost.title}
                        </Link>
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {relatedPost.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatReadingTime(relatedPost.reading_time)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{relatedPost.view_count}</span>
                          </div>
                        </div>
                        <span>{formatDate(relatedPost.published_at)}</span>
                      </div>

                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Link href={`/blog/${relatedPost.slug}`}>
                          <Button 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            Oku
                            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  )
}