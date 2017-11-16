import parseHTML from './../../utils/parseHTML';
import toastTemplate from './../../../../templates/toast.hbs';
import defaults from 'lodash/object/defaults';
import transition from 'simple-transition';
import closest from 'closest';

class Toast {
  constructor(text, duration, buttons) {
    this.container = parseHTML(toastTemplate({text, buttons})).firstChild;

    this.answer = new Promise(function(resolve) {
      this._answerResolver = resolve;
    });

    this.gone = new Promise(function(resolve) {
      this._goneResolver = resolve;
    });

    if (duration) {
      this._hideTimeout = setTimeout(this.hide, duration);
    }

    this.container.addEventListener('click', (event) => {
      const button = closest(event.target, 'button', true);
      if (!button) return;
      this._answerResolver(button.textContent);
      this.hide();
    });
  }

  hide() {
    clearTimeout(this._hideTimeout);
    this._answerResolver();

    transition(this.container, {
      opacity: 0
    }, 0.3, 'ease-out').then(this._goneResolver);

    return this.gone;
  }
}

export default class Toasts {

  constructor(appendToEl) {
    this._container = parseHTML('<div class="toasts"></div>').firstChild;
    appendToEl.appendChild(this._container);
  }

  // show a message to the user eg:
  // toasts.show("Do you wish to continue?", {
  //   buttons: ['yes', 'no']
  // })
  // Returns a toast.
  show(message, opts) {
    const duration = 0;
    const buttons = ['dismiss'];
    opts = defaults({}, opts, {duration, buttons});

    const toast = new Toast(message, opts.duration, opts.buttons);
    this._container.appendChild(toast.container);

    transition(toast.container, {
      opacity: 1
    }, 0.5, 'ease-out');

    toast.gone.then(function() {
      toast.container.parentNode.removeChild(toast.container);
    });

    return toast;
  }
}
