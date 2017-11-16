import PostsView from './views/Posts';
import ToastsView from './views/Toasts';
import idb from 'idb';

export default class IndexController {

  constructor(container) {
    this._container = container;
    this._postsView = new PostsView(this._container);
    this._toastsView = new ToastsView(this._container);
    this._lostConnectionToast = null;
    this._openSocket();
    this._registerServiceWorker();
  }

  async _registerServiceWorker() {
    if (!navigator.serviceWorker) return;

    const reg = navigator.serviceWorker.register('/sw.js');

    if (!navigator.serviceWorker.controller) return;

    if (reg.waiting) return this._updateReady(reg.waiting);

    if (reg.installing) return this._trackInstalling(reg.installing);

    reg.onupdatefound = () => this._trackInstalling(reg.installing);

    navigator.serviceWorker.oncontrollerchange = async () => {
      const [reg] = navigator.serviceWorker.getRegistrations();
      reg.unregister();
      window.location.reload();
    };
  }

  _trackInstalling(worker) {
    worker.onstatechange = () => worker.state == 'installed' && this._updateReady(worker);
  }

  async _updateReady(worker) {
    const buttons = ['refresh', 'dismiss'];
    const toast = this._toastsView.show("New version available", {buttons});

    const answer = await toast.answer();
    return (answer !== 'refresh' || worker.state === 'redundant') || worker.postMessage({answer});
  }

  // open a connection to the server for live updates
  _openSocket() {
    const latestPostDate = this._postsView.getLatestPostDate();

    // create a url pointing to /updates with the ws protocol
    const socketUrl = new URL('/updates', window.location);
    socketUrl.protocol = 'ws';

    if (latestPostDate) {
      socketUrl.search = `since=${latestPostDate.valueOf()}`;
    }

    // this is a little hack for the settings page's tests,
    // it isn't needed for Wittr
    socketUrl.search += '&' + location.search.slice(1);

    const ws = new WebSocket(socketUrl.href);

    // add listeners
    ws.addEventListener('open', () => {
      if (this._lostConnectionToast) {
        this._lostConnectionToast.hide();
      }
    });

    ws.addEventListener('message', (event) => {
      requestAnimationFrame(() => {
        this._onSocketMessage(event.data);
      });
    });

    ws.addEventListener('close', () => {
      // tell the user
      if (!this._lostConnectionToast) {
        this._lostConnectionToast = this._toastsView.show("Unable to connect. Retrying…");
      }

      // try and reconnect in 5 seconds
      setTimeout(() => this._openSocket(), 5000);
    });
  }

  // called when the web socket sends message data
  _onSocketMessage(data) {
    const messages = JSON.parse(data);
    this._postsView.addPosts(messages);
  }
}
