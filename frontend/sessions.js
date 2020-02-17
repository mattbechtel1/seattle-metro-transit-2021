const sessionURL = 'http://localhost:3000/login'
let userId
let userHeldInState

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('log').addEventListener('click', showLogIn)
})

function showLogIn() {
    const mainContainer = clearAndReturnMain()

    const form = document.createElement('form');
    form.id = 'login-form'

    const outerDiv = document.createElement('div');
    outerDiv.classList.add('field')
    form.appendChild(outerDiv)

    const innerDiv1 = document.createElement('div');
    innerDiv1.classList.add('control')

    const emailInput = document.createElement('input');
    emailInput.classList.add('input');
    emailInput.setAttribute('name', 'email');
    emailInput.setAttribute('placeholder', "Enter email address")
    innerDiv1.appendChild(emailInput)

    const innerDiv2 = document.createElement('div')
    innerDiv2.classList.add('control')

    const passwordInput = document.createElement('input')
    passwordInput.classList.add('input');
    passwordInput.type = 'password'
    passwordInput.setAttribute('name', 'password');
    passwordInput.setAttribute('placeholder', "Enter password")
    innerDiv2.appendChild(passwordInput)


    const innerDiv3 = document.createElement('div')
    innerDiv3.classList.add('control')

    const submitBtn = createSubmit('Log In')
    innerDiv3.appendChild(submitBtn)

    outerDiv.append(innerDiv1, innerDiv2, innerDiv3)
    form.addEventListener('submit', startSession)
    mainContainer.appendChild(form)

}

let createSubmit = function(btnText) {
    const submitBtn = document.createElement('button');
    submitBtn.classList.add('button', 'is-primary')
    submitBtn.innerText = btnText;
    submitBtn.type = 'submit';

    return submitBtn
}

class UserFormObject {
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }

    get objectify() {
        return {
            email: this.email,
            password: this.password
        }
    }
}

function startSession(event) {
    event.preventDefault()

    let formObj = new UserFormObject(event.target.email.value, event.target.password.value)
    
    fetch(sessionURL, hostedObj('POST', formObj.objectify))
    .then(response => response.json())
    .then(user => {
        if (user.error) {
            alert(user.message)
        } else {
            userHeldInState = user
            userId = user.id
            const favLink = document.getElementById('favorites')
            favLink.style.display = 'flex'
            greetUser(user)
        }
    })
}

function greetUser(user) {
    document.getElementById('notification-block').innerText = "Welcome " + user.email
    clearAndReturnMain()
}

function displayFavorites(favList) {
    const mainContainer = clearAndReturnMain()
    const listContainer = document.createElement('table')
    listContainer.classList.add('table', 'is-hoverable')
    const containerBody = document.createElement('tbody')
    listContainer.appendChild(containerBody)

    const favElements = favList.map(fav => {
        let row = document.createElement('tr')

        let stopNum = document.createElement('td');
        // stopNum.dataset.favStopId = fav.lookup
        let stopBox = document.createElement('a')
        stopBox.innerText = fav.permanent_desc
        stopBox.classList.add('stopbox')

        let stopDesc = document.createElement('div')
        stopDesc.classList.add('bus-description')
        stopDesc.innerText = " " + fav.description;
        stopDesc.id = `favorite-${fav.id}`
        stopNum.append(stopBox, stopDesc)

        if (fav.transit_type === 'bus') {
            stopNum.addEventListener('click', (e) => {
                fetch('http://localhost:3000/metro/busstop/' + fav.lookup)
                .then(response => response.json())
                .then(data => checkForBuses(data, fav.lookup))
            })
        } else {
            stopNum.addEventListener('click', (e) => {
                fetch('http://localhost:3000/metro/station/' + fav.lookup)
                .then(response => response.json())
                .then(data => {
                    displayTrains(data.Trains, fav.description)
                })
            })
        }
            
        const editFigure = document.createElement('a')
        editFigure.innerText = '✏️'
        editFigure.classList.add('clickable-emoji')
        editFigure.dataset.fav = fav.id
        editFigure.addEventListener('click', (e) => editFav(e.target.dataset.fav))

        const deleteFigure = document.createElement('a')
        deleteFigure.innerText = '🗑️'
        deleteFigure.classList.add('clickable-emoji')
        deleteFigure.dataset.fav = fav.id
        deleteFigure.addEventListener('click', (e) => deleteFavConfirm(e.target.dataset.fav))

        row.append(stopNum, editFigure, deleteFigure)

        return row
    })

    favElements.forEach(elem => {
        containerBody.appendChild(elem)
    })

    mainContainer.appendChild(listContainer)
}

function editFav(favId) {
    const editableFavDescription = document.getElementById(`favorite-${favId}`)
    
    const editDescriptionForm = document.createElement('form')
    editDescriptionForm.classList.add('bus-description')
    editDescriptionForm.addEventListener('submit', saveEdit)
    editDescriptionForm.addEventListener('click', (e) => e.stopPropagation())
    editDescriptionForm.dataset.favId = favId
    
    const descriptionInput = document.createElement('input')
    descriptionInput.classList.add('input','resized-input');
    descriptionInput.setAttribute('name', 'description');
    descriptionInput.setAttribute('maxlength', '60')
    descriptionInput.setAttribute('placeholder', editableFavDescription.innerText)
    
    const descriptionSaveBtn = createSubmit('Save')

    const cancelEditBtn = document.createElement('button')
    cancelEditBtn.innerText = 'Cancel'
    cancelEditBtn.classList.add('button', 'is-warning')
    cancelEditBtn.addEventListener('click', removeEditForm)
    
    editDescriptionForm.append(descriptionInput, descriptionSaveBtn, cancelEditBtn)
    editableFavDescription.setAttribute('hidden', true)
    
    editableFavDescription.insertAdjacentElement('afterend', editDescriptionForm)

    function removeEditForm() {
        formContainer.remove()
        editableFavDescription.removeAttribute('hidden')
    }
}

function saveEdit(e) {
    e.preventDefault()
    fetch(`${favoriteUrl}/${e.target.dataset.favId}`, hostedObj('PATCH', {
        description: e.target.description.value
    }))
    .then(response => response.json())
    .then(updatedFav => {
        if (updatedFav.error) {
            alert(updatedFav.message)
        } else {
            updateFavInState(updatedFav)
        }
    })
}

function deleteFavConfirm(favId) {
    if (confirm("Are you sure you want to delete this favorite?")) {
        fetch(`${favoriteUrl}/${favId}`, hostedObj('DELETE', null))
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error)
            } else {
                deleteFavFromState(data.id)
            }
        })
    }
}

function deleteFavFromState(favId) {
    const updatedFavs = userHeldInState.favorites.filter(fav => fav.id !== favId)
    userHeldInState.favorites = updatedFavs
    displayFavorites(updatedFavs)
}

function updateFavInState(replacementFav) {
    const oldFavIdx = userHeldInState.favorites.findIndex(fav => fav.id === replacementFav.id)
    userHeldInState.favorites = [...userHeldInState.favorites.slice(0, oldFavIdx), replacementFav, ...userHeldInState.favorites.slice(oldFavIdx + 1)]
    displayFavorites(userHeldInState.favorites)
}