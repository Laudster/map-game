from flask import Flask, render_template, session
from flask_socketio import SocketIO
from data import generate_data
from json import load, dump
from random import sample, choice
from itertools import islice
from os import listdir

app = Flask(__name__)
app.secret_key = "hemmelig"
socket = SocketIO(app)

@app.route("/")
def home():
    with open("countries/" + str(choice(listdir("countries/"))), "r") as file:
        session["country"] = load(file)

    return render_template("index.html")

@socket.on("establish_relation")
def establish_relation():
    session["lifes"] = 9

@socket.on("check-answer")
def check_answer():
    return session["country"]["answer"]

@socket.on("lower-lives")
def lower_lives():
    session["lifes"] -= 1
    return session["lifes"]

@socket.on("get-hints")
def get_hints(spot):
    data = session["country"]
    returnData = data[spot]
    items = list(returnData.items())
    returnData = dict(islice(items, 4))
    return returnData

@socket.on("new-country")
def new_country():
    session["lifes"] = 9
    with open("countries/" + str(choice(listdir("countries/"))), "r") as file:
        session["country"] = load(file)

if __name__ == "__main__":
    socket.run(app, debug=True)