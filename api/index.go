package api

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/searchspring/asanaban/config"
)

// dao
type DAO interface {
	GetTokenResponse(code string) ([]byte, error)
}

type GithubClient interface {
	Do(req *http.Request) (*http.Response, error)
}

type GithubClientImpl struct {
	client *http.Client
}

func (g *GithubClientImpl) Do(req *http.Request) (*http.Response, error) {
	return g.client.Do(req)
}

type DAOImpl struct {
	Client GithubClient
}

func NewDAO() DAO {
	return &DAOImpl{
		Client: &GithubClientImpl{
			client: http.DefaultClient,
		},
	}
}

func CreateRouter() (*mux.Router, error) {
	router := mux.NewRouter().StrictSlash(true).UseEncodedPath()
	router.HandleFunc("/api", Handler).Methods(http.MethodGet)
	return router, nil
}

func Handler(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "no asana code found in request", http.StatusBadRequest)
		return
	}

	githubDAO := NewDAO()
	tokenResponse, err := githubDAO.GetTokenResponse(code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}

	env := config.Load()
	html := `
		<script>
			let tokenResponse = ` + string(tokenResponse) + `;
			window.location.href = '` + env.RedirectUrl + `' + '/?payload=' + encodeURIComponent(JSON.stringify(tokenResponse));
		</script>
		`
	_, err = w.Write([]byte(html))
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}
}

func (d *DAOImpl) GetTokenResponse(code string) ([]byte, error) {
	env := config.Load()

	data := fmt.Sprintf(
		"grant_type=authorization_code"+
			"&client_id=%s"+
			"&client_secret=%s"+
			"&redirect_uri=%s/api"+
			"&code=%s"+
			"&code_verifier=%s",
		env.ClientId,
		env.AsanaClientSecret,
		env.RedirectUrl,
		code,
		env.CodeVerifier,
	)

	payload := strings.NewReader(data)

	req, err := http.NewRequest("POST", "https://app.asana.com/-/oauth_token", payload)
	if err != nil {
		return nil, err
	}
	req.Header.Add("content-type", "application/x-www-form-urlencoded")
	resp, err := d.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	return body, nil
}
