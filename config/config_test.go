package config

import (
	"os"
	"strconv"
	"testing"

	"github.com/stretchr/testify/require"
)

// GetEnvString

func TestGetEnvStringReturnsOsVal(t *testing.T) {
	const key = "asanaban_test_key"
	const expected = "asanaban_test_val"
	os.Setenv(key, expected)

	actual := getEnvString(key)

	require.Equal(t, expected, actual)
}

func TestGetEnvStringAllowsMissing(t *testing.T) {
	actual := getEnvString("some_unset_key")
	require.Equal(t, "", actual)
}

// GetEnvInt

func TestGetEnvIntParseFromString(t *testing.T) {
	const key = "asanaban_test_int_key"
	const expected = 42
	val := strconv.Itoa(expected)
	os.Setenv(key, val)

	actual := getEnvInt(key)

	require.Equal(t, expected, actual)
}

func TestGetEnvIntPanicIfNoKey(t *testing.T) {
	tester := func() {
		getEnvInt("some_unset_key")
	}

	require.Panics(t, tester)
}

func TestGetEnvPanicsIfCantParse(t *testing.T) {
	const key = "asanaban_test_int_key_invalid_val"
	const val = "not-an-int"
	os.Setenv(key, val)
	tester := func() {
		getEnvInt(key)
	}

	require.Panics(t, tester)
}

// RequireEnvString

func TestRequireEnvStringReturnsIfExists(t *testing.T) {
	const key = "asanaban_test_require_key"
	const expected = "asanaban_test_require_val"
	os.Setenv(key, expected)

	actual := requireEnvString(key)

	require.Equal(t, expected, actual)
}

func TestRequireEnvStringPanicsIfNoKey(t *testing.T) {
	tester := func() {
		requireEnvString("some_unset_key")
	}

	require.Panics(t, tester)
}

// GetOsArgs

func TestGetOsArgReturnsIndexIfExists(t *testing.T) {
	const expected = "arg1"
	os.Args = []string{"app", expected}

	actual := getOsArg(1, "fallback")
	require.Equal(t, expected, actual)
}

func TestGetOsArgUsesFallbackIfNotExists(t *testing.T) {
	const expected = "fallback-value"
	actual := getOsArg(5000, expected)
	require.Equal(t, expected, actual)
}
