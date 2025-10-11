import { useState, useEffect, useMemo } from 'react';
import { getStoriesBySession, getSessionStats, createSession } from '../lib/api.js';
import StoryViewer from '../components/StoryViewer.jsx';

const LibraryPage = ({ onNavigateToCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [readingTime, setReadingTime] = useState(15);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryId, setSelectedStoryId] = useState(null);

  // Mock data for now - will be replaced with Supabase data
  const mockStories = [
    {
      id: '1',
      title: 'The Enchanted Forest',
      author: 'Emma Rivers',
      genre: 'Fantasy',
      readingTime: 15,
      thumbnail: '/api/placeholder/300/200',
      featured: true,
      createdAt: new Date('2024-01-15'),
      pages: 4
    },
    {
      id: '2',
      title: 'Lost in Time',
      author: 'James Carter',
      genre: 'Adventure',
      readingTime: 20,
      thumbnail: '/api/placeholder/300/200',
      new: true,
      createdAt: new Date('2024-01-20'),
      pages: 5
    },
    {
      id: '3',
      title: 'Mystery Manor',
      author: 'Sarah Blake',
      genre: 'Mystery',
      readingTime: 25,
      thumbnail: '/api/placeholder/300/200',
      createdAt: new Date('2024-01-18'),
      pages: 6
    },
    {
      id: '4',
      title: 'Ocean Dreams',
      author: 'Michael Torres',
      genre: 'Romance',
      readingTime: 10,
      thumbnail: '/api/placeholder/300/200',
      createdAt: new Date('2024-01-22'),
      pages: 3
    },
    {
      id: '5',
      title: 'Mountain Peaks',
      author: 'Laura Chen',
      genre: 'Adventure',
      readingTime: 18,
      thumbnail: '/api/placeholder/300/200',
      createdAt: new Date('2024-01-19'),
      pages: 4
    },
    {
      id: '6',
      title: 'Starlight Tales',
      author: 'David Kim',
      genre: 'Fantasy',
      readingTime: 12,
      thumbnail: '/api/placeholder/300/200',
      createdAt: new Date('2024-01-21'),
      pages: 3
    }
  ];

  // Dynamic genre calculation based on actual stories
  const genres = useMemo(() => {
    const genreCounts = stories.reduce((acc, story) => {
      const genre = story.genre || 'General';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {});

    const genreList = [
      { name: 'All Genres', count: stories.length },
      ...Object.entries(genreCounts).map(([name, count]) => ({ name, count }))
    ];

    return genreList;
  }, [stories]);

  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        console.log('📚 Loading stories from database...');
        
        // Get or create session
        let sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          console.log('📚 No session found, creating new session...');
          const session = await createSession();
          sessionId = session.sessionId;
          localStorage.setItem('sessionId', sessionId);
          console.log('📚 Created new session:', sessionId);
        } else {
          console.log('📚 Using existing session:', sessionId);
        }
        
        // Load stories from Supabase
        console.log('📚 Fetching stories for session:', sessionId);
        const response = await getStoriesBySession(sessionId);
        console.log('📚 API response:', response);
        
        const storiesData = response.stories || [];
        console.log('📚 Raw stories data:', storiesData);
        
        // Transform Supabase data to match our component structure
        const transformedStories = storiesData.map(story => {
          const transformed = {
            id: story.id,
            title: story.title || 'Untitled Story',
            author: 'You', // Since these are user-generated stories
            genre: story.genre || 'General',
            readingTime: Math.max(5, (story.story_length || 4) * 3), // Estimate reading time
            thumbnail: story.story_pages?.[0]?.image_url || '/api/placeholder/300/200',
            featured: false,
            new: new Date(story.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000), // New if created within 24 hours
            createdAt: new Date(story.created_at),
            pages: story.story_length || 4,
            status: story.status || 'completed'
          };
          console.log('📚 Transformed story:', transformed);
          return transformed;
        });
        
        console.log('📚 Final transformed stories:', transformedStories);
        setStories(transformedStories);
      } catch (error) {
        console.error('📚 Failed to load stories:', error);
        console.log('📚 Falling back to mock data');
        // Fallback to mock data if API fails
        setStories(mockStories);
      } finally {
        setLoading(false);
      }
    };
    
    loadStories();
  }, []);

  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const matchesSearch = story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           story.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'All Genres' || story.genre === selectedGenre;
      const matchesReadingTime = story.readingTime <= readingTime;
      
      return matchesSearch && matchesGenre && matchesReadingTime;
    });
  }, [stories, searchTerm, selectedGenre, readingTime]);

  const totalStories = stories.length;
  const newToday = stories.filter(story => {
    const today = new Date();
    const storyDate = new Date(story.createdAt);
    return storyDate.toDateString() === today.toDateString();
  }).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show story viewer if a story is selected
  if (selectedStoryId) {
    return (
      <StoryViewer 
        storyId={selectedStoryId} 
        onBack={() => setSelectedStoryId(null)} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-500 rounded mr-2 sm:mr-3 flex-shrink-0"></div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">STORYBOOK</h1>
              <span className="hidden sm:inline text-sm text-gray-500">Library</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={onNavigateToCreate}
                className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium bg-white text-gray-600 hover:text-gray-900 transition-colors"
              >
                Create
              </button>
              <button
                className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium bg-purple-500 text-white shadow-sm"
              >
                Library
              </button>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center px-2 sm:px-3 py-1 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-xs sm:text-sm font-medium border border-gray-200"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>


      {/* Main Content with top padding for fixed nav */}
      <div className="flex w-full pt-14 sm:pt-16">
        {/* Left Sidebar - Hidden on mobile, shown on larger screens */}
        <div className="hidden lg:block w-80 bg-white shadow-lg p-6 overflow-y-auto">

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search stories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{totalStories}</div>
              <div className="text-sm text-gray-600">Stories</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{newToday}</div>
              <div className="text-sm text-gray-600">New Today</div>
            </div>
          </div>
        </div>

        {/* Reading Time Filter */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-900">Reading Time</h3>
            <span className="text-sm text-gray-500">{readingTime} min</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={readingTime}
              onChange={(e) => setReadingTime(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <style>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #f97316;
                cursor: pointer;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .slider::-moz-range-thumb {
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #f97316;
                cursor: pointer;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
            `}</style>
          </div>
        </div>

        {/* Genre Filter */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Genre</h3>
          <div className="space-y-2">
            {genres.map((genre) => (
              <label key={genre.name} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="genre"
                  value={genre.name}
                  checked={selectedGenre === genre.name}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                  selectedGenre === genre.name 
                    ? 'border-orange-500 bg-orange-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedGenre === genre.name && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className={`text-sm ${
                  selectedGenre === genre.name ? 'text-orange-600 font-medium' : 'text-gray-600'
                }`}>
                  {genre.name}
                </span>
                <span className="ml-auto text-xs text-gray-400">({genre.count})</span>
              </label>
            ))}
          </div>
        </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {/* Mobile Filters - Show on mobile, hide on larger screens */}
          <div className="lg:hidden mb-4 space-y-3">
            {/* Mobile Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
            
            {/* Mobile Genre Filter */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {genres.map((genre) => (
                <button
                  key={genre.name}
                  onClick={() => setSelectedGenre(genre.name)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedGenre === genre.name
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {genre.name} ({genre.count})
                </button>
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Stories</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Discover your next adventure</p>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Desktop Search - Hidden on mobile */}
                <div className="hidden lg:block relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search stories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 sm:p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 sm:p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stories Grid */}
          <div className={`grid gap-4 sm:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredStories.map((story) => (
              <StoryCard 
                key={story.id} 
                story={story} 
                viewMode={viewMode} 
                onReadStory={setSelectedStoryId}
              />
            ))}
          </div>

          {filteredStories.length === 0 && (
            <div>
              {stories.length === 0 ? (
                // No stories at all - show create session card in top-left
                <div 
                  onClick={onNavigateToCreate}
                  className="inline-block cursor-pointer group"
                >
                  <div className="w-48 h-48 border-2 border-dashed border-indigo-400 rounded-lg flex flex-col items-center justify-center bg-white hover:bg-indigo-50 transition-colors duration-200">
                    <div className="w-12 h-12 mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-indigo-500 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-indigo-500 font-medium text-lg group-hover:text-indigo-600 transition-colors">
                      Create Story
                    </span>
                  </div>
                </div>
              ) : (
                // Stories exist but filtered out - center the message
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No stories found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StoryCard = ({ story, viewMode, onReadStory }) => {
  const handleReadStory = () => {
    onReadStory(story.id);
  };

  const getStatusBadge = () => {
    switch (story.status) {
      case 'completed':
        return null; // No badge for completed stories
      case 'generating':
        return (
          <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            GENERATING
          </span>
        );
      case 'failed':
        return (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            FAILED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${
      viewMode === 'list' ? 'flex' : ''
    }`}>
      {/* Thumbnail */}
      <div className={`relative ${viewMode === 'list' ? 'w-24 sm:w-32 h-20 sm:h-24 flex-shrink-0' : 'h-40 sm:h-48'}`}>
        <img
          src={story.thumbnail}
          alt={story.title}
          className={`w-full h-full object-cover ${viewMode === 'list' ? '' : 'rounded-t-lg'}`}
          onError={(e) => {
            e.target.src = '/api/placeholder/300/200';
          }}
        />
        
        {/* Badges */}
        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 flex flex-col space-y-1">
          {story.featured && (
            <span className="bg-orange-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
              FEATURED
            </span>
          )}
          {story.new && (
            <span className="bg-green-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
              NEW
            </span>
          )}
          {getStatusBadge()}
        </div>
      </div>

      {/* Content */}
      <div className={`p-3 sm:p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">{story.title}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">by {story.author}</p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-xs sm:text-sm text-gray-500">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {story.readingTime} min
          </div>
          
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {story.genre}
          </span>
        </div>
        
        <button 
          onClick={handleReadStory}
          disabled={story.status === 'generating' || story.status === 'failed'}
          className={`w-full py-2 px-3 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-sm font-medium ${
            story.status === 'completed' 
              ? 'bg-orange-500 text-white hover:bg-orange-600' 
              : story.status === 'generating'
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : story.status === 'failed'
              ? 'bg-red-100 text-red-600 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {story.status === 'generating' ? 'Generating...' : 
           story.status === 'failed' ? 'Generation Failed' : 
           'Read Now'}
        </button>
      </div>
    </div>
  );
};

export default LibraryPage;
