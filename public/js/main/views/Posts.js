import postTemplate from './../../../../templates/post.hbs';
import toArray from 'lodash/lang/toArray';
import parseHTML from './../../utils/parseHTML';
import humanReadableTimeDiff from './../../utils/humanReadableTimeDiff';

const maxMessages = 30;

export default class Posts {
  constructor(container) {
    this._container = container;
    this._scroller = container.querySelector('.posts');
    this._lastTimeUpdate = 0;
    this._newPostAlert = container.querySelector('.posts-alert');
    this._scrollUpdatePending = false;

    this._timesUpdate();

    // update times on an interval
    setInterval(() => {
      requestAnimationFrame(() => {
        this._softTimesUpdate();
      });
    }, 1000 * 30);

    // listen to scrolling
    this._scroller.addEventListener('scroll', () => {
      if (this._scrollUpdatePending) return;
      this._scrollUpdatePending = true;
      requestAnimationFrame(() => {
        this._onScroll();
        this._scrollUpdatePending = false;
      });
    });
  }

  // update all the <time> elements, unless we've
  // already done so within the last 10 seconds
  _softTimesUpdate() {
    if (Date.now() - this._lastTimeUpdate < 1000 * 10) return;
    this._timesUpdate();
  }

  // update all the <time> elements
  _timesUpdate() {
    const postTimeEls = toArray(this._container.querySelectorAll('.post-time'));
    postTimeEls.forEach((timeEl) => {
      const postDate = new Date(timeEl.getAttribute('datetime'));
      timeEl.textContent = humanReadableTimeDiff(postDate);
    });
    this._lastTimeUpdate = Date.now();
  }

  // called as the scroll position changes
  _onScroll() {
    if (this._scroller.scrollTop < 60) {
      this._newPostAlert.classList.remove('active');
    }
  }

  // processes an array of objects representing messages,
  // creates html for them, and adds them to the page
  addPosts(messages) {
    // create html for new posts
    const oldLatestPost = this._scroller.querySelector('.post');
    const oldLatestPostOldPosition = oldLatestPost && oldLatestPost.getBoundingClientRect();
    const htmlString = messages.map((message) => postTemplate(message)).join('');

    // add to the dom
    const nodes = parseHTML(htmlString);
    this._scroller.insertBefore(nodes, this._scroller.firstChild);

    // remove really old posts to avoid too much content
    const posts = toArray(this._scroller.querySelectorAll('.post'));

    posts.slice(maxMessages).forEach((post) => post.parentNode.removeChild(post));

    // move scrolling position to make it look like nothing happened
    if (oldLatestPost) {
      const oldLatestPostNewPosition = oldLatestPost.getBoundingClientRect();
      this._scroller.scrollTop = this._scroller.scrollTop + (Math.round(oldLatestPostNewPosition.top) - Math.round(oldLatestPostOldPosition.top));
      this._newPostAlert.classList.add('active');
    }

    this._timesUpdate();
  }

  // get the date of the latest post, or null if there are no posts
  getLatestPostDate() {
    const timeEl = this._container.querySelector('.post-time');
    if (!timeEl) return null;
    return new Date(timeEl.getAttribute('datetime'));
  }

  // Any there any posts in the view?
  showingPosts() {
    return !!this._container.querySelector('.post');
  }
}
