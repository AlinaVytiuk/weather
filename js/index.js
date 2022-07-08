//convert now date
const dateDayName = document.querySelector('.main-info__dayname');
const dateDay = document.querySelector('.main-info__day');
const nowDate = new Date().toLocaleString('eng',
    {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
dateDay.innerHTML = nowDate;

const nowDateDayName = new Date();
const options = { weekday: 'long'};
dateDayName.innerHTML = new Intl.DateTimeFormat('en-US', options).format(nowDateDayName);

const settingsItems = document.querySelectorAll('.settings__item');
const settingsItemSelects = document.querySelectorAll('.settings__item-select');
const settingsItemButtons = document.querySelectorAll('.settings__item-select button');
const weatherCardsWrapper = document.querySelector('.cards__inner');

const dictionary = {
    'c': 'Celsius',
    'f': 'Fahrenheit',
}

let stateSelect = {
    temperatureType: 'c',
    windSpeedType: 'm/s'
}

let cities = ['kyiv', 'london', 'paris'];

//get data from api if data in storage not found
async function getData() {
    let data = getWeatherDataFromStorage();

    if (!data) {
        data = await getWeatherDataFromApi();
        data = formatWeatherData(data);
        setWeatherDataToStorage(data);
    }

    return data;
}

// get data by cities from API
function getWeatherDataFromApi() {
    let promises = [];

    cities.forEach(city => {
        promises.push(getWeatherData(city));
    });

    return Promise.all(promises).then(values => {
        return values;
    });
}

function formatWeatherData(data) {
    let weatherData = {};

    data.forEach(item => {
        weatherData[item.name.toLowerCase()] = formatWeatherDataSingle(item);
    });

    return weatherData;
}

//format data weather
function formatWeatherDataSingle(data) {
    return {
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        temp: data.main.temp,
        name: data.name,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset,
        weather: data.weather[0].main,
        wind: data.wind.speed,
    }
}

// get data weather
function getWeatherData(city) {
    return fetch('https://api.openweathermap.org/data/2.5/weather?q=' + city + '&appid=08d1316ba8742c08076e7425c28c2614')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            return data;
        })
        // .catch()
}


setInterval(async () => {
    let data = await getWeatherDataFromApi();
    data = formatWeatherData(data);
    setWeatherDataToStorage(data);

    update();
}, 120000);

// Array.prototype.merge = function(data) {
//     let tempData = this.concat(data)
//
//     return tempData.filter((value, index) => tempData.indexOf(value) === index);
// }

window.addEventListener('DOMContentLoaded', async function() {
    window.weatherData = await getData();
    const citiesFromStorage = Object.keys(window.weatherData)

    if (citiesFromStorage.length > 0) {
        cities = citiesFromStorage;
    }

    let stateSelectFromStorage = localStorage.getItem('stateSelect');

    try {
        stateSelectFromStorage = JSON.parse(localStorage.getItem('stateSelect'));
        window.stateSelect = Object.assign(stateSelect, stateSelectFromStorage);
    } catch (error) {
        window.stateSelect = stateSelect;
    }

    update(true);
})

