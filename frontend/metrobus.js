const busPredictionPrefix = 'https://api.wmata.com/NextBusService.svc/json/jPredictions/?StopID='
const alarmSound = new Audio('./assets/charge.wav');
const confirmSound = new Audio('./assets/263133__pan14__tone-beep.wav');
const lostSound = new Audio('./assets/159408__noirenex__life-lost-game-over.wav');

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('search-by-stop').addEventListener('click', () => popUpSearch(stopSearch));
    document.getElementById('search-by-route').addEventListener('click', () => popUpSearch(routeSearch));
    // login/out button
    // favorites button
})

function popUpSearch(searchFunction) {
    const mainContainer = document.getElementById('main-container')
    mainContainer.innerHTML = ""

    const form = document.createElement('form');
    form.id = 'search-form'
    const input = document.createElement('input');
    input.classList.add('input');
    input.setAttribute('name', 'queryData');
    input.setAttribute('maxlength', '7')
    input.setAttribute('placeholder', "Enter 7-digit stop # or route")
    const submitBtn = document.createElement('button');
    submitBtn.classList.add('button', 'is-primary')
    submitBtn.innerText = 'Search';
    submitBtn.type = 'submit';

    form.appendChild(input)
    form.appendChild(submitBtn)
    form.addEventListener('submit', (e) => searchFunction(e))
    mainContainer.appendChild(form)
}

function stopSearch(event) {
    event.preventDefault()

    let form = document.getElementById('search-form')
    const busStop = form.queryData.value.toString();
    let stopId;

    if (busStop.length !== 7 ) {
        alert('Invalid stop number');
        return;
    } else {
        stopId = busStop;
    }

    fetch(busPredictionPrefix + stopId, configObj)
    .then(response => response.json())
    .then(data => getBuses(data, stopId))
}

function routeSearch() {
    alert("Route search is not yet supported. Please try searching by stop")
}

function getBuses(data, stopId) {
    const mainContainer = document.getElementById('main-container')
    if (data.Predictions.length < 1) {
        mainContainer.innerHTML = "No buses found."
    } else {
        mainContainer.innerHTML = ""

        const table = document.createElement('table')
        table.classList.add('table')
        const tableBody = document.createElement('tbody')
        table.appendChild(tableBody)

        data.Predictions.forEach(function(prediction) {
            let row = document.createElement('tr');
            
            let busNum = document.createElement('td');
                const busBox = document.createElement('div');
                busBox.classList.add('busbox')
                busBox.innerText = prediction.RouteID;
                
                const busDesc = document.createElement('div')
                busDesc.classList.add('bus-description')
                busDesc.innerText = " " + prediction.DirectionText;
                busNum.append(busBox, busDesc)

            let busMinutes = document.createElement('td');
            busMinutes.innerText = prediction.Minutes + ' minutes';
            let alarmSet = document.createElement('a');
            alarmSet.addEventListener('click', askAlarm);
            alarmSet.dataset.stop = stopId;
            alarmSet.dataset.minutes = prediction.Minutes;
            alarmSet.dataset.tripId = prediction.TripID;
            alarmSet.innerText = '⏰';

            row.append(busNum, busMinutes, alarmSet)
            tableBody.appendChild(row)
        })
        mainContainer.appendChild(table)
    }
}

function askAlarm(event) {
    let tripContainer = event.target.parentNode;
    let newTr = document.createElement('tr')
    let newTd = document.createElement('td')
    newTd.setAttribute('colspan', '3')
    newTr.appendChild(newTd)
    let tripId = event.target.dataset.tripId;
    let stopId = event.target.dataset.stop;

    let internalForm = document.createElement('form');

    let internalInputLabel = document.createElement('label')
    internalInputLabel.classList.add('label')
    internalInputLabel.innerText = "Set reminder for number of minutes before departure:"
    let internalInput = document.createElement('input');
    internalInput.classList.add('input', 'is-primary')
    internalInput.setAttribute('type', 'number');
    internalInput.setAttribute('name', 'alarm');
    internalInput.setAttribute('min', '1');
    internalInput.setAttribute('max', event.target.dataset.minutes)
    let internalSubmit = document.createElement('button');
    internalSubmit.classList.add('button', 'is-primary')
    internalSubmit.type = 'submit';
    internalSubmit.innerText = "Set Alarm"
    internalForm.addEventListener('submit', function(e) {setAlarm(e, stopId, tripId)})
    let internalClose = document.createElement('button');
    internalClose.classList.add('button', 'is-primary')
    internalClose.innerText = "Close"
    internalClose.addEventListener('click', closeAlarmDrawer)

    internalForm.append(internalInputLabel, internalInput, internalSubmit, internalClose)
    newTd.appendChild(internalForm)
    tripContainer.parentNode.appendChild(newTr)
    tripContainer.after(newTr)
}

function closeAlarmDrawer(event) {
    event.target.parentNode.remove()
}

function setAlarm(event, stopId, tripId) {
    event.preventDefault();
    const alarmSettingMins = event.target.alarm.value;
    
    //notification
    const notificationBlock = document.getElementById('notification-block');
    notificationBlock.classList.add('notification', 'is-success');
    let closeBtn = document.createElement('button')
    closeBtn.classList.add('delete')
    closeMarker = document.createElement('i')
    closeMarker.classList.add('fas', 'fa-times')
    closeBtn.appendChild(closeMarker)
    notificationBlock.appendChild(closeBtn);
    confirmSound.play()
    notificationBlock.innerText = `An alarm has been set for bus #${tripId} at stop #${stopId} with ${alarmSettingMins} minutes' warning.`
    
    let checkAlarm = function(busPredictions) {
        let myBus = busPredictions.find(bus => bus.TripID === tripId)
        
        if (!!myBus) {
            if (myBus.Minutes <= alarmSettingMins) {
                alarmSound.play();
                clearInterval(alarm)
                notificationBlock.innerHTML = ""
                document.getElementById('main-container').innerHTML = ""
            }
        }

        if (!myBus) {
            lostSound.play()
            alert("We're sorry. Your selected bus is no longer providing prediction data.")
            notificationBlock.innerHTML = ""
        }
    };
    
    let alarm = setInterval(function () {
        fetch(busPredictionPrefix + stopId, configObj)
        .then(response => response.json())
        .then(data => { checkAlarm(data.Predictions)
            getBuses(data, stopId)
        })
    }, 30000)
}