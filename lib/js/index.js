import rome from 'rome';
import moment from 'moment';

import popupTemplate from '../template/datepicker.template';
import scrimTemplate from '../template/scrim.template';
import Events from './events';

import '../scss/material-datetime-picker.scss';

const prefix = 'c-datepicker';
const defaults = () => ({
  default: moment().startOf('hour'),
  // allow the user to override all the classes
  // used for styling the calendar
  styles: {
    scrim: 'c-scrim',
    back: `${prefix}__back`,
    container: `${prefix}__calendar`,
    date: `${prefix}__date`,
    dayBody: `${prefix}__days-body`,
    dayBodyElem: `${prefix}__day-body`,
    dayConcealed: `${prefix}__day--concealed`,
    dayDisabled: `${prefix}__day--disabled`,
    dayHead: `${prefix}__days-head`,
    dayHeadElem: `${prefix}__day-head`,
    dayRow: `${prefix}__days-row`,
    dayTable: `${prefix}__days`,
    month: `${prefix}__month`,
    next: `${prefix}__next`,
    positioned: `${prefix}--fixed`,
    selectedDay: `${prefix}__day--selected`,
    selectedTime: `${prefix}__time--selected`,
    time: `${prefix}__time`,
    timeList: `${prefix}__time-list`,
    timeOption: `${prefix}__time-option`,
    clockNum: `${prefix}__clock__num`
  },
  // format to display in the input, or set on the element
  format: 'DD/MM/YY',
  // the container to append the picker
  container: document.body,
  // allow any dates
  dateValidator: undefined
});

class DateTimePicker extends Events {
  constructor(options = {}) {
    super();
    const styles = Object.assign(defaults().styles, options.styles);
    this.options = Object.assign(defaults(), options);
    this.options.styles = styles;

    // listen to any event
    this.on('*', (evtName, evtData) => {
      if (this.options.el) {
        // if there is a custom element, fire a real dom
        // event on that now
        const event = new CustomEvent(evtName, this, evtData);
        this.options.el.dispatchEvent(event);
      }
    });
  }

  // intialize the rom calendar with our default date and
  // style options
  initializeRome(container, validator) {
    return rome(container, {
      styles: this.options.styles,
      time: false,
      dateValidator: validator,
      initialValue: this.value
    }).on('data', value => this.set(value));
  }

  // called to open the picker
  open() {
    const scrimEl = scrimTemplate(this.options);
    _appendTemplate(document.body, scrimEl);
    _appendTemplate(this.options.container, popupTemplate());
    this.pickerEl = this.options.container.querySelector(`.${prefix}`);
    this.scrimEl = document.body.querySelector(`.${this.options.styles.scrim}`);
    this.amToggleEl = this.$('.c-datepicker__clock--am');
    this.pmToggleEl = this.$('.c-datepicker__clock--pm');

    if (!this.value) {
      this.value = moment(this.options.default);
    }

    this.setDate(this.value);
    this.initializeRome(this.$(`.${this.options.styles.container}`), this.options.dateValidator);
    this._show();
  }

  close() {
    this._hide();
  }

  _hide() {
    this.pickerEl.classList.remove('open');
    window.setTimeout(() => {
      this.options.container.removeChild(this.pickerEl);
      document.body.removeChild(this.scrimEl);
      this.trigger('close');
    }, 200);
    return this;
  }

  _show() {
    this.delegateEvents();
    // add the animation classes on the next animation tick
    // so that they actually work
    window.requestAnimationFrame(() => {
      this.scrimEl.classList.add(`${this.options.styles.scrim}--shown`);
      this.pickerEl.classList.add(`${prefix}--open`);
      this.trigger('open');
    });
    return this;
  }

