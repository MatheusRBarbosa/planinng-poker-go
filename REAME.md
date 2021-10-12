# go-chat

## Project setup
### Download and Install Go Lang
```
https://golang.org/
```

### redis to save old msgs running on docker
```
docker run --name redis -p 6379:6379 -d redis
```

### Install dependencies
```
go mod tidy
```

### Start server
```
go run main.go
```

### Access chat on browser
```
http://localhost:4444/
```