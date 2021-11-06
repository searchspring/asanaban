package handler

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
)

var (
	githubDAO    = NewDAO()
	clientID     = "1201298517859389"
	clientSecret = os.Getenv("ASANA_CLIENT_SECRET")
	redirectURL  = os.Getenv("ASANA_REDIRECT_URL")
)

func checks() {
	if os.Getenv("ASANA_REDIRECT_URL") == "" {
		panic("must set ASANA_REDIRECT_URL variable")
	}
	if os.Getenv("ASANA_CLIENT_SECRET") == "" {
		panic("must set ASANA_CLIENT_SECRET variable")
	}
}

func Handler(w http.ResponseWriter, r *http.Request) {
	checks()
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "no asana code found in request", http.StatusBadRequest)
		return
	}

	tokenResponse, err := githubDAO.GetTokenResponse(code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}
	html := `
		<script>
			let tokenResponse = ` + string(tokenResponse) + `;
			window.location.href = '/token?payload=' + encodeURIComponent(JSON.stringify(tokenResponse));
		</script>
		`
	_, err = w.Write([]byte(html))
	if err != nil {
		http.Error(w, err.Error(), http.StatusForbidden)
		return
	}
}

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

func (d *DAOImpl) GetTokenResponse(code string) ([]byte, error) {
	data := fmt.Sprintf("grant_type=authorization_code"+
		"&client_id=%s"+
		"&client_secret=%s"+
		"&redirect_uri=%s"+
		"&code=%s"+
		"&code_verifier=12345678901234567890123456789012345678901234567890", clientID, clientSecret, redirectURL, code)
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
