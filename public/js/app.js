var socket;
var activeValue = null;
var usernameKey = "username";


(function() {
    socket = new WebSocket("ws://" + window.location.host + "/websocket");

    _listenRemote();
    setTimeout(() => _initState(), 250);
})()

function clickCard(value) {
    if(value != activeValue) {
        $(`#c${activeValue}`).removeClass('active');
        $(`#c${value}`).addClass('active');
        activeValue = value;
        _sendEvent('CardChoosed', value);
    }
}

function _initState() {
    _setUsername();

    // Confirma se usuario quer sair da pagina
    window.onbeforeunload = exitEvent;
    function exitEvent() {
        _sendEvent('PlayerDisconnected', null);
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

    _sendEvent('PlayerConnected', null);
}

function _listenRemote() {
    socket.addEventListener("message", function(e) {
        const data = JSON.parse(e.data);
        switch (data.event) {
            case 'PlayerConnected':
                _handlePlayerConnected(data.username);
                break;
            case 'CardChoosed':
                _handleCardChoosed(data.value);
                break;
            case 'PlayerDisconnected':
                _handlePlayerDisconnected(data.username);
                break;
            case 'ShowCards':
                break;
        }
    });
}

function _handleCardChoosed(value) {
    const msg = value == 'z' ? '?' : value;
    $("#my-value").html(msg);
}

function _handlePlayerConnected(newUsername) {
    const username = localStorage.getItem(usernameKey);
    if(username !== newUsername) {
        newUsername = newUsername.replace(/\"/g,"");
        const player = _playerTemplate(newUsername);
        $('.players-position').append(player);
    }
}

function _handlePlayerDisconnected(username) {
    $(`#pc-${username}`).remove();
}

function _playerTemplate(username) {
    return `
        <div id="pc-${username}" class="player">
            <b>${username}</b>
            <div class="card-back">8</div>
        </div>
    `;
}