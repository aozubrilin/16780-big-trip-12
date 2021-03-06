import SortView from "../view/sort.js";
import NoEventView from "../view/no-event.js";
import DaysView from "../view/days.js";
import DayItemView from "../view/day-item.js";
import LoadingView from "../view/loading.js";
import EventPresenter, {State as EventPresenterViewState} from "./event.js";
import EventNewPresenter from "./event-new.js";
import {render, RenderPosition, remove} from "../utils/render.js";
import {filter} from "../utils/filter.js";
import {SortType, UserAction, UpdateType, FilterType} from "../const.js";
import {sortByTime, sortByPrice, sortByDefault} from "../utils/event.js";

export default class Trip {
  constructor(tripContainer, eventsModel, offersModel, destinationsModel, filterModel, api, addNewButtonComponent) {
    this._tripContainer = tripContainer;
    this._eventsModel = eventsModel;
    this._destinationsModel = destinationsModel;
    this._offersModel = offersModel;
    this._filterModel = filterModel;
    this._api = api;
    this._addNewButtonComponent = addNewButtonComponent;
    this._isLoading = true;
    this._isDataAvailable = true;
    this._eventPresenter = {};

    this._sortComponent = null;
    this._noEventComponent = new NoEventView();
    this._currentSortType = SortType.DEFAULT;
    this._daysComponent = new DaysView();
    this._loadingComponent = null;

    this._handleViewAction = this._handleViewAction.bind(this);
    this._handleModelEvent = this._handleModelEvent.bind(this);
    this._handleSortTypeChange = this._handleSortTypeChange.bind(this);
    this._handleModeChange = this._handleModeChange.bind(this);

    this._eventNewPresenter = new EventNewPresenter(this._handleViewAction, this._offersModel, this._destinationsModel, addNewButtonComponent);
  }

  init() {
    this._eventsModel.addObserver(this._handleModelEvent);
    this._filterModel.addObserver(this._handleModelEvent);
    this._renderTrip();
  }

  destroy() {
    this._clearTrip(true);

    this._eventsModel.removeObserver(this._handleModelEvent);
    this._filterModel.removeObserver(this._handleModelEvent);
  }

  createEvent() {
    this._currentSortType = SortType.DEFAULT;
    this._filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);

