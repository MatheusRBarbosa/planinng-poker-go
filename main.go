package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/go-redis/redis"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

var (
	rdb *redis.Client
)

type ValueMessage struct {
	Username string `json:"username"`
	Session  string `json:"sessionId"`
	Event    string `json:"event"`
	Value    string `json:"value"`
}

const (
	CardChoosed        string = "CardChoosed"
	PlayerConnected           = "PlayerConnected"
	PlayerDisconnected        = "PlayerDisconnected"
	ShowCardsButton           = "ShowCardsButton"
	ShowCards                 = "ShowCards"
	ShowCardsCountdown        = "ShowCardsCountdown"
)

var clients = make(map[*websocket.Conn]bool)
var broadcaster = make(chan ValueMessage)
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	defer ws.Close()
	clients[ws] = true

	for {
		var msg ValueMessage
		// Read in a new message as JSON and map it to a Message object
		err := ws.ReadJSON(&msg)
		if err != nil {
			delete(clients, ws)
			break
		}

		if msg.Event == PlayerDisconnected {
			removeFromRedis(msg.Username, msg.Session)
		} else if msg.Event == PlayerConnected {
			if rdb.Exists(msg.Session).Val() != 0 {
				loadPreviousPlayers(ws, msg.Session)
			}
			storeInRedis(msg.Username, msg.Session)
		} else if msg.Event == CardChoosed {
			sendShowCards(msg)
		}

		// send new message to the channel
		broadcaster <- msg
	}
}

func sendShowCards(msg ValueMessage) {
	var showCards = ValueMessage{
		Username: msg.Username,
		Value:    "",
		Event:    ShowCardsButton,
	}

	broadcaster <- showCards
}

func loadPreviousPlayers(ws *websocket.Conn, session string) {
	players, err := rdb.LRange(session, 0, -1).Result()
	if err != nil {
		panic(err)
	}

	// send previous messages
	for _, player := range players {
		var msg ValueMessage
		msg.Username = player
		msg.Event = PlayerConnected
		msg.Session = session
		msg.Value = ""
		messageClient(ws, msg)
	}
}

func handleMessages() {
	for {
		// grab any next message from channel
		msg := <-broadcaster

		messageClients(msg)
	}
}

func messageClients(msg ValueMessage) {
	// send to every client currently connected
	for client := range clients {
		messageClient(client, msg)
	}
}

func messageClient(client *websocket.Conn, msg ValueMessage) {
	err := client.WriteJSON(msg)
	if err != nil && unsafeError(err) {
		log.Printf("error: %v", err)
		client.Close()
		delete(clients, client)
	}
}

func storeInRedis(username string, session string) {
	json, err := json.Marshal(username)
	if err != nil {
		panic(err)
	}

	if err := rdb.RPush(session, json).Err(); err != nil {
		panic(err)
	}
}

func removeFromRedis(username string, session string) {
	json, err := json.Marshal(username)
	if err != nil {
		panic(err)
	}

	if err := rdb.LRem(session, 0, json).Err(); err != nil {
		panic(err)
	}

	tryCloseSession(session)
}

func tryCloseSession(session string) {
	if rdb.Exists(session).Val() == 0 {
		rdb.Del(session)
	}
}

// If a message is sent while a client is closing, ignore the error
func unsafeError(err error) bool {
	return !websocket.IsCloseError(err, websocket.CloseGoingAway) && err != io.EOF
}

func main() {
	env := os.Getenv("GO_ENV")
	if "" == env {
		err := godotenv.Load()
		if err != nil {
			log.Fatal("Error loading .env file")
		}
	}

	port := os.Getenv("PORT")

	redisUrl := os.Getenv("REDIS_URL")

	opt, err := redis.ParseURL(redisUrl)
	if err != nil {
		panic(err)
	}
	rdb = redis.NewClient(opt)

	http.Handle("/", http.FileServer(http.Dir("./public")))
	http.HandleFunc("/websocket", handleConnections)
	go handleMessages()

	log.Print("Server starting at localhost:" + port)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}