function displayDataMain(data) {
    const main = document.querySelector('.main');

    //temperature
    const temperature = main.querySelector('.main-info__temperature-value');
    const temperatureTypeValue = main.querySelector('[data-field="temperatureType"] .settings__item-content-value');
    const degType = main.querySelector('.deg-type');
    const tType = window.stateSelect.temperatureType;
    const kTemp = Math.round(data.temp);
    temperature.innerText = tType === 'c' ? kToC(kTemp) : kToF(kTemp);
    degType.innerText = tType.toUpperCase();
    temperatureTypeValue.innerText = dictionary[tType];

    //windSpeed
    const windSpeed = main.querySelector('.wind-speed .value');
    const windSpeedTypeValue = main.querySelector('[data-field="windSpeedType"] .settings__item-content-value');
    const speedType = window.stateSelect.windSpeedType;
    const speedMs = Math.round(data.wind)
    windSpeed.innerText =  speedType === 'm/s' ? speedMs + ' ' + speedType: convertSpeed(speedMs) + ' ' + speedType;
    windSpeedTypeValue.innerText = speedType;

    //humidity
    const humidity = main.querySelector('.humidity .value');
    humidity.innerText = data.humidity + ' %';

    //location
    const location = main.querySelector('.main-info__location');
    location.innerHTML = data.name;

    //pressure
    const pressure = main.querySelector('.pressure .value');
    pressure.innerText = atmosphere(data.pressure) + ' mmHg';

    //search image and add description state weather
    const weatherImage = main.querySelector('.main-info__wrapper-image img');
    const weatherCondition = main.querySelector('.main-info__condition-title');

    weatherCondition.innerText = data.weather;
    weatherImage.src = 'images/icons/' + data.weather.trim().toLowerCase() + '.svg';

    //sunrise
    const dayUp = main.querySelector('.day-up');
    let sunriseTimeStamp = data.sunrise;
    let sunrise = new Date(sunriseTimeStamp * 1000);
    dayUp.innerHTML = `${sunrise.getHours()}:${sunrise.getMinutes()} AM`;

    //sunset
    const dayDown = main.querySelector('.day-down');
    let sunsetTimeStamp = data.sunset;
    let sunset = new Date(sunsetTimeStamp * 1000);
    dayDown.innerHTML = `${sunset.getHours()}:${sunset.getMinutes()} PM`;
}

function displayDataSecondary(data, weatherCard) {
    //temperature
    const temperature = weatherCard.querySelector('.main-info__temperature-value');
    const degType = weatherCard.querySelector('.deg-type');
    const tType = window.stateSelect.temperatureType;
    const kTemp = Math.round(data.temp);
    temperature.innerText = tType === 'c' ? kToC(kTemp) : kToF(kTemp);
    degType.innerText = tType.toUpperCase();

    //windSpeed
    const windSpeed = weatherCard.querySelector('.wind-speed .value');
    const speedType = window.stateSelect.windSpeedType;
    const speedMs = Math.round(data.wind)
    windSpeed.innerText =  speedType === 'm/s' ? speedMs + ' ' + speedType : convertSpeed(speedMs) + ' ' + speedType;

    //humidity
    const humidity = weatherCard.querySelector('.humidity .value');
    humidity.innerText = data.humidity + ' %';

    //location
    const location = weatherCard.querySelector('.main-info__location');
    location.innerHTML = data.name;

    //search image and add description state weather
    const weatherImage = weatherCard.querySelector('.main-info__wrapper-image img');
    weatherImage.src = 'images/icons/' + data.weather.trim().toLowerCase() + '.svg';
}

