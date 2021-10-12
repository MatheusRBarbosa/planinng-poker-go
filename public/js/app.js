var socket;
var activeValue = null;
var usernameKey = "username";

(function() {
    socket = new WebSocket("ws://" + window.location.host + "/websocket");

    _setUsername();
    _listenRemote();
})()

function clickCard(value) {
    if(value != activeValue) {
        $(`#c${activeValue}`).removeClass('active');
        $(`#c${value}`).addClass('active');
        activeValue = value;
        _sendEvent('ClickCard', value);
    }
}

function _sendEvent(event, value) {
    const username = localStorage.getItem(usernameKey);
    socket.send(
        JSON.stringify({
            username,
            value,
            event
        })
    )
}

function _setUsername() {
    
    let username = localStorage.getItem(usernameKey);
    if(!username) {
        username = Math.floor(Math.random() * 100000) + 1;
        localStorage.setItem(usernameKey, username);
    }

    $("#me").html(username);
    $("#username").html(username);
}

function _listenRemote() {
    const table = $("#my-value");
    socket.addEventListener("message", function(e) {
        const data = JSON.parse(e.data);
        const msg = data.value == 'z' ? '?' : data.value;
        table.html(msg);
    });
}