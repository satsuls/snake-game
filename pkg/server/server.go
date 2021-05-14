package server

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"text/template"

	"github.com/satsuls/space-invaders/pkg/model"
)

const (
	scoreBoardFileName = "./scoreboard/scoreboard.json"
	templateFileName   = "./website/index.html"
)

var tmpl *template.Template

func Run() {
	var err error
	tmpl, err = template.ParseGlob(templateFileName)
	if err != nil {
		log.Fatalf("Can't load template: %s", err.Error())
	}

	src := http.FileServer(http.Dir("./website/src"))
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
	var scoreBoard model.ScoreBoard
	err := scoreBoard.ReadFromFile(scoreBoardFileName)
	if err != nil {
		fmt.Println(err.Error())
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	scoreBoard.Sort()
	data, err := scoreBoard.ToBytes()
	if err != nil {
		fmt.Println(err.Error())
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.Write(data)
}

func addScore(w http.ResponseWriter, r *http.Request) {
	var score model.Score

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		fmt.Println(err.Error())
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	err = score.ReadFromBytes(body)
	if err != nil {
		fmt.Println(err.Error())
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	err = score.WriteToFile(scoreBoardFileName)
	if err != nil {
		fmt.Println(err.Error())
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func writeError(w http.ResponseWriter, status int, err error) {
	w.WriteHeader(status)
	w.Write([]byte(err.Error()))
}
