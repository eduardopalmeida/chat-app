const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
const formulario = document.querySelector('#message-form')
const formText = document.querySelector('input')

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


socket.on('message', (message) => {
    console.log(message)
    
    const html = Mustache.render(messageTemplate, {
        username : message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('HH:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('locationMessage', (message) => {
    console.log(message)

    const html = Mustache.render(locationTemplate, {
        username : message.username,
        url : message.url,
        createdAt : moment(message.createdAt).format('HH:mm:ss')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

formulario.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendmessage', message, (error) => {

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$sendLocationButton.addEventListener('click', (error) => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser!')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            lat: position.coords.latitude,
            lon: position.coords.longitude
        }, (error) => {
            if (error) {
                return console.log(error)
            }
            $sendLocationButton.removeAttribute('disabled')

            console.log("Location delivered")
        })
    })
})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})