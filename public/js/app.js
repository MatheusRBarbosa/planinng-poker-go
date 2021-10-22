var socket;
var activeValue = null;
var usernameKey = "username";
var alreadyShowed = false;
var sessionId = null;

(function() {
    const urlParams = new URLSearchParams(window.location.search);
    if(_hasSession(urlParams) && _hasUsername()) {
        _createSocket();
        _listenRemote();
        setTimeout(() => _initState(urlParams), 250);
    } else {
        _redirectToIndex(urlParams);
    }

})()

function clickCard(value) {
    if(value != activeValue) {
        $(`#c${activeValue}`).removeClass('active');
        $(`#c${value}`).addClass('active');
        activeValue = value;
        _sendEvent('CardChoosed', value);
    }
}

function clickShowCards() {
    _sendEvent('ShowCards', null);
}

function resetTable() {
    _sendEvent('ResetCards', null);
}

function goToHome() {
    window.location.href = '/';
}

function _hasSession(urlParams) {
    const hasSession = urlParams.has('s');
    return hasSession;
}

function _createSocket() {
    let protocol = 'ws';
    if(location.protocol == 'https:') {
        protocol = 'wss';
    }

    const url = `${protocol}://${window.location.host}/websocket`;
    socket = new WebSocket(url);
}

function _hasUsername() {
    const hasUsername = !!localStorage.getItem(usernameKey);
    return hasUsername;
}

function _initState(urlParams) {
    sessionId = urlParams.get('s');
    _getUsername();
    _sendEvent('PlayerConnected', null);

    // Confirma se usuario quer sair da pagina
    window.onbeforeunload = exitEvent;
    function exitEvent() {
        _sendEvent('PlayerDisconnected', null);
    }
}

function _redirectToIndex(urlParams) {
    sessionId = null;
    let url = `/`;
    if(urlParams.has('s')) {
        url = `index.html?s=${urlParams.get('s')}`;
    }

    window.location.href = url;
}

function _sendEvent(event, value) {
    const username = localStorage.getItem(usernameKey);
    _waitConnection(() => {
        socket.send(
            JSON.stringify({
                username,
                sessionId,
                value,
                event
            })
        )
    });
}

function _waitConnection(callback) {
    setTimeout(() => {
        if(socket.readyState === 1) {
            if(callback !== undefined) {
                callback();
            }

            return;
        } else {
            _waitConnection(callback);
        }
        console.log("Tentando estabelecer conexão com socket...");
    }, 100);
}

function _getUsername() {
    let username = localStorage.getItem(usernameKey);

    $("#me").html(username);
    $("#username").html(username);
}

function _listenRemote() {
    socket.addEventListener("message", function(e) {
        const data = JSON.parse(e.data);
        switch (data.event) {
            case 'PlayerConnected':
                _handlePlayerConnected(data.username);
                break;
            case 'CardChoosed':
                _handleCardChoosed(data);
                break;
            case 'PlayerDisconnected':
                _handlePlayerDisconnected(data.username);
                break;
            case 'ShowCardsButton':
                _handleShowCardsButton();
                break;
            case 'ShowCards':
                _handleshowCards();
                break;
            case 'ResetCards':
                _handleResetCards();
                break;
        }
    });
}

function _handleCardChoosed(data) {
    let card = null;
    const msg = data.value == 'z' ? '?' : data.value;

    if(data.username == localStorage.getItem(usernameKey)) {
        card = $("#my-value");
        card.removeClass();
        card.addClass('btn');
        card.addClass('btn-card');
    } else {
        card = $(`#pc-${data.username}`);
        card.removeClass();
        card.addClass('card-back');
    }

    card.html(msg);
}

function _handlePlayerConnected(newUsername) {
    const username = localStorage.getItem(usernameKey);
    if(username !== newUsername) {
        newUsername = newUsername.replace(/\"/g,"");
        const player = _newPlayerTemplate(newUsername);
        $('.players-position').append(player);
    }
}

function _handlePlayerDisconnected(username) {
    $(`#${username}`).remove();
}

function _handleShowCardsButton() {
    const button = _newButtonActionTemplate('Mostrar cartas', 'clickShowCards');
    $('#table').html(button);
}

async function _handleshowCards() {    
    if(!alreadyShowed) {
        alreadyShowed = true;

        for(i = 3; i > 0; i--) {
            const text = `<p>Mostrando cartas em ${i}</p>`
            $('#table').html(text);
            await _sleep(1000);
        }

        _showCards();
        _showResetButton();
    }
}

function _handleResetCards() {
    const tableText = '<p>Escolham suas cartas!</p>';
    $('#table').html(tableText);
    
    $('#my-value').removeClass();
    $('#my-value').html("");
    $('#my-value').addClass('no-card');

    $('div[card]').removeClass();
    $('div[card]').addClass('no-card');
    $('div[card]').html("");

    $('.active').removeClass('active');

    activeValue = null;
    alreadyShowed = false;
}

function _showCards() {
    $('div[card]').removeClass();
    $('div[card]').addClass('btn btn-card');
}

function _showResetButton() {
    const button = _newButtonActionTemplate('Zerar mesa', 'resetTable');
    $('#table').html(button);
}

function _newButtonActionTemplate(text, action) {
    return `<button onclick="${action}()" class="btn btn-black">${text}</button>`
}

function _newPlayerTemplate(username) {
    return `
        <div id="${username}" class="player">
            <b>${username}</b>
            <div id="pc-${username}" card class="no-card"></div>
        </div>
    `;
}

function _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }