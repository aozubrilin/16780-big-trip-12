import he from "he";
import AbstractView from "./abstract.js";
import {getISODateTime, getDuration, createEventTitleType, transformToFirstCapitalize} from "../utils/event.js";

const QuantityDisplayedOffers = {
  MAX: 3,
  MIN: 0
};

const createOfferTemplate = (offers) => {
  return offers.slice(QuantityDisplayedOffers.MIN, QuantityDisplayedOffers.MAX).map((offerItem) =>
    `<li class="event__offer">
        <span class="event__offer-title">${offerItem.title}</span>
        &plus;&nbsp;&euro;&nbsp;<span class="event__offer-price">${offerItem.price}</span>
     </li>`).join(``);
};

const createEventTemplate = (event) => {
  const {type, destination, price, offers, dateStart, dateEnd} = event;

  const eventTitleType = createEventTitleType(type);
  const offerTemplate = createOfferTemplate(offers);
  const startDateTime = getISODateTime(dateStart);
  const endDateTime = getISODateTime(dateEnd);
  const duration = getDuration(dateStart, dateEnd);

  return (
    `<li class="trip-events__item">
    <div class="event">
      <div class="event__type">
        <img class="event__type-icon" width="42" height="42" src="img/icons/${type}.png" alt="Event ${type} icon">
      </div>
      <h3 class="event__title">${transformToFirstCapitalize(eventTitleType)} ${destination.name}</h3>

      <div class="event__schedule">
        <p class="event__time">
          <time class="event__start-time" datetime="${startDateTime}">${startDateTime.slice(-5)}</time>
          &mdash;
          <time class="event__end-time" datetime="${endDateTime}">${endDateTime.slice(-5)}</time>
        </p>
        <p class="event__duration">${duration}</p>
      </div>

      <p class="event__price">
        &euro;&nbsp;<span class="event__price-value">${he.encode(price.toString())}</span>
      </p>

      <h4 class="visually-hidden">Offers:</h4>
      <ul class="event__selected-offers">
         ${offerTemplate}
      </ul>

      <button class="event__rollup-btn" type="button">
        <span class="visually-hidden">Open event</span>
      </button>
    </div>
  </li>`
  );
};

export default class Event extends AbstractView {
  constructor(event) {
    super();
    this._event = event;
    this._rollupClickHandler = this._rollupClickHandler.bind(this);
  }

  getTemplate() {
    return createEventTemplate(this._event);
  }

  _rollupClickHandler(evt) {
    evt.preventDefault();
    this._callback.rollupClick();
  }

  setRollupClickHandler(callback) {
    this._callback.rollupClick = callback;
    this.getElement().querySelector(`.event__rollup-btn`).addEventListener(`click`, this._rollupClickHandler);
  }
}