  delegateEvents() {
    this.$('.js-cancel')
      .addEventListener('click', () => this.clickCancel(), false);
    this.$('.js-ok')
      .addEventListener('click', () => this.clickSubmit(), false);

    this.$('.c-datepicker__header-date__hours').addEventListener('click', e => this.showHourClock(e), false);
    this.$('.c-datepicker__header-date__minutes').addEventListener('click', e => this.showMinuteClock(e), false);


    this.$(`.c-datepicker__clock__hours .${this.options.styles.clockNum}`).forEach((el) => {
      el.addEventListener('click', e => this.clickClock(e), false);
      el.addEventListener('mouseenter', e => this.mouseInHourClock(e), false);
      el.addEventListener('mouseleave', e => this.mouseOutHourClock(e), false);
    });

    this.$(`.c-datepicker__clock__minutes .${this.options.styles.clockNum}`).forEach(el => {
      el.addEventListener('click', (e) => this.clickClockMinutes(e), false);
      el.addEventListener('mouseenter', e => this.mouseInMinuteClock(e), false);
      el.addEventListener('mouseleave', e => this.mouseOutMinuteClock(e), false);
    });

    this.$('.c-datepicker__clock--am')
      .addEventListener('click', e => this.clickAm(e), false);
    this.$('.c-datepicker__clock--pm')
      .addEventListener('click', e => this.clickPm(e), false);

    return this;
  }

  clickSubmit() {
    this.close();
    this.trigger('submit', this.value, this);
    return this;
  }

  clickCancel() {
    this.close();
    this.trigger('cancel', this.value, this);
    return this;
  }

  clickClock(e) {
    let number = parseInt(e.currentTarget.getAttribute('data-number'), 10);
    if (number === 0 && this.meridiem === 'pm') {
      number = 12;
    } else if (this.meridiem === 'pm') {
      number += 12;
    }

    this.value.hour(number);
    this.setTime(this.value);
    return this;
  }

  clickClockMinutes(e) {
    let number = parseInt(e.currentTarget.getAttribute('data-number'), 10);
    this.value.minute(number);
    this.setTime(this.value);

    return this;
  }

  mouseInMinuteClock() {
    const active = this.$(`.c-datepicker__clock__minutes .${this.options.styles.clockNum}--active`);

    if (active) {
      active.classList.add('hide-hand');
    }
  }

  mouseOutMinuteClock() {
    const hideHand = this.$(`.c-datepicker__clock__minutes .${this.options.styles.clockNum}--active.hide-hand`);

    if (hideHand) {
      hideHand.classList.remove('hide-hand');
    }
  }

  mouseInHourClock() {
    const active = this.$(`.c-datepicker__clock__hours .${this.options.styles.clockNum}--active`);

    if (active) {
      active.classList.add('hide-hand');
    }
  }

  mouseOutHourClock() {
    const hideHand = this.$(`.c-datepicker__clock__hours .${this.options.styles.clockNum}--active.hide-hand`);

    if (hideHand) {
      hideHand.classList.remove('hide-hand');
    }
  }

  showHourClock() {
    this.$('.c-datepicker__header-date__hours').classList.add('active');
    this.$('.c-datepicker__header-date__minutes').classList.remove('active');
    this.$('.c-datepicker__clock__hours').style.display = 'block';
    this.$('.c-datepicker__clock__minutes').style.display = 'none';
  }

  showMinuteClock() {
    this.$('.c-datepicker__header-date__hours').classList.remove('active');
    this.$('.c-datepicker__header-date__minutes').classList.add('active');
    this.$('.c-datepicker__clock__hours').style.display = 'none';
    this.$('.c-datepicker__clock__minutes').style.display = 'block';
  }

  clickAm() {
    if (this.meridiem === 'pm') {
      this.meridiem = 'am';
      this.value.hour(this.value.hour() - 12);
    }
    this.setTime(this.value);
    return this;
  }

  clickPm() {
    if (this.meridiem === 'am') {
      this.meridiem = 'pm';
      this.value.hour(this.value.hour() + 12);
    }
    this.setTime(this.value);
    return this;
  }

  data(val) {
    return (val ? this.set(val) : this.value);
  }

