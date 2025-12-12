'use client'

import { useState, useEffect } from 'react'
import { Search, BookOpen, Eye, TrendingUp, Clock, Filter, Grid3X3, List, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/theme-toggle'
import { BlogPost, BlogCategory } from '@/types/blog'
import Link from 'next/link'
import Image from 'next/image'

interface BlogListingPageProps {
  initialPosts: BlogPost[]
  categories: BlogCategory[]
}

export function BlogListingPage({ initialPosts, categories }: BlogListingPageProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>(initialPosts)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'published_at' | 'view_count' | 'title'>('published_at')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  // Filter and sort posts
  useEffect(() => {
    let filtered = posts

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory)
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort posts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'view_count':
          return b.view_count - a.view_count
        case 'title':
          return a.title.localeCompare(b.title)
        case 'published_at':
        default:
          return new Date(b.published_at || '').getTime() - new Date(a.published_at || '').getTime()
      }
    })

    setFilteredPosts(filtered)
  }, [posts, selectedCategory, searchTerm, sortBy])

  // Load more posts
  const loadMore = async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const response = await fetch(`/api/local/blog?page=${page + 1}&limit=12`)
      const data = await response.json()

      if (data.success && data.data) {
        setPosts(prev => [...prev, ...data.data])
        setPage(prev => prev + 1)
        setHasMore(data.pagination?.page < data.pagination?.totalPages)
      }
    } catch (error) {
      console.error('Load more error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Format reading time
  const formatReadingTime = (minutes?: number) => {
    if (!minutes) return '5 dk okuma'
    return `${minutes} dk okuma`
  }

  // Format date
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/10">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,theme(colors.blue.300),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,theme(colors.blue.900),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,theme(colors.indigo.300),transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_20%,theme(colors.indigo.900),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,theme(colors.purple.200),transparent_50%)] dark:bg-[radial-gradient(circle_at_40%_40%,theme(colors.purple.900),transparent_50%)]" />
      </div>

      {/* Theme Toggle Button */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Modern Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:from-transparent dark:via-gray-900/50 dark:to-gray-900" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-200/50 dark:border-blue-800/50 rounded-full mb-6 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Finansal Portal</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent mb-6 leading-tight">
            Finansal Rehberiniz
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Kişisel finans, bütçe yönetimi ve yatırım stratejileriyle geleceğinizi bugünden şekillendirin.
          </p>
          
          {/* Back to Home Button */}
          <Link href="/">
            <Button 
              variant="ghost"
              className="group mb-12 text-base hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300"
            >
              <span className="mr-2">← Ana Sayfa</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>

          {/* Modern Search and Filters */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Enhanced Search Bar */}
            <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-500/30 dark:to-indigo-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <Input
                placeholder="Makalelerde ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="pl-14 pr-6 h-14 text-base border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg focus:shadow-xl focus:scale-[1.02] transition-all duration-300"
              />
            </div>
            
            {/* Advanced Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl">
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-xl backdrop-blur-md">
                    <SelectItem value="all">Tüm Kategoriler</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-0 shadow-md hover:shadow-lg transition-all duration-300 rounded-xl">
                    <TrendingUp className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent className="border-0 shadow-xl backdrop-blur-md">
                    <SelectItem value="published_at">En Yeniler</SelectItem>
                    <SelectItem value="view_count">En Popüler</SelectItem>
                    <SelectItem value="title">Alfabetik</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl p-1 shadow-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-10 w-10 p-0 rounded-lg"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-10 w-10 p-0 rounded-lg"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filteredPosts.length} makale bulundu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Blog Grid/List */}
      <section className="relative px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                <BookOpen className="relative w-16 h-16 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Henüz makale bulunamadı
              </h3>
              <p className="text-gray-500 dark:text-gray-500 text-base">
                Filtrelerinizi değiştirmeyi veya farklı arama terimleri denemeyi düşünün.
              </p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" 
                : "space-y-6"
            }>
              {filteredPosts.map((post, index) => {
                return (
                  <Card 
                    key={post.id} 
                    className={`group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {post.featured_image && (
                      <div className={`relative overflow-hidden ${
                        viewMode === 'list' ? 'w-48 h-32 flex-shrink-0' : 'h-56'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Image
                          src={post.featured_image || '/images/default-blog.jpg'}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge 
                            variant="secondary" 
                            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-black dark:text-white font-medium text-xs px-3 py-1.5 rounded-full shadow-lg border-0"
                          >
                            {post.category}
                          </Badge>
                        </div>
                        {post.featured && (
                          <div className="absolute top-4 right-4">
                            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-xs">⭐</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        <Link href={`/blog/${post.slug}`} className="hover:underline">
                          {post.title}
                        </Link>
                      </h3>
                      
                      {post.excerpt && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {post.author_name?.charAt(0).toUpperCase() || 'B'}
                              </span>
                            </div>
                            <span className="font-medium">{post.author_name || 'ButcApp Team'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatReadingTime(post.reading_time)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                          <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-blue-600 dark:text-blue-400">{post.view_count}</span>
                        </div>
                      </div>
                      
                      {post.published_at && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                          {formatDate(post.published_at)}
                        </div>
                      )}

                      {/* Hover Action Button */}
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Link href={`/blog/${post.slug}`}>
                          <Button 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            Devamını Oku
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Modern Load More Button */}
          {hasMore && (
            <div className="text-center mt-16">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  size="lg"
                  className="relative px-12 py-6 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 dark:hover:border-blue-600 hover:scale-105 transition-all duration-300 rounded-full shadow-xl hover:shadow-2xl"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Yükleniyor...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span>Daha Fazla Makale</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}