function addCard(city, data) {
    const newCard = document.createElement('article');
    newCard.className = 'cards__card flex-column';
    newCard.dataset.city = city;

    const removeButton = document.createElement('button');
    removeButton.className = 'cards__card-remove';
    removeButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.22566 0.810956C1.83514 0.420436 1.20197 0.420436 0.811452 0.810956C0.420922 1.20148 0.420922 1.83465 0.811452 2.22517L6.5862 7.9999L0.811512 13.7746C0.420982 14.1651 0.420982 14.7983 0.811512 15.1888C1.20203 15.5793 1.8352 15.5793 2.22572 15.1888L8.0004 9.4141L13.7751 15.1888C14.1656 15.5793 14.7988 15.5793 15.1893 15.1888C15.5798 14.7983 15.5798 14.1651 15.1893 13.7746L9.4146 7.9999L15.1893 2.22517C15.5799 1.83465 15.5799 1.20148 15.1893 0.810956C14.7988 0.420436 14.1657 0.420436 13.7751 0.810956L8.0004 6.5857L2.22566 0.810956Z" fill="#B9C1C6"/>
        </svg>
    `;

    removeButton.addEventListener('click', function(event) {
        event.stopPropagation();

        if (cities.length === 1) {
            removeButton.hidden = true;
            return;
        }

        delete window.weatherData[city];
        cities = Object.keys(window.weatherData);
        setWeatherDataToStorage(window.weatherData);
        newCard.remove();
    })

    newCard.innerHTML = `
        <div class="main-info__summary flex">
            <div class="main-info__temperature">
                <span class="main-info__temperature-value"></span><sup>°</sup><span class="deg-type"></span>
                <p class="main-info__location">${city}</p>
            </div>
            <div class="main-info__wrapper-image flex">
                <img src="images/icons/cloud.svg" alt="summary">
            </div>
            </div>
            <div class="details flex">
                <article class="humidity flex">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve">
                        <path d="M344.864,112.832c-26.176-33.408-53.248-67.904-75.072-104.96C266.912,3.008,261.664,0,256,0s-10.912,3.008-13.76,7.872 c-21.824,37.024-48.896,71.552-75.072,104.928C114.112,180.448,64,244.352,64,320c0,105.888,86.112,192,192,192 s192-86.112,192-192C448,244.384,397.92,180.48,344.864,112.832z M256,480c-88.224,0-160-71.776-160-160 c0-64.608,46.784-124.256,96.352-187.456c21.632-27.584,43.84-55.904,63.648-86.24c19.808,30.336,42.016,58.688,63.648,86.272 C369.216,195.744,416,255.424,416,320C416,408.224,344.224,480,256,480z"/>
                        <path d="M208,192c-26.464,0-48,21.536-48,48s21.536,48,48,48s48-21.536,48-48S234.464,192,208,192z M208,256 c-8.832,0-16-7.168-16-16c0-8.832,7.168-16,16-16c8.832,0,16,7.168,16,16C224,248.832,216.832,256,208,256z"/>
                        <path d="M304,352c-26.464,0-48,21.536-48,48s21.536,48,48,48s48-21.536,48-48S330.464,352,304,352z M304,416c-8.8,0-16-7.2-16-16 s7.2-16,16-16s16,7.2,16,16S312.8,416,304,416z"/>
                        <path d="M347.296,228.704c-6.24-6.24-16.384-6.24-22.624,0l-160,160c-6.24,6.24-6.24,16.384,0,22.624 C167.808,414.432,171.904,416,176,416s8.192-1.568,11.296-4.672l160-160C353.536,245.088,353.536,234.944,347.296,228.704z"/>
                    </svg>
                    <span class="value"></span>
                </article>
                <article class="wind-speed flex">
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 365.447 365.447" xml:space="preserve">
                        <path d="M306.069,189.427H7.5c-4.143,0-7.5-3.358-7.5-7.5s3.357-7.5,7.5-7.5h297.119c0.469-0.092,0.954-0.14,1.45-0.14 c24.47,0,44.378-19.908,44.378-44.378S330.539,85.53,306.069,85.53s-44.378,19.908-44.378,44.378c0,4.142-3.357,7.5-7.5,7.5 s-7.5-3.358-7.5-7.5c0-32.741,26.637-59.378,59.378-59.378s59.378,26.637,59.378,59.378c0,32.224-25.801,58.535-57.829,59.358 C307.118,189.372,306.601,189.427,306.069,189.427z"/>
                        <path d="M152.283,137.479H7.5c-4.143,0-7.5-3.358-7.5-7.5s3.357-7.5,7.5-7.5h143.333c0.469-0.092,0.954-0.14,1.45-0.14 c24.47,0,44.378-19.908,44.378-44.378s-19.908-44.378-44.378-44.378c-24.471,0-44.379,19.908-44.379,44.378 c0,4.142-3.357,7.5-7.5,7.5s-7.5-3.358-7.5-7.5c0-32.741,26.638-59.378,59.379-59.378s59.378,26.637,59.378,59.378 c0,32.224-25.801,58.535-57.829,59.358C153.332,137.423,152.814,137.479,152.283,137.479z"/>
                        <path d="M244.186,346.866c-32.741,0-59.379-26.637-59.379-59.378c0-4.142,3.357-7.5,7.5-7.5s7.5,3.358,7.5,7.5 c0,24.47,19.908,44.378,44.379,44.378c24.47,0,44.378-19.908,44.378-44.378s-19.908-44.378-44.378-44.378H7.5 c-4.143,0-7.5-3.358-7.5-7.5s3.357-7.5,7.5-7.5h236.686c32.741,0,59.378,26.637,59.378,59.378S276.927,346.866,244.186,346.866z"/>
                    </svg>
                <span class="value"></span>
            </article>
        </div>
    `;

    newCard.prepend(removeButton);
    newCard.addEventListener('click', function() {
        displayDataMain(window.weatherData[city]);
    });

    weatherCardsWrapper.append(newCard);
    displayDataSecondary(data, newCard);
}

function update(firstLoad = false) {
    const data = window.weatherData;
    let mainCityData = Object.values(data)[0];
    displayDataMain(mainCityData);

    if (firstLoad) {
        weatherCardsWrapper.innerHTML = '';
    }

    Object.keys(data).forEach(city => {
        if (firstLoad) {
            addCard(city, data[city]);
        } else {
            const card = document.querySelector(`[data-city="${city}"]`);
            displayDataSecondary(data[city], card)
        }
    })

    localStorage.setItem('stateSelect', JSON.stringify(window.stateSelect));
}

function fadeIn(el, time) {
    el.style.display = 'block';

    let last = +new Date();
    let tick = function() {
        el.style.opacity = +el.style.opacity + (new Date() - last) / time;
        last = +new Date();

        if (+el.style.opacity < 1) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
        }
    };

    tick();
}

function fadeOut(el, time) {
    el.style.opacity = '1';

    let last = +new Date();
    let tick = function() {
        el.style.opacity = +el.style.opacity - (new Date() - last) / time;
        last = +new Date();

        if (+el.style.opacity > 0) {

            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);

        } else {
            el.style.display = 'none';
        }
    };

    tick();
}

//hidden/show select
settingsItems.forEach(settingsItem => {
    settingsItem.addEventListener('click', function(event) {
        event.stopPropagation();
        const select = this.querySelector('.settings__item-select');

        settingsItemSelects.forEach(settingsItemSelect => {
            if (settingsItemSelect !== select) {
                fadeOut(settingsItemSelect, 200)
                settingsItemSelect.classList.remove('active');
            }
        })

        select.classList.contains('active') ? fadeOut(select, 200) : fadeIn(select, 200);
        select.classList.toggle('active');
    })
})

document.body.addEventListener('click', function() {
    settingsItemSelects.forEach(settingsItemSelect => {
        fadeOut(settingsItemSelect, 200)
        settingsItemSelect.classList.remove('active');
    })
})

settingsItemButtons.forEach(settingsItemButton => {
    settingsItemButton.addEventListener('click', function(event) {
        event.stopPropagation();
        const item = this.closest('.settings__item');
        const select = this.closest('.settings__item-select');
        const stateField = item.dataset.field;

        fadeOut(select, 200)
        select.classList.remove('active')
        window.stateSelect[stateField] = this.dataset.type;
        update();
    })
})

//search
const search = document.querySelector('#search');
const searchClose = document.querySelector('.search-close');

searchClose.addEventListener('click', function() {
    search.value = '';
    this.classList.remove('active');
    search.focus();
})

search.addEventListener('keyup', function(event) {
    let searchValue = this.value.toLowerCase();

    if (searchValue.length > 1) {
        searchClose.classList.add('active');
    } else {
        searchClose.classList.remove('active');
    }

    if (event.code !== 'Enter' || !searchValue) {
        return;
    }

    if (cities.includes(searchValue)) {
        this.value = '';
        alert('City already added');

        return;
    }

    getWeatherData(searchValue).then(result => {
        if (result.cod !== 200) {
            alert('City not found');

            return;
        }

        const data = formatWeatherDataSingle(result);
        addCard(searchValue, data);
        window.weatherData[searchValue] = data;
        cities.push(searchValue);
        setWeatherDataToStorage(window.weatherData);
    }).finally(() => {
        this.value = '';
    });
})

// write data to storage
function setWeatherDataToStorage(data) {
    localStorage.setItem('weatherData', JSON.stringify(data));
}

// get data from storage
function getWeatherDataFromStorage() {
    return JSON.parse(localStorage.getItem('weatherData'));
}

//convert Kelvin to Celsius
function kToC(k) {
    return Math.round(k - 273);
}

//convert Kelvin to Fahrenheit
function kToF(k) {
    return Math.round(kToC(k) * 9/5 + 32);
}

//convert m/s to km/h
function convertSpeed(mS) {
    return Math.round(mS * 3.6)
}

//convert atmosphere
function atmosphere(gPa) {
    return Math.round(gPa * .75)
}