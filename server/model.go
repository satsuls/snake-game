package main

import (
	"encoding/json"
	"io/ioutil"
)

type ScoreBoard []Score

type Score struct {
	Player string `json:"player"`
	Score  int    `json:"score"`
	Time   int    `json:"time"`
}

func (s *Score) ReadFromBytes(data []byte) error {
	err := json.Unmarshal(data, s)
	if err != nil {
		return err
	}
	return nil
}

func (s Score) WriteToFile(fileName string) error {
	var scoreBoard ScoreBoard
	err := scoreBoard.ReadFromFile(fileName)
	if err != nil {
		return err
	}

	found := false
	for i, v := range scoreBoard {
		if s.Player == v.Player {
			found = true
			if s.Score > v.Score {
				scoreBoard[i] = s
			}
		}
	}

	if !found {
		scoreBoard = append(scoreBoard, s)
	}

	data, err := json.Marshal(scoreBoard)
	if err != nil {
		return err
	}

	err = ioutil.WriteFile(fileName, data, 0644)
	if err != nil {
		return err
	}

	return nil
}

func (s ScoreBoard) Sort() {
	l := len(s)
	for i := 0; i < l-1; i++ {
		for j := 0; j < l-i-1; j++ {
			if s[j].Score < s[j+1].Score {
				s[j], s[j+1] = s[j+1], s[j]
			}
		}
	}
}

func (s ScoreBoard) ToBytes() ([]byte, error) {
	data, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return data, nil
}

func (s *ScoreBoard) ReadFromFile(fileName string) error {
	data, err := ioutil.ReadFile(scoreBoardFileName)
	if err != nil {
		return err
	}

	err = json.Unmarshal(data, &s)
	if err != nil {
		return err
	}

	return nil
}
