import AbstractView from "./abstract.js";

export default class Sort extends AbstractView {
  constructor(currentSortType, sortType) {
    super();
    this._currentSortType = currentSortType;
    this._sortType = sortType;
    this._sortTypeChangeHandler = this._sortTypeChangeHandler.bind(this);
  }

  getTemplate() {
    const createSortTemplate = () => {
      return Object.values(this._sortType).map((type) =>
        `<div class="trip-sort__item  trip-sort__item--${type}">
            <input
              id="sort-${type}"
              class="trip-sort__input  visually-hidden"
              type="radio"
              name="trip-sort"
              value="${type}"
              ${this._currentSortType === type ? `checked` : ``}
            >
            <label class="trip-sort__btn" for="sort-${type}">${type}</label>
        </div>`).join(`\n`);
    };

    return (
      `<form class="trip-events__trip-sort  trip-sort" action="#" method="get">
        <span class="trip-sort__item  trip-sort__item--day">Day</span>
        ${createSortTemplate()}
        <span class="trip-sort__item  trip-sort__item--offers">Offers</span>
      </form>`
    );
  }

  setSortTypeChangeHandler(callback) {
    this._callback.sortTypeChange = callback;
    this.getElement().addEventListener(`change`, this._sortTypeChangeHandler);
  }

  _sortTypeChangeHandler(evt) {
    if (evt.target.tagName !== `INPUT`) {
      return;
    }

    evt.preventDefault();
    this._callback.sortTypeChange(evt.target.value);
  }
}

