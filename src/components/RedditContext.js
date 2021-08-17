import React, { createContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import { getPostsBySubreddit } from '../services/redditAPI';

const Context = createContext();
const { Provider, Consumer } = Context;

const RedditProvider = ({ children }) => {
  const [selectedSubreddit, setSubreddit] = useState('reactjs');
  const [shouldRefreshSubreddit, setShouldRefresh] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [postsBySubreddit, setPostsBySubreddit] = useState({ frontend: {}, reactjs: {} });

  const shouldFetchPosts = useCallback(() => {
    const posts = postsBySubreddit[selectedSubreddit];

    if (!posts.items) return true;
    if (isFetching) return false;
    return shouldRefreshSubreddit;
  }, [isFetching, postsBySubreddit, selectedSubreddit, shouldRefreshSubreddit]);

  const handleFetchSuccess = useCallback((json) => {
    const lastUpdated = Date.now();
    const items = json.data.children.map((child) => child.data);

    setShouldRefresh(false);
    setIsFetching(false);
    const newPostsBySubreddit = { ...postsBySubreddit };
    newPostsBySubreddit[selectedSubreddit] = {
      items,
      lastUpdated,
    };
    setPostsBySubreddit(newPostsBySubreddit);
  }, [postsBySubreddit, selectedSubreddit]);

  const handleFetchError = useCallback((error) => {
    setShouldRefresh(false);
    setIsFetching(false);
    const newPostsBySubreddit = { ...postsBySubreddit };
    newPostsBySubreddit[selectedSubreddit] = {
      error: error.message,
      items: [],
    };
    setPostsBySubreddit(newPostsBySubreddit);
  }, [postsBySubreddit, selectedSubreddit]);

  const fetchPosts = useCallback(() => {
    if (!shouldFetchPosts()) return;

    setShouldRefresh(false);
    setIsFetching(true);

    getPostsBySubreddit(selectedSubreddit)
      .then(handleFetchSuccess, handleFetchError);
  }, [handleFetchSuccess, handleFetchError, selectedSubreddit, shouldFetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [selectedSubreddit, shouldRefreshSubreddit, fetchPosts]);

  const handleSubredditChange = (selectedSubreddit) => {
    setSubreddit(selectedSubreddit);
  }

  const handleRefreshSubreddit = () => {
    setShouldRefresh(true);
  }

  const context = {
    selectedSubreddit,
    postsBySubreddit,
    shouldRefreshSubreddit,
    isFetching,
    selectSubreddit: handleSubredditChange,
    fetchPosts: fetchPosts,
    refreshSubreddit: handleRefreshSubreddit,
    availableSubreddits: Object.keys(postsBySubreddit),
    posts: postsBySubreddit[selectedSubreddit].items,
  };

  return (
    <Provider value={context}>
      {children}
    </Provider>
  );
}

RedditProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { RedditProvider as Provider, Consumer, Context };