  set(value, opts) {
    const m = moment(value);

    // maintain a list of change events to fire all at once later
    const evts = [];
    if (m.date() !== this.value.date()
      || m.month() !== this.value.month()
      || m.year() !== this.value.year()
    ) {
      this.setDate(m);
      evts.push('change:date');
    } else {
      // otherwise just the time is being set
      // so fire a change:time event
      this.setTime(m);
      evts.push('change:time');
    }
    if (this.options.el) {
      // if there is an element to fire events on
      if (this.options.el.tagName === 'INPUT') {
        // and it is an input element then set the value
        this.options.el.value = m.format(this.options.format);
      } else {
        // or any other element set a data-value attribute
        this.options.el.setAttribute('data-value', m.format(this.options.format));
      }
    }
    if (!opts || !opts.silent) {
      // fire all the events we've collected
      this.trigger(['change', ...evts].join(' '), this.value, this);
    }
  }

  // set the value and header elements to `date`
  // the calendar will be updated automatically
  // by rome when clicked
  setDate(date) {
    const m = moment(date);
    const month = m.format('MMM');
    const day = m.format('Do');
    const dayOfWeek = m.format('dddd');
    const year = m.format('YYYY');

    this.$('.js-day').innerText = dayOfWeek;
    this.$('.js-date-month').innerText = (`${month} ${year}`);
    this.$('.js-date-day').innerText = day;
    this.value.year(m.year());
    this.value.month(m.month());
    this.value.date(m.date());
    return this;
  }

  // set the value and header elements to `time`
  // also update the hands of the clock
  setTime(time) {
    const m = moment(time);
    const hour = m.format('HH');
    const minutes = m.format('mm');
    const hourAsInt = parseInt(hour, 10) % 12;
    const minuteAsInt = parseInt(minutes, 10);
    const oldActiveHours = this.$(`.c-datepicker__clock__hours .${this.options.styles.clockNum}--active`);
    const oldActiveMinutes = this.$(`.c-datepicker__clock__minutes .${this.options.styles.clockNum}--active`);
    this.$('.js-date-hours').innerText = hour;
    this.$('.js-date-minutes').innerText = minutes;

    if (oldActiveHours) {
      oldActiveHours.classList.remove(`${this.options.styles.clockNum}--active`);
    }

    if (oldActiveMinutes) {
      oldActiveMinutes.classList.remove(`${this.options.styles.clockNum}--active`);
    }

    this.$(`.c-datepicker__clock__hours .${this.options.styles.clockNum}[data-number="${hourAsInt}"]`)
      .classList.add(`${this.options.styles.clockNum}--active`);
    this.$(`.c-datepicker__clock__minutes .${this.options.styles.clockNum}[data-number="${minuteAsInt}"]`)
      .classList.add(`${this.options.styles.clockNum}--active`);
    this.value.hours(m.hours());
    this.meridiem = this.value.format('a');

    if (this.meridiem === 'pm') {
      this.amToggleEl.removeAttribute('checked');
      this.pmToggleEl.setAttribute('checked', 'checked');
      this.amToggleEl.parentElement.classList.remove('c-datepicker__toggle--checked');
      this.pmToggleEl.parentElement.classList.add('c-datepicker__toggle--checked');
    } else {
      this.pmToggleEl.removeAttribute('checked');
      this.amToggleEl.setAttribute('checked', 'checked');
      this.pmToggleEl.parentElement.classList.remove('c-datepicker__toggle--checked');
      this.amToggleEl.parentElement.classList.add('c-datepicker__toggle--checked');
    }
    return this;
  }

  $(selector) {
    const els = this.pickerEl.querySelectorAll(selector);
    return els.length > 1 ? [...els] : els[0];
  }
}

export default DateTimePicker;

function _appendTemplate(parent, template) {
  const tempEl = document.createElement('div');
  tempEl.innerHTML = template.trim();
  parent.appendChild(tempEl.firstChild);
  return this;
}
