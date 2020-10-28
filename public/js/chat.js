const socket = io();

//elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
	//new/incoming message element
	const $newMessage = $messages.lastElementChild;

	//height of new/incoming message
	const newMessageStyles = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	//visible height
	const visibleHeight = $messages.offsetHeight;

	//height of message container
	const containerHeight = $messages.scrollHeight;

	//how far has user scrolled?
	const scrollOffset = $messages.scrollTop + visibleHeight;

	if((containerHeight - newMessageHeight) <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight;
	}
}

socket.on('message', (message) => {
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
})

socket.on('locationMessage', (url) => {
	const html = Mustache.render(locationMessageTemplate, {
		username: url.username,
		url: url.text,
		createdAt: moment(url.createdAt).format('h:mm a')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoscroll();
})

socket.on('roomData', ({ room, users}) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	});
	document.querySelector('#sidebar').innerHTML = html;
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
	e.preventDefault();

	$messageFormButton.setAttribute('disabled', 'disabled');

	socket.emit('sendMessage', e.target[0].value, (message) => {
		
		$messageFormButton.removeAttribute('disabled');
		$messageFormInput.value = '';
		//console.log(message);
	});
})

$locationButton.addEventListener('click', (e) => {

	if(!navigator.geolocation){
		return alert('Geolocation is not supported by your browser')
	} 
	$locationButton.setAttribute('disabled', 'disabled');

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit('sendLocation', { lat: position.coords.latitude, lng: position.coords.longitude }, (message) => {
			//console.log(message)
		});
		$locationButton.removeAttribute('disabled');
	})
})

socket.emit('join', { username, room }, (error) => {
	if(error){
		alert(error)
		location.href = '/'
	}
});