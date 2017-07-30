/*
  Cycles through a list of Hacker News stories.

  Expect state to have two keys.
  * stories - String IDs mapped to actual story data
  * storyOrders - Types of story lists mapped to array of string IDs.
    First ID is the current story. Others are queued for display later.
  * listType - What list the currentStoryOrder represents?
*/

/* Actual API calls */

const fetchJSON = async (url) => {
  let result = await fetch(url);
  if (result.ok) {
    return result.json();
  } else {
    throw new Error(result.text());
  }
};

// Fetch latest Hacker News stories
export const fetchNewStories = () => fetchJSON(
  "https://hacker-news.firebaseio.com/v0/newstories.json"
);

// Fetch recent highly ranked Hacker News stories
export const fetchTopStories = () => fetchJSON(
  "https://hacker-news.firebaseio.com/v0/topstories.json"
);

// Fetch a specific Hacker News item ID
export const fetchStoryById = (id) => fetchJSON(
  `https://hacker-news.firebaseio.com/v0/item/${id}.json`
);


/*
  State keys + selectors, refactored here for use in containers.
  Note that state is last param in curried form for composability with
  libraries like reselect.
*/

const storiesKey = "stories";
export const selectStory = (id) => (state) => (state[storiesKey] || {})[id];

const storyOrderKey = "storyOrders";
export const selectStoryOrder = (listType) => (state) =>
  (state[storyOrderKey] || {})[listType] || [];
export const selectNextStory = (listType) => (state) => {
  let id = selectStoryOrder(listType)(state)[0];
  return id ? selectStory(id)(state) : undefined;
};


/* Helper functions for proc */

// Go to next story
export const nextStory = async (listType, hooks) => {
  let { getState, putState } = hooks;

  // Story order is an array of IDs. Shift one forward.
  let order = selectStoryOrder(listType)(getState());
  order.shift();
  let nextId = order[0];

  // If no IDs in queue, fetch more IDs from server
  if (! nextId) {
    let apiCall = listType === "new" ? fetchNewStories : fetchTopStories;
    order = await apiCall();
    nextId = order[0];
  }

  // Make sure story for next ID is loaded
  await getStory(nextId, hooks);

  // Then update story list
  putState(storyOrderKey, listType, () => order);
};

// Fetch a particular HN story if and only if not already fetched
export const getStory = async (id, hooks) => {
  let { getState, putState } = hooks;
  let story = selectStory(id)(getState());
  if (! story) {
    story = await fetchStoryById(id);
    putState(storiesKey, id, () => story);
  }
  return story;
};


/* Actual proc */

export const cycleHN = async (action, hooks) => {
  if (action.type === "START_HN") {
    // Remember for stopping purposes
    let stopped = false;
    let { id, interval, listType } = action.payload;

    /*
      Recursive interval / timeout. Use this pattern instead of an interval
      to ensure min interval time period between when nextStory actually
      completes and when next one starts.
    */
    let cycle = async () => {
      if (stopped) return;
      await nextStory(listType, hooks);
      setTimeout(cycle, interval);
    };

    // Kick off first cycle
    cycle();

    // Wait for stop signal
    await hooks.onNext((a) => a.type === "STOP_HN" && a.payload.id === id);
    stopped = true;
  }
};