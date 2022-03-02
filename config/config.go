package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

const devEnv = "dev"

var (
	Version = devEnv
	Hash    = "dev"
)

type Config struct {
	HttpPort          int
	ClientId          string
	RedirectUrl       string
	AppUrl            string
	AsanaClientSecret string
	CodeVerifier      string
	Version           string
	Hash              string
}

func Load() *Config {
	return &Config{
		HttpPort:          getEnvInt("HTTP_PORT"),
		ClientId:          requireEnvString("CLIENT_ID"),
		RedirectUrl:       requireEnvString("REDIRECT_URL"),
		AppUrl:            requireEnvString("APP_URL"),
		CodeVerifier:      requireEnvString("CODE_VERIFIER"),
		AsanaClientSecret: requireEnvString("ASANA_CLIENT_SECRET"),
		Version:           getOsArg(1, Version),
		Hash:              getOsArg(2, Hash),
	}
}

func getOsArg(idx int, fallback string) string {
	if len(os.Args) > idx && os.Args[idx] != "" {
		return os.Args[idx]
	}
	return fallback
}

func requireEnvString(envName string) string {
	value := getEnvString(envName)

	if value == "" {
		panic("Require ENV: " + envName)
	}

	return value
}

func getEnvString(envName string) string {
	value, present := os.LookupEnv(envName)

	if !present || strings.TrimSpace(value) == "" {
		fmt.Sprintln("Could not find ENV: " + envName)
		return ""
	}

	return value
}

func getEnvInt(envName string) int {
	value := requireEnvString(envName)

	parsed, err := strconv.Atoi(value)
	if err != nil {
		// Even though a Try* func, we still want to panic if we cannot parse (i.e. there is an error in the data that we want people to be aware of)
		panic("Could not parse int from ENV: " + envName)
	}

	return parsed
}
