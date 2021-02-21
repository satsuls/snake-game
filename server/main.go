package main

import (
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
)

const (
	scoreBoardFileName = "./scoreboard.json"
	templateFileName   = "./../src/index.html"
)

var tmpl *template.Template

func main() {
	var err error
	tmpl, err = template.ParseGlob(templateFileName)
	if err != nil {
		log.Fatalf("Can't load template: %s", err.Error())
	}

	src := http.FileServer(http.Dir("./../src"))
	http.Handle("/src/", http.StripPrefix("/src/", src))

	http.HandleFunc("/", enableCORS(gameIndexHandler))
	http.HandleFunc("/api/scoreboard", enableCORS(scoreBoardHandler))

	log.Fatalln(http.ListenAndServe(":8080", nil))
}

func gameIndexHandler(w http.ResponseWriter, r *http.Request) {
	tmpl.Execute(w, nil)
}

func scoreBoardHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getScoreBoard(w, r)
	case http.MethodPost:
		addScore(w, r)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func getScoreBoard(w http.ResponseWriter, r *http.Request) {
	var scoreBoard ScoreBoard
	err := scoreBoard.ReadFromFile(scoreBoardFileName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	scoreBoard.Sort()
	data, err := scoreBoard.ToBytes()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.Write(data)
}

func addScore(w http.ResponseWriter, r *http.Request) {
	var score Score

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	err = score.ReadFromBytes(body)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	err = score.WriteToFile(scoreBoardFileName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func writeError(w http.ResponseWriter, status int, err error) {
	w.WriteHeader(status)
	w.Write([]byte(err.Error()))
}
