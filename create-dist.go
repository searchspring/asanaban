package main

import (
	"bytes"
	"crypto/md5"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"regexp"
	"strings"

	"github.com/aymerick/douceur/css"
	"github.com/aymerick/douceur/parser"
	"github.com/iancoleman/strcase"
	"github.com/otiai10/copy"
	"github.com/tdewolff/minify"
	mcss "github.com/tdewolff/minify/css"
	"github.com/tdewolff/minify/html"
	"github.com/tdewolff/minify/js"
)

var m = minify.New()

func main() {
	minifier := &html.Minifier{
		KeepDocumentTags:        true,
		KeepConditionalComments: true,
		KeepEndTags:             true,
		KeepDefaultAttrVals:     true,
	}
	m.AddFunc("text/css", mcss.Minify)
	m.AddFunc("text/html", func(m *minify.M, w io.Writer, r io.Reader, params map[string]string) error {
		return minifier.Minify(m, w, r, params)
	})
	m.AddFunc("application/javascript", js.Minify)
	files, err := ioutil.ReadDir("./www")
	if err != nil {
		log.Fatal(err)
	}
	os.MkdirAll("dist", os.ModePerm)
	err = copy.Copy("www", "dist")
	if err != nil {
		log.Fatal(err)
	}
	os.RemoveAll("dist/js/")
	os.RemoveAll("dist/js-external/")
	os.RemoveAll("dist/snippets/")
	os.MkdirAll("dist/js", 0777)

	jsFiles, err := loadAllJS()
	if err != nil {
		log.Fatal(err)
	}
	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".html") {
			log.Println(file.Name())
			output := "dist/" + file.Name()
			html, err := processHTML("www/"+file.Name(), jsFiles)
			if err != nil {
				log.Fatal(err)
			}
			minified := bytes.NewBufferString("")
			err = m.Minify("text/html", minified, strings.NewReader(html))
			if err != nil {
				panic(err)
			}
			ioutil.WriteFile(output, minified.Bytes(), 0777)
		}
	}

	minifyCSS()

}
func processSelectors(rule *css.Rule, set map[string][]string, orderedSelectors []string) []string {
	for _, selector := range rule.Selectors {
		key := selector
		lastIndexColon := strings.LastIndex(key, ":")
		if lastIndexColon != -1 {
			if string(key[lastIndexColon-1]) == `:` {
				key = key[0 : lastIndexColon-1]
			} else if string(key[lastIndexColon-1]) != `\` {
				key = key[0:lastIndexColon]
			}
		}
		key = strings.ReplaceAll(key, `\:`, ":")
		key = strings.ReplaceAll(key, `\/`, "/")
		if _, ok := set[key]; !ok {
			set[key] = []string{}
			orderedSelectors = append(orderedSelectors, key)
		}
		set[key] = append(set[key], rule.String())
	}
	return orderedSelectors
}
func minifyCSS() {

	allCSSTokens := map[string]map[string][]string{}
	orderedSelectors := make([]string, 10)
	allCSSTokens["global"] = map[string][]string{}
	contents := loadFile("www/css/style.css")
	mediaKeys := []string{}
	stylesheet, err := parser.Parse(contents)
	if err != nil {
		panic(err)
	}
	for _, rule := range stylesheet.Rules {
		if rule.Name == "@media" {
			if _, ok := allCSSTokens[rule.Prelude]; !ok {
				allCSSTokens[rule.Prelude] = map[string][]string{}
				mediaKeys = append(mediaKeys, rule.Prelude)
			}
			set := allCSSTokens[rule.Prelude]
			for _, mediaRule := range rule.Rules {
				orderedSelectors = processSelectors(mediaRule, set, orderedSelectors)
			}
		} else {
			set := allCSSTokens["global"]
			orderedSelectors = processSelectors(rule, set, orderedSelectors)

		}
	}

	jsFiles, _ := ioutil.ReadDir("./www/js")
	allTokens := map[string]bool{}
	re := regexp.MustCompile(`\b([a-z0-9\-\:]+)`)
	for _, file := range jsFiles {
		if strings.HasSuffix(file.Name(), ".js") {
			contents := loadFile("www/js/" + file.Name())
			matches := re.FindAllStringSubmatch(contents, -1)
			for _, match := range matches {
				allTokens[match[1]] = true
			}
		}
	}
	htmlFiles, _ := ioutil.ReadDir("./www")
	for _, file := range htmlFiles {
		if strings.HasSuffix(file.Name(), ".html") {
			contents := loadFile("www/" + file.Name())
			matches := re.FindAllStringSubmatch(contents, -1)
			for _, match := range matches {
				allTokens[match[1]] = true
			}
		}
	}
	snippetFiles, _ := ioutil.ReadDir("./www/snippets")
	for _, file := range snippetFiles {
		if strings.HasSuffix(file.Name(), ".html") {
			contents := loadFile("www/snippets/" + file.Name())
			matches := re.FindAllStringSubmatch(contents, -1)
			for _, match := range matches {
				allTokens[match[1]] = true
			}
		}
	}

	globals := allCSSTokens["global"]
	newCSS := ""
	newCSSMedia := map[string]string{}
	for _, style := range globals["*"] {
		newCSS += style + "\n"
	}
	for _, key := range orderedSelectors {
		tokenKey := key
		if strings.HasPrefix(key, ".") {
			tokenKey = key[1:]
		}
		if _, ok := allTokens[tokenKey]; ok {
			for _, style := range globals[key] {
				newCSS += style + "\n"
			}
			for mediaKey, mediaTokens := range allCSSTokens {
				if mediaKey != "global" {
					for _, style := range mediaTokens[key] {
						newCSSMedia[mediaKey] = style + "\n"
					}
				}
			}
		}
	}

	for _, key := range mediaKeys {
		if key != "global" {
			newCSS += "@media " + key + " {\n"
			newCSS += newCSSMedia[key]
			newCSS += "}\n"
		}
	}

	minified := bytes.NewBufferString("")
	err = m.Minify("text/css", minified, strings.NewReader(newCSS))
	if err != nil {
		panic(err)
	}
	ioutil.WriteFile("dist/css/style.css", minified.Bytes(), 0777)
}

func loadFile(path string) string {
	fileBytes, err := ioutil.ReadFile(path)
	if err != nil {
		log.Fatal(err)
	}
	return string(fileBytes)
}

func processHTML(filename string, jsFiles []string) (string, error) {
	html := loadFile(filename)

	regex := regexp.MustCompile(`<meta name="snippet" content="([^"]+)">`)
	matches := regex.FindAllStringSubmatch(html, -1)
	for _, match := range matches {
		if len(match) > 0 {
			html = strings.ReplaceAll(html, match[0], loadFile("www/"+match[1]))
		}
	}

	regex = regexp.MustCompile(`<snippet content="([^"]+)"></snippet>`)
	matches = regex.FindAllStringSubmatch(html, -1)
	for _, match := range matches {
		if len(match) > 0 {
			html = strings.ReplaceAll(html, match[0], loadFile("www/"+match[1]))
		}
	}

	js := ""
	jsFileName := ""
	regex = regexp.MustCompile(`<script src="(js[^"]+)"></script>\n`)
	matches = regex.FindAllStringSubmatch(html, -1)
	for _, match := range matches {
		if len(match) > 0 {
			html = strings.ReplaceAll(html, match[0], "")
			file := match[1]
			jsFileName += file
			js += "//------------\n//" + file + ".js\n" + loadFile("www/"+file) + "\n"
		}
	}

	globalJS := loadFile("www/js/global.js")
	globalJS = strings.ReplaceAll(globalJS, "GS.environment = 'development'", "GS.environment = 'production'")
	js += "//------------\n//global.js\n" + globalJS + "\n"
	jsFileName += "global"
	instantiate := ""
	for _, file := range jsFiles {
		if strings.Contains(html, "</"+file+">") {
			js += "//------------\n//" + file + ".js\n" + loadFile("www/js/"+file+".js") + "\n"
			jsFileName += file
			instantiate += "let " + strcase.ToLowerCamel(file) + " = new " + strcase.ToCamel(file) + "()\n"
		}
	}
	instantiate += "GS.emit('instantiation')\n"
	js += instantiate
	splits := strings.Split(html, "</body>")

	jsFileName = "js/" + fmt.Sprintf("%x", md5.Sum([]byte(jsFileName))) + ".js"

	minified := bytes.NewBufferString("")
	err := m.Minify("application/javascript", minified, strings.NewReader(js))
	if err != nil {
		panic(err)
	}
	ioutil.WriteFile("dist/"+jsFileName, minified.Bytes(), 0644)
	html = splits[0] + "<script src=\"" + jsFileName + "\"></script>" + "</body>" + splits[1]

	html = strings.ReplaceAll(html, "<script>var GS = {};</script>", "<script>var GS = {}; GS.noBuild = true;</script>")
	return html, nil
}

func loadAllJS() ([]string, error) {
	files, err := ioutil.ReadDir("./www/js")
	if err != nil {
		return nil, err
	}
	results := []string{}
	for _, file := range files {
		if strings.HasSuffix(file.Name(), ".js") {
			results = append(results, file.Name()[0:len(file.Name())-3])
		}
	}
	return results, nil
}
