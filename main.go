package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"os/user"
	"time"

	middleware "github.com/gorilla/handlers"
	"github.com/searchspring/asanaban/api"
	"github.com/searchspring/asanaban/config"
)

func main() {

	_config := config.Load()
	user, _ := user.Current()

	log.Printf("Current user: %v\n", user.Username)

	server := createNewServer(_config)

	startServer(server)
	waitForSigInt(server)
}

func startServer(server *http.Server) {
	go func() {
		log.Printf("Asanaban listening at %s\n", server.Addr)
		if err := server.ListenAndServe(); err != nil {
			log.Println(err)
		}
	}()
}

func createNewServer(_config *config.Config) *http.Server {
	router := createNewRouter()
	return &http.Server{
		Addr:         fmt.Sprintf(":%d", _config.HttpPort),
		WriteTimeout: time.Minute * 60,
		ReadTimeout:  time.Minute * 60,
		IdleTimeout:  time.Minute * 60,
		Handler:      router,
	}
}

func createNewRouter() http.Handler {
	router, err := api.CreateRouter()
	if err != nil {
		panic(err)
	}

	router.PathPrefix("").Handler(http.FileServer(http.Dir("./public")))

	return middleware.LoggingHandler(os.Stdout, router)
}

func waitForSigInt(httpServer *http.Server) {
	var wait time.Duration
	flag.DurationVar(&wait, "graceful-timeout", time.Second*15, "the duration for which the server gracefully wait for existing connections to finish - e.g. 15s or 1m")
	flag.Parse()

	c := make(chan os.Signal, 1)
	// We'll accept graceful shutdowns when quit via SIGINT (Ctrl+C)
	// SIGKILL, SIGQUIT or SIGTERM (Ctrl+/) will not be caught.
	signal.Notify(c, os.Interrupt)

	// Block until we receive our signal.
	<-c

	// Create a deadline to wait for.
	ctx, cancel := context.WithTimeout(context.Background(), wait)
	defer cancel()
	// Doesn't block if no connections, but will otherwise wait
	// until the timeout deadline.
	//nolint
	httpServer.Shutdown(ctx)

	// Optionally, you could run srv.Shutdown in a goroutine and block on
	// <-ctx.Done() if your application should wait for other services
	// to finalize based on context cancellation.
	log.Println("shutting down")
	os.Exit(0)
}