    if (!this._eventsModel.getEvents().length) {
      remove(this._noEventComponent);
      this._eventNewPresenter.init(this._tripContainer);
    } else {
      this._eventNewPresenter.init(this._daysComponent);
    }
  }

  _getEvents() {
    const filterType = this._filterModel.getFilter();
    const events = this._eventsModel.getEvents();
    const filteredEvents = filter[filterType](events);

    switch (this._currentSortType) {
      case SortType.DURATION:
        return filteredEvents.sort(sortByTime);
      case SortType.PRICE:
        return filteredEvents.sort(sortByPrice);
    }

    return filteredEvents.sort(sortByDefault);
  }

  _handleViewAction(actionType, updateType, update) {
    switch (actionType) {
      case UserAction.UPDATE_EVENT:
        this._eventPresenter[update.id].setViewState(EventPresenterViewState.SAVING);
        this._api.updateEvent(update)
          .then((response) => {
            this._eventsModel.updateEvent(updateType, response);
          })
          .catch(() => {
            this._eventPresenter[update.id].setViewState(EventPresenterViewState.ABORTING);
          });
        break;
      case UserAction.ADD_EVENT:
        this._eventNewPresenter.setSaving();
        this._api.addEvent(update)
          .then((response) => {
            this._eventsModel.addEvent(updateType, response);
          })
          .catch(() => {
            this._eventNewPresenter.setAborting();
          });
        break;
      case UserAction.DELETE_EVENT:
        this._eventPresenter[update.id].setViewState(EventPresenterViewState.DELETING);
        this._api.deleteEvent(update)
          .then(() => {
            this._eventsModel.deleteEvent(updateType, update);
          })
          .catch(() => {
            this._eventPresenter[update.id].setViewState(EventPresenterViewState.ABORTING);
          });
        break;
    }
  }

  _handleModelEvent(updateType, data) {
    switch (updateType) {
      case UpdateType.PATCH:
        this._eventPresenter[data.id].init(data);
        break;
      case UpdateType.MINOR:
        this._clearTrip();
        this._renderTrip();
        break;
      case UpdateType.MAJOR:
        this._clearTrip(true);
        this._renderTrip();
        break;
      case UpdateType.INIT:
        this._isLoading = false;
        remove(this._loadingComponent);
        this._renderTrip();
        break;
    }
  }

  _handleModeChange() {
    this._eventNewPresenter.destroy();

    Object
      .values(this._eventPresenter)
      .forEach((presenter) => presenter.resetView());
  }

  _renderSort() {
    if (!this._sortComponent) {
      this._sortComponent = null;
    }

    this._sortComponent = new SortView(this._currentSortType, SortType);
    this._sortComponent.setSortTypeChangeHandler(this._handleSortTypeChange);

    render(this._tripContainer, this._sortComponent, RenderPosition.BEFOREEND);
  }

  _handleSortTypeChange(sortType) {
    if (this._currentSortType === sortType) {
      return;
    }

    this._currentSortType = sortType;
    this._clearTrip();
    this._renderTrip();
  }

  _renderDays() {
    render(this._tripContainer, this._daysComponent, RenderPosition.BEFOREEND);
  }

  _renderLoading() {
    this._loadingComponent = new LoadingView(this._isDataAvailable);
    render(this._tripContainer, this._loadingComponent, RenderPosition.BEFOREEND);
  }

  _renderTrip() {
    if (this._isLoading) {
      this._renderLoading();
      return;
    }

    if (this._isDataAvailable === false) {
      this._renderLoading();
      return;
    }

    if (this._getEvents().length === 0) {
      this._renderNoEvent();
      return;
    }

    this._renderSort();
    this._renderDays();
    this._renderEvents();
  }

  _renderEvents() {
    render(this._tripContainer, this._daysComponent, RenderPosition.BEFOREEND);
    if (this._currentSortType !== SortType.DEFAULT) {
      const dayComponent = new DayItemView(null, null);
      render(this._daysComponent, dayComponent, RenderPosition.BEFOREEND);
      this._getEvents().forEach((event) => {
        this._renderEvent(dayComponent.getElement().querySelector(`.trip-events__list`), event);
      });
    } else {
      const groupsEventsByDate = this._getEvents().reduce((group, event) => {
        const date = event.dateStart.toLocaleDateString();

        if (!group[date]) {
          group[date] = [];
        }
        group[date].push(event);
        return group;
      }, {});

      Object.keys(groupsEventsByDate).forEach((date, index) => {
        const dayComponent = new DayItemView(date, index);
        render(this._daysComponent, dayComponent, RenderPosition.BEFOREEND);
        for (const event of groupsEventsByDate[date]) {
          this._renderEvent(dayComponent.getElement().querySelector(`.trip-events__list`), event);
        }
      });
    }
  }

  renderError() {
    this._isDataAvailable = false;
    this._filterModel.removeObserver(this._handleModelEvent);
  }

  _renderEvent(eventListElement, event) {
    const eventPresenter = new EventPresenter(eventListElement, this._handleViewAction, this._handleModeChange, this._offersModel, this._destinationsModel);
    eventPresenter.init(event);
    this._eventPresenter[event.id] = eventPresenter;
  }

  _renderNoEvent() {
    render(this._tripContainer, this._noEventComponent, RenderPosition.BEFOREEND);
  }

  _clearTrip(resetSortType = false) {

    Object
      .values(this._eventPresenter)
      .forEach((presenter) => presenter.destroy());
    this._eventPresenter = {};
    remove(this._sortComponent);
    remove(this._noEventComponent);
    remove(this._daysComponent);
    remove(this._loadingComponent);
    this._eventNewPresenter.destroy();

    if (resetSortType) {
      this._currentSortType = SortType.DEFAULT;
    }
  }
}
